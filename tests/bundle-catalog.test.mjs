import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadBundleCatalog } from '../bin/bundle-catalog.mjs';

test('discovers a new bundle and its skills without launcher code changes', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'basekit-catalog-'));
  const bundleRoot = path.join(root, 'bundles', 'quality');
  await mkdir(path.join(bundleRoot, 'skills', 'accessibility'), { recursive: true });
  await mkdir(path.join(bundleRoot, 'skills', 'performance'), { recursive: true });
  await writeFile(path.join(bundleRoot, 'bundle.json'), JSON.stringify({
    id: 'quality',
    name: 'Quality',
    description: 'Accessibility and performance workflows.',
    order: 40,
  }));

  const catalog = await loadBundleCatalog(root);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'quality');
  assert.equal(catalog[0].name, 'Quality');
  assert.equal(catalog[0].skillCount, 2);
});
