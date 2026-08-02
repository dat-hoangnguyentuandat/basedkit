import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installer = path.join(repositoryRoot, 'installer', 'install.mjs');

function runInstaller(target, provider = 'both', bundles = 'base') {
  return JSON.parse(execFileSync(process.execPath, [
    installer,
    '--source', repositoryRoot,
    '--target', target,
    '--provider', provider,
    '--bundles', bundles,
  ], { encoding: 'utf8' }));
}

test('installs Claude and Codex into an existing project without deleting user files', async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basedkit-install-'));
  await mkdir(path.join(target, '.claude'), { recursive: true });
  await mkdir(path.join(target, '.codex'), { recursive: true });
  await writeFile(path.join(target, '.claude', 'user-file.txt'), 'keep me\n');
  await writeFile(path.join(target, '.claude', 'settings.json'), JSON.stringify({ theme: 'dark' }));
  await writeFile(path.join(target, '.codex', 'config.toml'), 'model = "custom"\n');
  await writeFile(path.join(target, 'AGENTS.md'), '# Existing instructions\n');

  const result = runInstaller(target);
  assert.equal(result.provider, 'both');
  assert.equal(await readFile(path.join(target, '.claude', 'user-file.txt'), 'utf8'), 'keep me\n');

  const settings = JSON.parse(await readFile(path.join(target, '.claude', 'settings.json'), 'utf8'));
  assert.equal(settings.theme, 'dark');
  assert.match(JSON.stringify(settings.hooks), /\.claude\/hooks\/session-init\.cjs/);
  assert.equal(settings.statusLine.command, 'node .claude/statusline.cjs');

  const codexConfig = await readFile(path.join(target, '.codex', 'config.toml'), 'utf8');
  assert.match(codexConfig, /model = "custom"/);
  assert.match(codexConfig, /\[agents\.planner\]/);
  const instructions = await readFile(path.join(target, 'AGENTS.md'), 'utf8');
  assert.match(instructions, /# Existing instructions/);
  assert.match(instructions, /BasedKit Engineer/);

  const codexAgents = await readdir(path.join(target, '.codex', 'agents'));
  assert.equal(codexAgents.length, 17);
  assert.match(await readFile(path.join(target, '.codex', 'agents', 'planner.toml'), 'utf8'), /developer_instructions/);
  assert.ok((await readdir(path.join(target, '.agents', 'skills'))).includes('basedkit-plan'));
  assert.ok((await readdir(path.join(target, '.agents', 'skills', 'claude-code'))).includes('SKILL.md'));
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'io-sitemap')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo')), false);
});

test('installs selected bundles and removes deselected unmodified bundle files', () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basedkit-bundles-'));
  const cms = runInstaller(target, 'codex', 'base,cms');
  assert.deepEqual(cms.bundles, ['base', 'cms']);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'io-sitemap', 'SKILL.md')), true);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo', 'SKILL.md')), true);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark', 'SKILL.md')), false);
  assert.match(
    readFileSync(path.join(target, '.agents', 'skills', 'theme-cms', 'SKILL.md'), 'utf8'),
    /\.agents\/skills\/seo\/SKILL\.md/,
  );

  const ui = runInstaller(target, 'codex', 'base,ui-ux');
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'io-sitemap')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark', 'SKILL.md')), true);
  assert.ok(ui.result.codex.removed > 0);

  const base = runInstaller(target, 'codex', 'base');
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark')), false);
  assert.ok(base.result.codex.removed > 0);
});

test('migrates an earlier managed installation to BasedKit paths', async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basedkit-migration-'));
  const legacyId = ['base', 'kit'].join('');
  const obsoleteRelative = path.join('.codex', legacyId, 'obsolete.txt');
  const obsoleteContent = 'managed by the earlier installation\n';
  await mkdir(path.join(target, '.codex', `.${legacyId}`), { recursive: true });
  await mkdir(path.dirname(path.join(target, obsoleteRelative)), { recursive: true });
  await writeFile(path.join(target, obsoleteRelative), obsoleteContent);
  await writeFile(path.join(target, '.codex', `.${legacyId}`, 'manifest.json'), JSON.stringify({
    version: 1,
    provider: 'codex',
    files: {
      [obsoleteRelative.replaceAll(path.sep, '/')]: createHash('sha256').update(obsoleteContent).digest('hex'),
    },
  }));
  await writeFile(path.join(target, '.codex', 'config.toml'), [
    `# >>> ${legacyId} agents >>>`,
    '[agents.old]',
    `# <<< ${legacyId} agents <<<`,
    '',
  ].join('\n'));
  await writeFile(path.join(target, 'AGENTS.md'), [
    `<!-- >>> ${legacyId} instructions >>>`,
    '# Earlier instructions',
    `<!-- <<< ${legacyId} instructions <<< -->`,
    '',
  ].join('\n'));

  runInstaller(target, 'codex');

  assert.equal(existsSync(path.join(target, obsoleteRelative)), false);
  assert.equal(existsSync(path.join(target, '.codex', `.${legacyId}`)), false);
  assert.equal(existsSync(path.join(target, '.codex', '.basedkit', 'manifest.json')), true);
  assert.doesNotMatch(readFileSync(path.join(target, '.codex', 'config.toml'), 'utf8'), new RegExp(legacyId));
  assert.doesNotMatch(readFileSync(path.join(target, 'AGENTS.md'), 'utf8'), new RegExp(legacyId));
  assert.match(readFileSync(path.join(target, 'AGENTS.md'), 'utf8'), /BasedKit Engineer/);
});

test('is idempotent and preserves a user-modified managed file as a conflict', async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basedkit-update-'));
  runInstaller(target, 'claude');
  const managedFile = path.join(target, '.claude', 'commands', 'ask.md');
  writeFileSync(managedFile, 'user customization\n');

  const result = runInstaller(target, 'claude');
  assert.equal(readFileSync(managedFile, 'utf8'), 'user customization\n');
  assert.equal(result.result.claude.conflicts, 1);
  const conflict = path.join(
    target,
    '.claude',
    '.basedkit',
    'conflicts',
    '.claude',
    'commands',
    'ask.md',
  );
  assert.match(readFileSync(conflict, 'utf8'), /description:/);
});
