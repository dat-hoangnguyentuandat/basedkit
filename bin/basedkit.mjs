#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadBundleCatalog } from './bundle-catalog.mjs';
import { checkForUpdate, updateSummary } from './update-check.mjs';

const VERSION = '2.0.0';
const WIDTH = 68;
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enginePath = path.join(sourceRoot, 'installer', 'install.mjs');

function parseArgs(argv) {
  const options = { command: null, target: process.cwd(), bundles: ['base'], flags: new Set() };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--target' || value === '-C') {
      if (!argv[index + 1]) throw new Error(`${value} requires a directory`);
      options.target = path.resolve(argv[index + 1]);
      index += 1;
    } else if (value === '--bundles') {
      if (!argv[index + 1]) throw new Error('--bundles requires a comma-separated list');
      options.bundles = argv[index + 1].split(',').map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (value.startsWith('-')) {
      options.flags.add(value);
    } else if (!options.command) {
      options.command = value.toLowerCase();
    }
  }
  if (!options.bundles.includes('base')) options.bundles.unshift('base');
  return options;
}

function printHelp() {
  console.log(`BasedKit ${VERSION}

Usage:
  basedkit                         Open the interactive launcher
  basedkit claude                  Install Base for Claude Code
  basedkit codex                   Install Base for Codex
  basedkit all                     Install Base for both providers
  basedkit codex --bundles base,cms
  basedkit update                  Install the latest launcher and bundled kit
  basedkit update --check          Check GitHub without installing
  basedkit <provider> -C .         Install into a specific project
  basedkit version                 Print the launcher version
  basedkit help                    Print this help`);
}

function clear() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function title(subtitle) {
  clear();
  console.log('\n                         b a s e d k i t\n');
  console.log(`  +${'-'.repeat(WIDTH)}+`);
  console.log(`  | ${subtitle.slice(0, WIDTH - 2).padEnd(WIDTH - 1)}|`);
  console.log(`  +${'-'.repeat(WIDTH)}+`);
}

function menuLine(label, selected, prefix = '') {
  const line = ` ${selected ? '>' : ' '} ${prefix}${label}`.padEnd(WIDTH + 3);
  if (selected) process.stdout.write('\x1b[30;46m');
  console.log(line);
  if (selected) process.stdout.write('\x1b[0m');
}

function ensureInteractive() {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    throw new Error('Interactive input is unavailable. Run basedkit claude, basedkit codex, or basedkit all.');
  }
}

function readKey() {
  ensureInteractive();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve) => {
    const onData = (buffer) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve(buffer.toString());
    };
    process.stdin.on('data', onData);
  });
}

async function selectMenu(render, itemCount, initial = 0) {
  let selected = initial;
  while (true) {
    render(selected);
    const key = await readKey();
    if (key === '\u0003' || key === '\u001b' || key.toLowerCase() === 'q') return null;
    if (key === '\u001b[A' || key.toLowerCase() === 'k') selected = (selected - 1 + itemCount) % itemCount;
    else if (key === '\u001b[B' || key.toLowerCase() === 'j') selected = (selected + 1) % itemCount;
    else if (key === '\r' || key === '\n') return selected;
    else if (/^[1-9]$/.test(key) && Number(key) <= itemCount) return Number(key) - 1;
  }
}

function providerState(target, provider) {
  const directory = provider === 'claude' ? '.claude' : '.codex';
  return existsSync(path.join(target, directory)) ? 'detected' : 'new';
}

