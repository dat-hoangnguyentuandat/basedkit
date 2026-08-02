#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, readdir, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_VERSION = 1;
const LEGACY_PRODUCT_ID = ['base', 'kit'].join('');
const EXCLUDED_SOURCE_PATHS = [
  '.claude',
  'metadata.json',
  'settings.local.json',
  'settings.local.json.bak_',
  'skills/document-skills/docx',
  'skills/document-skills/pdf',
  'skills/document-skills/pptx',
  'skills/document-skills/xlsx',
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith('--')) args[argv[index].slice(2)] = argv[index + 1];
  }
  return args;
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function isExcluded(relativePath) {
  const normalized = normalizeRelative(relativePath);
  return EXCLUDED_SOURCE_PATHS.some((entry) =>
    normalized === entry || normalized.startsWith(`${entry}/`) || normalized.startsWith(entry),
  );
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw new Error(`Cannot parse JSON file ${filePath}: ${error.message}`);
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function listFiles(root, relative = '') {
  const current = path.join(root, relative);
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

async function loadBundleCatalog(sourceRoot) {
  const bundlesRoot = path.join(sourceRoot, 'bundles');
  if (!existsSync(bundlesRoot)) return [];
  const entries = await readdir(bundlesRoot, { withFileTypes: true });
  const bundles = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bundleRoot = path.join(bundlesRoot, entry.name);
    const metadataPath = path.join(bundleRoot, 'bundle.json');
    if (!existsSync(metadataPath)) continue;
    const metadata = await readJson(metadataPath, null);
    if (!metadata || metadata.id !== entry.name || !metadata.name || !metadata.description) {
      throw new Error(`Invalid bundle metadata at ${metadataPath}`);
    }
    bundles.push({
      ...metadata,
      order: Number(metadata.order) || 100,
      root: bundleRoot,
      skillsRoot: path.join(bundleRoot, 'skills'),
    });
  }
  return bundles.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}

function transformCodexText(content) {
  return content
    .replaceAll('$HOME/.claude/skills', '.agents/skills')
    .replaceAll('~/.claude/skills', '.agents/skills')
    .replaceAll('./.claude/skills', './.agents/skills')
    .replaceAll('.claude/skills', '.agents/skills')
    .replaceAll('./.claude/rules', './.codex/basedkit/rules')
    .replaceAll('.claude/rules', '.codex/basedkit/rules')
    .replaceAll('./.claude/workflows', './.codex/basedkit/workflows')
    .replaceAll('.claude/workflows', '.codex/basedkit/workflows')
    .replaceAll('./.claude/scripts', './.codex/basedkit/scripts')
    .replaceAll('.claude/scripts', '.codex/basedkit/scripts')
    .replaceAll('./.claude/hooks', './.codex/basedkit/hooks')
    .replaceAll('.claude/hooks', '.codex/basedkit/hooks')
    .replaceAll('.claude/.basedkit.json', '.codex/basedkit/.basedkit.json')
    .replaceAll('.claude/.env', '.codex/basedkit/.env');
}

function maybeTransformCodex(buffer, sourceRelative) {
  if (buffer.includes(0)) return buffer;
  if (normalizeRelative(sourceRelative).startsWith('skills/claude-code/')) return buffer;
  return Buffer.from(transformCodexText(buffer.toString('utf8')), 'utf8');
}

class ManagedInstaller {
  constructor(targetRoot, manifestPath, provider, bundles, legacyManifestPath = null) {
    this.targetRoot = targetRoot;
    this.manifestPath = manifestPath;
    this.legacyManifestPath = legacyManifestPath;
    this.provider = provider;
    this.previous = { files: {} };
    this.next = { version: MANIFEST_VERSION, provider, bundles, files: {} };
    this.summary = { installed: 0, updated: 0, unchanged: 0, removed: 0, conflicts: 0, modifiedPreserved: 0 };
  }

  async initialize() {
    const previousPath = existsSync(this.manifestPath) ? this.manifestPath : this.legacyManifestPath;
    this.previous = previousPath ? await readJson(previousPath, { files: {} }) : { files: {} };
  }

  async installBuffer(targetRelative, content, sourceMode = 0o644) {
    const normalizedTarget = normalizeRelative(targetRelative);
    const destination = path.join(this.targetRoot, targetRelative);
    const incomingHash = sha256(content);
    await mkdir(path.dirname(destination), { recursive: true });

    if (!existsSync(destination)) {
      await writeFile(destination, content);
      await chmod(destination, sourceMode & 0o777);
      this.summary.installed += 1;
    } else {
      const current = await readFile(destination);
      const currentHash = sha256(current);
      const previousHash = this.previous.files?.[normalizedTarget];
      if (currentHash === incomingHash) {
        this.summary.unchanged += 1;
      } else if (previousHash && currentHash === previousHash) {
        await writeFile(destination, content);
        await chmod(destination, sourceMode & 0o777);
        this.summary.updated += 1;
      } else {
        const conflictPath = path.join(
          path.dirname(this.manifestPath),
          'conflicts',
          normalizedTarget,
        );
        await mkdir(path.dirname(conflictPath), { recursive: true });
        await writeFile(conflictPath, content);
        this.summary.conflicts += 1;
        return;
      }
    }
    this.next.files[normalizedTarget] = incomingHash;
  }

  async installFile(sourcePath, targetRelative, transform) {
    const sourceInfo = await stat(sourcePath);
    let content = await readFile(sourcePath);
    if (transform) content = transform(content);
    await this.installBuffer(targetRelative, content, sourceInfo.mode);
  }

  async removeStaleFiles() {
    for (const [relative, previousHash] of Object.entries(this.previous.files || {})) {
      if (this.next.files[relative]) continue;
      const destination = path.resolve(this.targetRoot, relative);
      const targetPrefix = `${path.resolve(this.targetRoot)}${path.sep}`.toLowerCase();
      if (!destination.toLowerCase().startsWith(targetPrefix)) throw new Error(`Unsafe stale path: ${relative}`);
      if (!existsSync(destination)) continue;
      const currentHash = sha256(await readFile(destination));
      if (currentHash !== previousHash) {
        this.summary.modifiedPreserved += 1;
        continue;
      }
      await unlink(destination);
      this.summary.removed += 1;
      let parent = path.dirname(destination);
      while (parent.toLowerCase().startsWith(targetPrefix) && parent !== this.targetRoot) {
        if ((await readdir(parent)).length > 0) break;
        await rmdir(parent);
        parent = path.dirname(parent);
      }
    }
  }

  async save() {
    await this.removeStaleFiles();
    await writeJson(this.manifestPath, this.next);
    if (this.legacyManifestPath && existsSync(this.legacyManifestPath)) {
      await unlink(this.legacyManifestPath);
      const legacyDirectory = path.dirname(this.legacyManifestPath);
      if ((await readdir(legacyDirectory)).length === 0) await rmdir(legacyDirectory);
    }
  }
}

function parseFrontmatter(markdown, fallbackName) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { attributes: {}, body: normalized, name: fallbackName };
  }
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { attributes: {}, body: normalized, name: fallbackName };
  const attributes = {};
  for (const line of normalized.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (match) attributes[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return { attributes, body: normalized.slice(end + 5), name: attributes.name || fallbackName };
}

function tomlMultiline(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('"""', '""\\"');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 96) || `agent_${sha256(value).slice(0, 8)}`;
}

