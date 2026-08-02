const fs = require('fs');

function parsePatterns(ckignorePath) {
  try {
    return fs.readFileSync(ckignorePath, 'utf8')
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(x => x && !x.startsWith('#'));
  } catch {
    return [];
  }
}

function isBuildCommand(cmd = '') {
  return /\b(npm|pnpm|yarn|bun|go|cargo|make|gradle|mvn|docker|kubectl|terraform)\b/i.test(cmd);
}

function isVenvExecutable(cmd = '') {
  return /\.venv[\\/].*(python|pip)/i.test(cmd);
}

function isAllowedCommand(cmd = '') {
  return isBuildCommand(cmd) || isVenvExecutable(cmd);
}

const TOOL_PATH_FIELDS = {
  Read: ['path', 'file_path'],
  Write: ['path', 'file_path'],
  Edit: ['path', 'file_path'],
  MultiEdit: ['path', 'file_path'],
  Glob: ['pattern', 'path', 'cwd'],
  Grep: ['path', 'cwd', 'include', 'files'],
  LS: ['path', 'cwd']
};

function collectStringValues(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStringValues);
  return [];
}

function extractCheckedStrings(toolName, toolInput = {}) {
  const fields = TOOL_PATH_FIELDS[toolName];
  if (!fields) return [];

  const out = [];
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(toolInput, field)) {
      out.push(...collectStringValues(toolInput[field]));
    }
  }
  return out;
}

function matchPattern(value, patterns) {
  const norm = String(value).replace(/\\/g, '/').toLowerCase();
  for (const p of patterns) {
    const plain = p.replace(/^!/, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\\/g, '/').toLowerCase();
    if (plain && norm.includes(plain)) return p;
  }
  return null;
}

function checkScoutBlock({ toolName, toolInput, options = {} }) {
  const patterns = parsePatterns(options.ckignorePath);

  if (toolName === 'Bash') {
    const cmd = toolInput.command || '';
    if (isAllowedCommand(cmd)) return { blocked: false, isAllowedCommand: true };
    const hit = matchPattern(cmd, patterns);
    if (hit) return { blocked: true, path: cmd, pattern: hit, reason: 'matched pattern' };
    return { blocked: false };
  }

  for (const value of extractCheckedStrings(toolName, toolInput)) {
    const hit = matchPattern(value, patterns);
    if (hit) return { blocked: true, path: value, pattern: hit, reason: 'matched pattern' };
  }

  return { blocked: false };
}

module.exports = { checkScoutBlock, isBuildCommand, isVenvExecutable, isAllowedCommand };
