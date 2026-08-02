import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const launcher = path.join(repositoryRoot, 'bin', 'basekit.mjs');

test('prints launcher help and version', () => {
  const help = execFileSync(process.execPath, [launcher, '--help'], { encoding: 'utf8' });
  const version = execFileSync(process.execPath, [launcher, '--version'], { encoding: 'utf8' });
  assert.match(help, /basekit claude/);
  assert.match(help, /basekit codex/);
  assert.match(help, /basekit update --check/);
  assert.match(version, /^basekit \d+\.\d+\.\d+/);
});

test('requires an explicit provider when no terminal is attached', () => {
  const result = spawnSync(process.execPath, [launcher], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Interactive input is unavailable/);
});

test('installs a provider through the launcher shortcut', async () => {
  const target = mkdtempSync(path.join(os.tmpdir(), 'basekit-launcher-'));
  execFileSync(process.execPath, [launcher, 'claude', '--target', target], { encoding: 'utf8' });
  const settings = JSON.parse(await readFile(path.join(target, '.claude', 'settings.json'), 'utf8'));
  assert.equal(settings.statusLine.command, 'node .claude/statusline.cjs');
  assert.match(JSON.stringify(settings.hooks), /session-init\.cjs/);
});
