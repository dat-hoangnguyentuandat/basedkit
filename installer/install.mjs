#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_VERSION = 1;
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

function transformCodexText(content) {
  return content
    .replaceAll('$HOME/.claude/skills', '.agents/skills')
    .replaceAll('~/.claude/skills', '.agents/skills')
    .replaceAll('./.claude/skills', './.agents/skills')
    .replaceAll('.claude/skills', '.agents/skills')
    .replaceAll('./.claude/rules', './.codex/basekit/rules')
    .replaceAll('.claude/rules', '.codex/basekit/rules')
    .replaceAll('./.claude/workflows', './.codex/basekit/workflows')
    .replaceAll('.claude/workflows', '.codex/basekit/workflows')
    .replaceAll('./.claude/scripts', './.codex/basekit/scripts')
    .replaceAll('.claude/scripts', '.codex/basekit/scripts')
    .replaceAll('./.claude/hooks', './.codex/basekit/hooks')
    .replaceAll('.claude/hooks', '.codex/basekit/hooks')
    .replaceAll('.claude/.bk.json', '.codex/basekit/.bk.json')
    .replaceAll('.claude/.env', '.codex/basekit/.env');
}

function maybeTransformCodex(buffer, sourceRelative) {
  if (buffer.includes(0)) return buffer;
  if (normalizeRelative(sourceRelative).startsWith('skills/claude-code/')) return buffer;
  return Buffer.from(transformCodexText(buffer.toString('utf8')), 'utf8');
}

class ManagedInstaller {
  constructor(targetRoot, manifestPath, provider) {
    this.targetRoot = targetRoot;
    this.manifestPath = manifestPath;
    this.provider = provider;
    this.previous = { files: {} };
    this.next = { version: MANIFEST_VERSION, provider, files: {} };
    this.summary = { installed: 0, updated: 0, unchanged: 0, conflicts: 0 };
  }

  async initialize() {
    this.previous = await readJson(this.manifestPath, { files: {} });
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

  async save() {
    await writeJson(this.manifestPath, this.next);
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

function replaceMarkedBlock(original, start, end, block) {
  const begin = original.indexOf(start);
  const finish = original.indexOf(end);
  const rendered = `${start}\n${block.trim()}\n${end}`;
  if (begin !== -1 && finish > begin) {
    return `${original.slice(0, begin)}${rendered}${original.slice(finish + end.length)}`;
  }
  return `${original.trimEnd()}${original.trim() ? '\n\n' : ''}${rendered}\n`;
}

async function mergeTextFile(filePath, start, end, block) {
  const original = existsSync(filePath) ? await readFile(filePath, 'utf8') : '';
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, replaceMarkedBlock(original, start, end, block), 'utf8');
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

async function installClaude(engineerRoot, targetRoot) {
  const claudeRoot = path.join(targetRoot, '.claude');
  await mkdir(claudeRoot, { recursive: true });
  const managed = new ManagedInstaller(
    targetRoot,
    path.join(claudeRoot, '.basekit', 'manifest.json'),
    'claude',
  );
  await managed.initialize();
  for (const relative of await listFiles(engineerRoot)) {
    if (isExcluded(relative)) continue;
    await managed.installFile(path.join(engineerRoot, relative), path.join('.claude', relative));
  }
  await mergeClaudeSettings(targetRoot);
  await managed.save();
  return managed.summary;
}

async function buildCodexInstructions(engineerRoot) {
  const sections = ['workflows/development-rules.md', 'workflows/primary-workflow.md',
    'workflows/orchestration-protocol.md', 'workflows/documentation-management.md',
    'rules/console-url-handling.md'];
  const content = ['# BaseKit Engineer', '',
    'Use skills from `.agents/skills` when their descriptions match the task.',
    'BaseKit support files are stored under `.codex/basekit`.'];
  for (const relative of sections) {
    const filePath = path.join(engineerRoot, relative);
    if (existsSync(filePath)) content.push('', transformCodexText(await readFile(filePath, 'utf8')));
  }
  return content.join('\n');
}

async function installCodex(engineerRoot, targetRoot) {
  const codexRoot = path.join(targetRoot, '.codex');
  await mkdir(codexRoot, { recursive: true });
  const managed = new ManagedInstaller(
    targetRoot,
    path.join(codexRoot, '.basekit', 'manifest.json'),
    'codex',
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
        path.join('.codex', 'basekit', relative),
        (buffer) => maybeTransformCodex(buffer, normalized),
      );
    }
  }

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
    const skillName = `bk-${segments.join('-')}`.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const markdown = await readFile(path.join(engineerRoot, relative), 'utf8');
    const parsed = parseFrontmatter(markdown, segments.join('-'));
    const description = (parsed.attributes.description || `Run the BaseKit ${segments.join(':')} workflow`)
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
      `Use this skill for the BaseKit command \`/${segments.join(':')}\`.`,
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
    '# >>> basekit agents >>>',
    '# <<< basekit agents <<<',
    configBlock,
  );
  await mergeTextFile(
    path.join(targetRoot, 'AGENTS.md'),
    '<!-- >>> basekit instructions >>>',
    '<!-- <<< basekit instructions <<< -->',
    await buildCodexInstructions(engineerRoot),
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
  if (!existsSync(engineerRoot)) throw new Error(`Engineer kit not found at ${engineerRoot}`);
  if (!['claude', 'codex', 'both'].includes(provider)) {
    throw new Error('Provider must be claude, codex, or both');
  }

  const result = {};
  if (provider === 'claude' || provider === 'both') result.claude = await installClaude(engineerRoot, targetRoot);
  if (provider === 'codex' || provider === 'both') result.codex = await installCodex(engineerRoot, targetRoot);
  console.log(JSON.stringify({ target: targetRoot, provider, result }, null, 2));
}

main().catch((error) => {
  console.error(`BaseKit installation failed: ${error.message}`);
  process.exit(1);
});
