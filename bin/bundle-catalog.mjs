import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function loadBundleCatalog(sourceRoot) {
  const bundlesRoot = path.join(sourceRoot, 'bundles');
  if (!existsSync(bundlesRoot)) return [];
  const entries = await readdir(bundlesRoot, { withFileTypes: true });
  const bundles = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const bundleRoot = path.join(bundlesRoot, entry.name);
    const metadataPath = path.join(bundleRoot, 'bundle.json');
    if (!existsSync(metadataPath)) continue;
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    if (metadata.id !== entry.name || !metadata.name || !metadata.description) {
      throw new Error(`Invalid bundle metadata at ${metadataPath}`);
    }
    const skillsRoot = path.join(bundleRoot, 'skills');
    const skillCount = existsSync(skillsRoot)
      ? (await readdir(skillsRoot, { withFileTypes: true })).filter((item) => item.isDirectory()).length
      : 0;
    bundles.push({ ...metadata, order: Number(metadata.order) || 100, skillCount });
  }
  return bundles.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}