async function mainMenu(target, updateState) {
  const items = [
    ['Claude Code', 'Install or update a Claude Code project.'],
    ['Codex', 'Install or update a Codex project.'],
    ['All', 'Install or update both provider integrations.'],
    ['Check for Updates', 'Open update status and actions.'],
    ['Exit', 'Close BasedKit without changing this project.'],
  ];
  const selected = await selectMenu((index) => {
    title('Project kit launcher');
    console.log(`  Project: ${target}`);
    console.log(`  Claude: ${providerState(target, 'claude')}   Codex: ${providerState(target, 'codex')}\n`);
    items.forEach(([label], itemIndex) => menuLine(`${itemIndex + 1}. ${label}`, index === itemIndex));
    console.log(`\n  ${items[index][1]}`);
    if (updateState.status === 'available') process.stdout.write('\x1b[33m');
    console.log(`  ${updateSummary(updateState)}`);
    process.stdout.write('\x1b[0m');
    console.log(`\n  Up/Down - Enter - 1-${items.length} quick keys - Esc to quit`);
  }, items.length);
  return selected === null ? 'exit' : ['claude', 'codex', 'both', 'update', 'exit'][selected];
}

async function bundleMenu(provider, catalog) {
  const selectedIds = new Set(['base']);
  const bundleRows = [
    { id: 'base', name: 'Base', description: 'Core agents, commands, hooks, workflows, and general engineering skills.', locked: true },
    ...catalog,
  ];
  const continueIndex = bundleRows.length;
  const backIndex = bundleRows.length + 1;
  let selected = 0;
  while (true) {
    title(`Bundle selection - ${provider === 'both' ? 'All' : provider === 'claude' ? 'Claude Code' : 'Codex'}`);
    console.log('  Base is always included. Select any additional bundles.\n');
    bundleRows.forEach((bundle, index) => {
      const mark = selectedIds.has(bundle.id) ? '[x] ' : '[ ] ';
      menuLine(`${index + 1}. ${mark}${bundle.name}${bundle.skillCount ? ` (${bundle.skillCount} skills)` : ''}`, selected === index);
    });
    menuLine(`${continueIndex + 1}. Continue`, selected === continueIndex);
    menuLine(`${backIndex + 1}. Back`, selected === backIndex);
    const focused = bundleRows[selected];
    console.log(`\n  ${focused ? focused.description : selected === continueIndex ? 'Install the selected bundles.' : 'Return to provider selection.'}`);
    console.log('  Space/Enter toggles bundles - A toggles all optional bundles');
    console.log('  Up/Down to move - Esc to go back');

    const key = await readKey();
    if (key === '\u0003' || key === '\u001b' || key.toLowerCase() === 'q') return null;
    if (key === '\u001b[A' || key.toLowerCase() === 'k') selected = (selected - 1 + backIndex + 1) % (backIndex + 1);
    else if (key === '\u001b[B' || key.toLowerCase() === 'j') selected = (selected + 1) % (backIndex + 1);
    else if (key.toLowerCase() === 'a') {
      const allSelected = catalog.every((bundle) => selectedIds.has(bundle.id));
      for (const bundle of catalog) allSelected ? selectedIds.delete(bundle.id) : selectedIds.add(bundle.id);
    } else if (key === ' ' || key === '\r' || key === '\n') {
      if (selected < bundleRows.length) {
        const bundle = bundleRows[selected];
        if (!bundle.locked) selectedIds.has(bundle.id) ? selectedIds.delete(bundle.id) : selectedIds.add(bundle.id);
      } else if (selected === continueIndex) {
        return [...selectedIds];
      } else {
        return null;
      }
    } else if (/^[1-9]$/.test(key)) {
      const picked = Number(key) - 1;
      if (picked <= backIndex) selected = picked;
    }
  }
}

