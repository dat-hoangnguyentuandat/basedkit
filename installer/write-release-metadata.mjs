#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith('--')) {
      result[argv[index].slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
if (!args.app) throw new Error('--app is required');

const metadata = {
  schemaVersion: 1,
  version: args.version || '1.2.0',
  repository: args.repository || 'dat-hoangnguyentuandat/basekit',
  ref: args.ref || 'main',
  installedCommit: args.commit || null,
  installedAt: new Date().toISOString(),
};

const destination = path.join(path.resolve(args.app), '.basekit-release.json');
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
console.log(`Recorded BaseKit release metadata at ${destination}`);
