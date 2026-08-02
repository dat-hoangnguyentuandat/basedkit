#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { checkForUpdate, updateSummary } from './update-check.mjs';

const VERSION = '1.1.0';
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enginePath = path.join(sourceRoot, 'installer', 'install.mjs');

function parseArgs(argv) {
  const options = { command: null, target: process.cwd(), flags: new Set() };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--target' || value === '-C') {
      options.target = path.resolve(argv[index + 1]);
      index += 1;
    } else if (value.startsWith('-')) {
      options.flags.add(value);
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
  basekit update           Install the latest launcher and bundled kit
  basekit update --check   Check GitHub without installing
  basekit <provider> -C .  Install into a specific project
  basekit version          Print the launcher version
  basekit help             Print this help`);
}

function providerState(target, provider) {
  const directory = provider === 'claude' ? '.claude' : '.codex';
  return existsSync(path.join(target, directory)) ? 'detected' : 'new';
}

function renderMenu(items, selected, target, updateState) {
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
  if (updateState.status === 'available') process.stdout.write('\x1b[33m');
  console.log(`  ${updateSummary(updateState)}`);
  process.stdout.write('\x1b[0m');
  console.log(`\n  Up/Down to move - Enter to select - 1-${items.length} quick keys - Esc to quit`);
}

async function chooseAction(target, updateState) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    throw new Error('Interactive input is unavailable. Run basekit claude, basekit codex, or basekit both.');
  }
  const updateLabel = updateState.status === 'available' ? 'Update BaseKit (new version available)' : 'Check for Updates';
  const items = [
    { label: 'Claude Code', value: 'claude', hint: 'Install or update BaseKit in .claude.' },
    { label: 'Codex', value: 'codex', hint: 'Install or update Codex agents and repository skills.' },
    { label: 'Both', value: 'both', hint: 'Install or update both provider integrations.' },
    { label: updateLabel, value: 'update', hint: 'Compare this launcher with the latest GitHub revision.' },
    { label: 'Exit', value: null, hint: 'Close BaseKit without changing this project.' },
  ];
  let selected = 0;
  renderMenu(items, selected, target, updateState);
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
      else if (/^[1-5]$/.test(key)) return finish(items[Number(key) - 1].value);
      renderMenu(items, selected, target, updateState);
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

function runBootstrap(state) {
  const repository = state.repository || 'dat-hoangnguyentuandat/basekit';
  const ref = state.ref || 'main';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid update repository');
  if (!/^[A-Za-z0-9._/-]+$/.test(ref)) throw new Error('Invalid update ref');
  const scriptName = process.platform === 'win32' ? 'install.ps1' : 'install.sh';
  const url = `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${scriptName}`;
  console.log(`Updating BaseKit from ${repository}@${ref}...`);
  const result = process.platform === 'win32'
    ? spawnSync('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      `$env:BASEKIT_REPOSITORY='${repository}'; $env:BASEKIT_REF='${ref}'; $script = Invoke-RestMethod '${url}'; Invoke-Expression $script`,
    ], { stdio: 'inherit' })
    : spawnSync('sh', ['-c', 'curl -fsSL "$1" | sh', 'basekit-update', url], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Update installer exited with code ${result.status}`);
  console.log('BaseKit updated. Run basekit again to use the new launcher.');
}

async function handleUpdate({ checkOnly = false } = {}) {
  const state = await checkForUpdate({ sourceRoot, force: true });
  console.log(updateSummary(state));
  if (checkOnly || state.status === 'current') return;
  runBootstrap(state);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (['help', '-h', '--help'].includes(options.command) || options.flags.has('--help') || options.flags.has('-h')) return printHelp();
  if (['version', '-v', '--version'].includes(options.command) || options.flags.has('--version') || options.flags.has('-v')) return console.log(`basekit ${VERSION}`);
  if (options.command === 'update') return handleUpdate({ checkOnly: options.flags.has('--check') });
  let action = options.command;
  if (!action) {
    const updateState = await checkForUpdate({ sourceRoot });
    action = await chooseAction(options.target, updateState);
    if (action === 'update') return handleUpdate();
  }
  if (!action) return;
  if (!['claude', 'codex', 'both'].includes(action)) {
    printHelp();
    throw new Error(`Unknown command: ${action}`);
  }
  install(action, options.target);
}

main().catch((error) => {
  console.error(`BaseKit launcher failed: ${error.message}`);
  process.exit(1);
});
