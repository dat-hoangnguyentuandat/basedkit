import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
  const target = mkdtempSync(path.join(os.tmpdir(), 'basekit-install-'));
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
  assert.match(instructions, /BaseKit Engineer/);

  const codexAgents = await readdir(path.join(target, '.codex', 'agents'));
  assert.equal(codexAgents.length, 17);
  assert.match(await readFile(path.join(target, '.codex', 'agents', 'planner.toml'), 'utf8'), /developer_instructions/);
  assert.ok((await readdir(path.join(target, '.agents', 'skills'))).includes('bk-plan'));
  assert.ok((await readdir(path.join(target, '.agents', 'skills', 'claude-code'))).includes('SKILL.md'));
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo')), false);
});

test('installs selected bundles and removes deselected unmodified bundle files', () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basekit-bundles-'));
  const cms = runInstaller(target, 'codex', 'base,cms');
  assert.deepEqual(cms.bundles, ['base', 'cms']);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo', 'SKILL.md')), true);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark', 'SKILL.md')), false);
  assert.match(
    readFileSync(path.join(target, '.agents', 'skills', 'theme-cms', 'SKILL.md'), 'utf8'),
    /\.agents\/skills\/seo\/SKILL\.md/,
  );

  const ui = runInstaller(target, 'codex', 'base,ui-ux');
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'seo')), false);
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark', 'SKILL.md')), true);
  assert.ok(ui.result.codex.removed > 0);

  const base = runInstaller(target, 'codex', 'base');
  assert.equal(existsSync(path.join(target, '.agents', 'skills', 'hallmark')), false);
  assert.ok(base.result.codex.removed > 0);
});

test('is idempotent and preserves a user-modified managed file as a conflict', async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basekit-update-'));
  runInstaller(target, 'claude');
  const managedFile = path.join(target, '.claude', 'commands', 'ask.md');
  writeFileSync(managedFile, 'user customization\n');

  const result = runInstaller(target, 'claude');
  assert.equal(readFileSync(managedFile, 'utf8'), 'user customization\n');
  assert.equal(result.result.claude.conflicts, 1);
  const conflict = path.join(
    target,
    '.claude',
    '.basekit',
    'conflicts',
    '.claude',
    'commands',
    'ask.md',
  );
  assert.match(readFileSync(conflict, 'utf8'), /description:/);
});
