#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const VERSION = '1.0.0';
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enginePath = path.join(sourceRoot, 'installer', 'install.mjs');

function parseArgs(argv) {
  const options = { command: null, target: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--target' || value === '-C') {
      options.target = path.resolve(argv[index + 1]);
      index += 1;
    } else if (!options.command) {
      options.command = value.toLowerCase();
    }
  }
  return options;
}

function printHelp() {
  console.log(`BaseKit ${VERSION}

Usage:
  basekit                  Open the interactive installer
  basekit claude           Install for Claude Code
  basekit codex            Install for Codex
  basekit both             Install for both providers
  basekit <provider> -C .  Install into a specific project
  basekit version          Print the launcher version
  basekit help             Print this help`);
}

function providerState(target, provider) {
  const directory = provider === 'claude' ? '.claude' : '.codex';
  return existsSync(path.join(target, directory)) ? 'detected' : 'new';
}

function renderMenu(items, selected, target) {
  process.stdout.write('\x1b[2J\x1b[H');
  const width = 62;
  const border = `+${'-'.repeat(width)}+`;
  console.log('\n                         b a s e k i t\n');
  console.log(`  ${border}`);
  console.log(`  | ${'Project kit installer'.padEnd(width - 1)}|`);
  console.log(`  | ${target.slice(0, width - 3).padEnd(width - 1)}|`);
  console.log(`  | ${`Claude: ${providerState(target, 'claude')}  Codex: ${providerState(target, 'codex')}`.padEnd(width - 1)}|`);
  console.log(`  ${border}`);
  for (let index = 0; index < items.length; index += 1) {
    const prefix = selected === index ? ' > ' : '   ';
    const line = `${prefix}${index + 1}. ${items[index].label}`;
    if (selected === index) process.stdout.write('\x1b[30;46m');
    console.log(line.padEnd(width + 3));
    if (selected === index) process.stdout.write('\x1b[0m');
  }
  console.log(`\n  ${items[selected].hint}`);
  console.log(`\n  Up/Down to move - Enter to select - 1-${items.length} quick keys - Esc to quit`);
}

async function chooseProvider(target) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    throw new Error('Interactive input is unavailable. Run basekit claude, basekit codex, or basekit both.');
  }
  const items = [
    { label: 'Claude Code', value: 'claude', hint: 'Install or update BaseKit in .claude.' },
    { label: 'Codex', value: 'codex', hint: 'Install or update Codex agents and repository skills.' },
    { label: 'Both', value: 'both', hint: 'Install or update both provider integrations.' },
    { label: 'Exit', value: null, hint: 'Close BaseKit without changing this project.' },
  ];
  let selected = 0;
  renderMenu(items, selected, target);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) => {
    const finish = (value) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\x1b[0m\n');
      resolve(value);
    };
    const onData = (buffer) => {
      const key = buffer.toString();
      if (key === '\u0003' || key === '\u001b' || key.toLowerCase() === 'q') return finish(null);
      if (key === '\r' || key === '\n') return finish(items[selected].value);
      if (key === '\u001b[A' || key.toLowerCase() === 'k') selected = (selected - 1 + items.length) % items.length;
      else if (key === '\u001b[B' || key.toLowerCase() === 'j') selected = (selected + 1) % items.length;
      else if (/^[1-4]$/.test(key)) return finish(items[Number(key) - 1].value);
      renderMenu(items, selected, target);
    };
    process.stdin.on('data', onData);
  });
}

function install(provider, target) {
  console.log(`Installing BaseKit for ${provider} in ${target}...`);
  const result = spawnSync(process.execPath, [
    enginePath,
    '--source', sourceRoot,
    '--target', target,
    '--provider', provider,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log('\nBaseKit installation complete. Restart the provider if it is already running.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (['help', '-h', '--help'].includes(options.command)) return printHelp();
  if (['version', '-v', '--version'].includes(options.command)) return console.log(`basekit ${VERSION}`);
  let provider = options.command;
  if (!provider) provider = await chooseProvider(options.target);
  if (!provider) return;
  if (!['claude', 'codex', 'both'].includes(provider)) {
    printHelp();
    throw new Error(`Unknown command: ${provider}`);
  }
  install(provider, options.target);
}

main().catch((error) => {
  console.error(`BaseKit launcher failed: ${error.message}`);
  process.exit(1);
});