function replaceMarkedBlock(original, start, end, block, legacyStart = null, legacyEnd = null) {
  let begin = original.indexOf(start);
  let finish = original.indexOf(end);
  let matchedEnd = end;
  if (begin === -1 && legacyStart && legacyEnd) {
    begin = original.indexOf(legacyStart);
    finish = original.indexOf(legacyEnd);
    matchedEnd = legacyEnd;
  }
  const rendered = `${start}\n${block.trim()}\n${end}`;
  if (begin !== -1 && finish > begin) {
    return `${original.slice(0, begin)}${rendered}${original.slice(finish + matchedEnd.length)}`;
  }
  return `${original.trimEnd()}${original.trim() ? '\n\n' : ''}${rendered}\n`;
}

async function mergeTextFile(filePath, start, end, block, legacyStart = null, legacyEnd = null) {
  const original = existsSync(filePath) ? await readFile(filePath, 'utf8') : '';
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, replaceMarkedBlock(original, start, end, block, legacyStart, legacyEnd), 'utf8');
}

function hookEntry(matcher, commands) {
  const entry = { hooks: commands.map((command) => ({ type: 'command', command })) };
  if (matcher) entry.matcher = matcher;
  return entry;
}

async function mergeClaudeSettings(targetRoot) {
  const settingsPath = path.join(targetRoot, '.claude', 'settings.json');
  const settings = await readJson(settingsPath, {});
  settings.hooks ??= {};
  const desired = {
    PreToolUse: [
      hookEntry('Bash', ['node .claude/hooks/block-db-write.cjs']),
      hookEntry('Bash|Glob|Grep|Read|Edit|Write', [
        'node .claude/hooks/scout-block.cjs',
        'node .claude/hooks/privacy-block.cjs',
      ]),
    ],
    SessionStart: [hookEntry('startup|resume|clear|compact', ['node .claude/hooks/session-init.cjs'])],
    SubagentStart: [hookEntry('*', ['node .claude/hooks/subagent-init.cjs'])],
    UserPromptSubmit: [hookEntry(null, ['node .claude/hooks/dev-rules-reminder.cjs'])],
  };
  for (const [event, entries] of Object.entries(desired)) {
    settings.hooks[event] ??= [];
    const existingCommands = JSON.stringify(settings.hooks[event]);
    for (const entry of entries) {
      const commands = entry.hooks.map((hook) => hook.command);
      if (!commands.every((command) => existingCommands.includes(command))) settings.hooks[event].push(entry);
    }
  }
  settings.statusLine ??= {
    type: 'command',
    command: 'node .claude/statusline.cjs',
    padding: 0,
  };
  await writeJson(settingsPath, settings);
}

