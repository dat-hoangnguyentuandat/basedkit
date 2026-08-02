import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkForUpdate, updateSummary } from '../bin/update-check.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metadataWriter = path.join(repositoryRoot, 'installer', 'write-release-metadata.mjs');
const installedCommit = '1111111111111111111111111111111111111111';
const latestCommit = '2222222222222222222222222222222222222222';

async function makeInstallation(commit = installedCommit) {
  const home = mkdtempSync(path.join(os.tmpdir(), 'basedkit-update-'));
  const app = path.join(home, 'app');
  await mkdir(app, { recursive: true });
  await writeFile(path.join(app, '.basedkit-release.json'), JSON.stringify({
    schemaVersion: 1,
    version: '1.1.0',
    repository: 'owner/repository',
    ref: 'main',
    installedCommit: commit,
  }));
  return app;
}

function response(sha, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => ({ sha }) };
}

test('detects an available update and reuses the cached result', async () => {
  const app = await makeInstallation();
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    return response(latestCommit);
  };
  const first = await checkForUpdate({ sourceRoot: app, fetchImpl, now: 1000 });
  const second = await checkForUpdate({ sourceRoot: app, fetchImpl, now: 2000 });
  assert.equal(first.status, 'available');
  assert.equal(second.status, 'available');
  assert.equal(second.cached, true);
  assert.equal(requests, 1);
  assert.equal(updateSummary(first), 'A new BasedKit update is available.');
  assert.doesNotMatch(updateSummary(first), /a{40}|b{40}|aaaaaaa|bbbbbbb/);
});

test('reports a current installation', async () => {
  const app = await makeInstallation(installedCommit);
  const state = await checkForUpdate({
    sourceRoot: app,
    fetchImpl: async () => response(installedCommit),
    force: true,
  });
  assert.equal(state.status, 'current');
  assert.equal(updateSummary(state), 'BasedKit is up to date.');
  assert.doesNotMatch(updateSummary(state), /a{40}|aaaaaaa/);
});

test('does not block the launcher when GitHub is unavailable', async () => {
  const app = await makeInstallation();
  const state = await checkForUpdate({
    sourceRoot: app,
    fetchImpl: async () => { throw new Error('offline'); },
    force: true,
  });
  assert.equal(state.status, 'unavailable');
  assert.match(updateSummary(state), /offline/);
});

test('writes release metadata used by future checks', async () => {
  const app = mkdtempSync(path.join(os.tmpdir(), 'basedkit-metadata-'));
  execFileSync(process.execPath, [
    metadataWriter,
    '--app', app,
    '--repository', 'owner/repository',
    '--ref', 'stable',
    '--version', '1.1.0',
    '--commit', latestCommit,
  ]);
  const metadata = JSON.parse(await readFile(path.join(app, '.basedkit-release.json'), 'utf8'));
  assert.equal(metadata.installedCommit, latestCommit);
  assert.equal(metadata.repository, 'owner/repository');
  assert.equal(metadata.ref, 'stable');
});
