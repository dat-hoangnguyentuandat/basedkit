#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const argument = process.argv.indexOf('--theme');
if (argument < 0 || !process.argv[argument + 1]) throw new Error('Usage: node check-theme-quality.mjs --theme <theme-path> [--json <output>]');
const theme = path.resolve(process.argv[argument + 1]);
const jsonIndex = process.argv.indexOf('--json');
const output = jsonIndex >= 0 ? path.resolve(process.argv[jsonIndex + 1]) : null;
const errors = []; const warnings = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const candidate = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(candidate) : [candidate];
  }))).flat();
}

for (const required of ['theme.json', 'widgets.php', 'seed.php', 'views/layouts/app.blade.php']) {
  await fs.access(path.join(theme, required)).catch(() => errors.push({ rule: 'required-file', file: required }));
}
const files = await walk(theme);
for (const file of files.filter((candidate) => /\.(php|blade\.php|css|js)$/i.test(candidate))) {
  const source = await fs.readFile(file, 'utf8'); const relative = path.relative(theme, file);
  const rules = [
    ['adjacent-blade-directives', /@(endif|endforeach|endforelse)@endsection/i],
    ['raw-root-relative-url', /(?:href|action)=["']\/(?!\/)/i],
    ['hardcoded-sell-route', /route\s*\(\s*["']sell\./i],
    ['theme-owned-language-switcher', /fullUrlWithQuery\s*\(\s*\[\s*["']lang["']/i],
  ];
  for (const [rule, pattern] of rules) if (pattern.test(source)) errors.push({ rule, file: relative });
  if (file.endsWith('.blade.php') && source.length > 800 && !source.includes('\n')) warnings.push({ rule: 'minified-blade-template', file: relative });
  if (/route\s*\(\s*["']contact\.store/.test(source)) {
    const unsupported = [...source.matchAll(/name=["'](company|position|address)["']/gi)].map((match) => match[1]);
    if (unsupported.length) {
      const finding = { rule: 'unsupported-core-contact-fields', file: relative, fields: [...new Set(unsupported)] };
      if (relative.replaceAll('\\', '/') === 'views/contact.blade.php') errors.push(finding); else warnings.push(finding);
    }
  }
}

const layout = await fs.readFile(path.join(theme, 'views', 'layouts', 'app.blade.php'), 'utf8').catch(() => '');
if (!/rel=["']icon["']/.test(layout)) errors.push({ rule: 'missing-favicon', file: 'views/layouts/app.blade.php' });
const header = await fs.readFile(path.join(theme, 'views', 'partials', 'header.blade.php'), 'utf8').catch(() => '');
if (!/Setting::get\s*\(\s*["']site_logo/.test(header)) errors.push({ rule: 'admin-logo-not-used', file: 'views/partials/header.blade.php' });

const translations = files.filter((candidate) => candidate.includes(`${path.sep}translations${path.sep}`) && candidate.endsWith('.xml'));
const slug = JSON.parse(await fs.readFile(path.join(theme, 'theme.json'), 'utf8').catch(() => '{}')).slug;
for (const file of translations) {
  const source = await fs.readFile(file, 'utf8');
  if (!source.includes('<language ') || !source.includes('</language>')) errors.push({ rule: 'invalid-translation-root', file: path.relative(theme, file) });
  if (slug && !path.basename(file).startsWith(`${slug}_`)) errors.push({ rule: 'invalid-translation-filename', file: path.relative(theme, file) });
}

const report = { passed: errors.length === 0, theme, scannedFiles: files.length, errors, warnings };
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, serialized); }
process.stdout.write(serialized);
if (errors.length) process.exitCode = 1;