async function installBundleSkills(managed, bundles, provider) {
  for (const bundle of bundles) {
    if (!existsSync(bundle.skillsRoot)) continue;
    for (const relative of await listFiles(bundle.skillsRoot)) {
      const target = provider === 'claude'
        ? path.join('.claude', 'skills', relative)
        : path.join('.agents', 'skills', relative);
      await managed.installFile(
        path.join(bundle.skillsRoot, relative),
        target,
        provider === 'codex' ? (buffer) => maybeTransformCodex(buffer, `skills/${normalizeRelative(relative)}`) : undefined,
      );
    }
  }
}

async function installClaude(engineerRoot, targetRoot, bundles, bundleIds) {
  const claudeRoot = path.join(targetRoot, '.claude');
  await mkdir(claudeRoot, { recursive: true });
  const managed = new ManagedInstaller(
    targetRoot,
    path.join(claudeRoot, '.basedkit', 'manifest.json'),
    'claude',
    bundleIds,
    path.join(claudeRoot, `.${LEGACY_PRODUCT_ID}`, 'manifest.json'),
  );
  await managed.initialize();
  for (const relative of await listFiles(engineerRoot)) {
    if (isExcluded(relative)) continue;
    await managed.installFile(path.join(engineerRoot, relative), path.join('.claude', relative));
  }
  await installBundleSkills(managed, bundles, 'claude');
  await mergeClaudeSettings(targetRoot);
  await managed.save();
  return managed.summary;
}

async function buildCodexInstructions(engineerRoot) {
  const sections = ['workflows/development-rules.md', 'workflows/primary-workflow.md',
    'workflows/orchestration-protocol.md', 'workflows/documentation-management.md',
    'rules/console-url-handling.md'];
  const content = ['# BasedKit Engineer', '',
    'Use skills from `.agents/skills` when their descriptions match the task.',
    'BasedKit support files are stored under `.codex/basedkit`.'];
  for (const relative of sections) {
    const filePath = path.join(engineerRoot, relative);
    if (existsSync(filePath)) content.push('', transformCodexText(await readFile(filePath, 'utf8')));
  }
  return content.join('\n');
}