function install(provider, target, bundles) {
  console.log(`Installing BasedKit for ${provider === 'both' ? 'all providers' : provider} in ${target}...`);
  console.log(`Bundles: ${bundles.join(', ')}`);
  const result = spawnSync(process.execPath, [
    enginePath,
    '--source', sourceRoot,
    '--target', target,
    '--provider', provider,
    '--bundles', bundles.join(','),
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Project installer exited with code ${result.status}`);
}

function runBootstrap(state) {
  const repository = state.repository || 'dat-hoangnguyentuandat/basedkit';
  const ref = state.ref || 'main';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid update repository');
  if (!/^[A-Za-z0-9._/-]+$/.test(ref)) throw new Error('Invalid update ref');
  const scriptName = process.platform === 'win32' ? 'install.ps1' : 'install.sh';
  const url = `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${scriptName}`;
  const result = process.platform === 'win32'
    ? spawnSync('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      `$env:BASEDKIT_REPOSITORY='${repository}'; $env:BASEDKIT_REF='${ref}'; $script = Invoke-RestMethod '${url}'; Invoke-Expression $script`,
    ], { stdio: 'inherit' })
    : spawnSync('sh', ['-c', 'curl -fsSL "$1" | sh', 'basedkit-update', url], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Update installer exited with code ${result.status}`);
}

async function updatePage(initialState) {
  let state = initialState;
  let message = null;
  while (true) {
    const actions = state.status === 'available' ? ['Update Now', 'Check Again', 'Back'] : ['Check Again', 'Back'];
    const selected = await selectMenu((index) => {
      title('BasedKit update');
      console.log(`  Status: ${updateSummary(state)}\n`);
      actions.forEach((label, itemIndex) => menuLine(`${itemIndex + 1}. ${label}`, index === itemIndex));
      if (message) console.log(`\n  ${message}`);
      console.log('\n  Enter to select - Esc to return to launcher');
    }, actions.length);
    if (selected === null || actions[selected] === 'Back') return state;
    if (actions[selected] === 'Check Again') {
      message = 'Checking GitHub...';
      state = await checkForUpdate({ sourceRoot, force: true });
      message = null;
    } else {
      title('BasedKit update');
      console.log('  Downloading and installing the latest revision...\n');
      runBootstrap(state);
      state = await checkForUpdate({ sourceRoot, force: true });
      message = 'Update complete. Back returns to the launcher; restart later to load new launcher code.';
    }
  }
}

async function pause(message) {
  console.log(`\n${message}\nPress any key to return to the launcher...`);
  await readKey();
}

async function interactiveLauncher(target) {
  ensureInteractive();
  const catalog = await loadBundleCatalog(sourceRoot);
  let updateState = await checkForUpdate({ sourceRoot });
  while (true) {
    const action = await mainMenu(target, updateState);
    if (action === 'exit') return;
    if (action === 'update') {
      updateState = await updatePage(updateState);
      continue;
    }
    const bundles = await bundleMenu(action, catalog);
    if (!bundles) continue;
    clear();
    install(action, target, bundles);
    await pause('BasedKit installation complete. Restart the provider if it is already running.');
  }
}

async function handleDirectUpdate({ checkOnly = false } = {}) {
  const state = await checkForUpdate({ sourceRoot, force: true });
  console.log(updateSummary(state));
  if (checkOnly || state.status === 'current') return;
  runBootstrap(state);
  console.log('BasedKit updated. Run basedkit again to use the new launcher.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (['help', '-h', '--help'].includes(options.command) || options.flags.has('--help') || options.flags.has('-h')) return printHelp();
  if (['version', '-v', '--version'].includes(options.command) || options.flags.has('--version') || options.flags.has('-v')) return console.log(`basedkit ${VERSION}`);
  if (options.command === 'update') return handleDirectUpdate({ checkOnly: options.flags.has('--check') });
  if (!options.command) return interactiveLauncher(options.target);
  const provider = options.command === 'all' ? 'both' : options.command;
  if (!['claude', 'codex', 'both'].includes(provider)) {
    printHelp();
    throw new Error(`Unknown command: ${options.command}`);
  }
  const catalog = await loadBundleCatalog(sourceRoot);
  const known = new Set(['base', ...catalog.map((bundle) => bundle.id)]);
  const unknown = options.bundles.filter((bundle) => !known.has(bundle));
  if (unknown.length) throw new Error(`Unknown bundles: ${unknown.join(', ')}`);
  install(provider, options.target, [...new Set(options.bundles)]);
}

main().catch((error) => {
  process.stdout.write('\x1b[0m');
  console.error(`BasedKit launcher failed: ${error.message}`);
  process.exit(1);
});