async function installCodex(engineerRoot, targetRoot, bundles, bundleIds) {
  const codexRoot = path.join(targetRoot, '.codex');
  await mkdir(codexRoot, { recursive: true });
  const managed = new ManagedInstaller(
    targetRoot,
    path.join(codexRoot, '.basedkit', 'manifest.json'),
    'codex',
    bundleIds,
    path.join(codexRoot, `.${LEGACY_PRODUCT_ID}`, 'manifest.json'),
  );
  await managed.initialize();

  const sourceFiles = await listFiles(engineerRoot);
  for (const relative of sourceFiles) {
    if (isExcluded(relative)) continue;
    const normalized = normalizeRelative(relative);
    if (normalized.startsWith('skills/')) {
      const skillRelative = normalized === 'skills/claude-code/skill.md'
        ? 'claude-code/SKILL.md'
        : normalized.slice('skills/'.length);
      await managed.installFile(
        path.join(engineerRoot, relative),
        path.join('.agents', 'skills', skillRelative),
        (buffer) => maybeTransformCodex(buffer, normalized),
      );
    } else {
      await managed.installFile(
        path.join(engineerRoot, relative),
        path.join('.codex', 'basedkit', relative),
        (buffer) => maybeTransformCodex(buffer, normalized),
      );
    }
  }
  await installBundleSkills(managed, bundles, 'codex');

  const agentEntries = [];
  for (const relative of sourceFiles.filter((file) => normalizeRelative(file).startsWith('agents/'))) {
    if (!relative.toLowerCase().endsWith('.md')) continue;
    const markdown = await readFile(path.join(engineerRoot, relative), 'utf8');
    const fallbackName = path.basename(relative, '.md');
    const parsed = parseFrontmatter(markdown, fallbackName);
    const slug = slugify(parsed.name);
    const instructions = transformCodexText(parsed.body.trim());
    const toml = `developer_instructions = """\n${tomlMultiline(instructions)}\n"""\n`;
    await managed.installBuffer(path.join('.codex', 'agents', `${slug}.toml`), Buffer.from(toml));
    agentEntries.push({ slug, description: parsed.attributes.description || parsed.name });
  }

  for (const relative of sourceFiles.filter((file) => normalizeRelative(file).startsWith('commands/'))) {
    if (!relative.toLowerCase().endsWith('.md')) continue;
    const normalized = normalizeRelative(relative).slice('commands/'.length).replace(/\.md$/i, '');
    const segments = normalized.split('/');
    const skillName = `basedkit-${segments.join('-')}`.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const markdown = await readFile(path.join(engineerRoot, relative), 'utf8');
    const parsed = parseFrontmatter(markdown, segments.join('-'));
    const description = (parsed.attributes.description || `Run the BasedKit ${segments.join(':')} workflow`)
      .replace(/\s+/g, ' ').slice(0, 1024);
    const body = transformCodexText(parsed.body.trim()).replaceAll('$ARGUMENTS', '{{args}}');
    const skill = [
      '---',
      `name: ${JSON.stringify(skillName)}`,
      `description: ${JSON.stringify(description)}`,
      '---',
      '',
      `# ${skillName}`,
      '',
      `Use this skill for the BasedKit command \`/${segments.join(':')}\`.`,
      '',
      body,
      '',
    ].join('\n');
    await managed.installBuffer(
      path.join('.agents', 'skills', skillName, 'SKILL.md'),
      Buffer.from(skill),
    );
  }

  const configBlock = agentEntries.map(({ slug, description }) => [
    `[agents.${slug}]`,
    `description = ${JSON.stringify(description)}`,
    `config_file = "agents/${slug}.toml"`,
  ].join('\n')).join('\n\n');
  await mergeTextFile(
    path.join(codexRoot, 'config.toml'),
    '# >>> basedkit agents >>>',
    '# <<< basedkit agents <<<',
    configBlock,
    `# >>> ${LEGACY_PRODUCT_ID} agents >>>`,
    `# <<< ${LEGACY_PRODUCT_ID} agents <<<`,
  );
  await mergeTextFile(
    path.join(targetRoot, 'AGENTS.md'),
    '<!-- >>> basedkit instructions >>>',
    '<!-- <<< basedkit instructions <<< -->',
    await buildCodexInstructions(engineerRoot),
    `<!-- >>> ${LEGACY_PRODUCT_ID} instructions >>>`,
    `<!-- <<< ${LEGACY_PRODUCT_ID} instructions <<< -->`,
  );
  await managed.save();
  return managed.summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = path.resolve(args.source || '.');
  const engineerRoot = path.join(sourceRoot, 'engineer');
  const targetRoot = path.resolve(args.target || process.cwd());
  const provider = (args.provider || '').toLowerCase();
  const catalog = await loadBundleCatalog(sourceRoot);
  const requestedBundleIds = (args.bundles || 'base').split(',').map((value) => value.trim()).filter(Boolean);
  const bundleIds = [...new Set(['base', ...requestedBundleIds.filter((id) => id !== 'base')])];
  const unknownBundles = bundleIds.filter((id) => id !== 'base' && !catalog.some((bundle) => bundle.id === id));
  if (unknownBundles.length) throw new Error(`Unknown bundles: ${unknownBundles.join(', ')}`);
  const selectedBundles = catalog.filter((bundle) => bundleIds.includes(bundle.id));
  if (!existsSync(engineerRoot)) throw new Error(`Engineer kit not found at ${engineerRoot}`);
  if (!['claude', 'codex', 'both'].includes(provider)) {
    throw new Error('Provider must be claude, codex, or both');
  }

  const result = {};
  if (provider === 'claude' || provider === 'both') result.claude = await installClaude(engineerRoot, targetRoot, selectedBundles, bundleIds);
  if (provider === 'codex' || provider === 'both') result.codex = await installCodex(engineerRoot, targetRoot, selectedBundles, bundleIds);
  console.log(JSON.stringify({ target: targetRoot, provider, bundles: bundleIds, result }, null, 2));
}

main().catch((error) => {
  console.error(`BasedKit installation failed: ${error.message}`);
  process.exit(1);
});
