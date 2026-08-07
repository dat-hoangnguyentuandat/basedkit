#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const valueAfter = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null; };
const themeArg = valueAfter('--theme');
if (!themeArg) throw new Error('Usage: node check-theme-quality.mjs --theme <theme-path> [--json <output>]');
const theme = path.resolve(themeArg);
const output = valueAfter('--json');
const errors = []; const warnings = [];
const add = (level, rule, file, detail) => (level === 'error' ? errors : warnings).push({ rule, file, ...(detail ? { detail } : {}) });
const read = async (relative) => fs.readFile(path.join(theme, relative), 'utf8').catch(() => '');

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  return (await Promise.all(entries.map(async (entry) => {
    const candidate = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(candidate) : [candidate];
  }))).flat();
}

const required = [
  'theme.json', 'widgets.php', 'seed.php', 'assets/ASSET-SOURCES.json',
  'views/layouts/app.blade.php', 'views/home.blade.php', 'views/product.blade.php',
  'views/products/index.blade.php',
  'views/partials/header.blade.php', 'views/partials/footer.blade.php',
  'views/partials/homepage-block.blade.php',
];
for (const file of required) await fs.access(path.join(theme, file)).catch(() => add('error', 'required-file', file));
for (const file of ['views/contact.blade.php', 'views/news/index.blade.php', 'views/news/show.blade.php', 'views/testimonials.blade.php']) {
  await fs.access(path.join(theme, file)).catch(() => add('warning', 'capability-route-view-absent', file, 'Require when the capability matrix includes this core route'));
}
const files = await walk(theme);
const relative = (file) => path.relative(theme, file).replaceAll('\\', '/');

let manifest = {};
try { manifest = JSON.parse(await read('theme.json')); } catch { add('error', 'invalid-json', 'theme.json'); }
const folderSlug = path.basename(theme);
const slug = manifest.slug || manifest.name;
if (!slug || slug !== folderSlug) add('error', 'manifest-folder-mismatch', 'theme.json', `Expected name/slug ${folderSlug}`);
if (manifest.supports?.products !== true || manifest.supports?.commerce?.purchase_action !== true) {
  add('error', 'missing-commerce-capability', 'theme.json');
}

const registry = await read('widgets.php');
for (const zone of ['header', 'main', 'sidebar', 'footer_top', 'footer_1', 'footer_2', 'footer_3', 'footer_bottom', 'float_left', 'float_right']) {
  if (!new RegExp(`['"]${zone}['"]\\s*=>`).test(registry)) add('error', 'missing-zone', 'widgets.php', zone);
}
const defaults = [...registry.matchAll(/['"]block_type['"]\s*=>\s*['"]([^'"]+)['"][\s\S]{0,1200}?['"]style_key['"]\s*=>\s*['"]([^'"]+)['"]/g)];
if (!defaults.length) add('error', 'missing-widget-defaults', 'widgets.php');
for (const match of defaults) {
  const candidate = `widgets/${match[1]}/${match[2]}.blade.php`;
  if (!files.some((file) => relative(file) === candidate)) add('error', 'missing-default-widget-variant', candidate);
}

const layout = await read('views/layouts/app.blade.php');
const shellSource = `${layout}\n${await read('views/partials/header.blade.php')}\n${await read('views/partials/footer.blade.php')}`;
for (const token of ['csrf-token', "@stack('css')", "@stack('js')", 'versioned_theme_asset']) {
  if (!layout.includes(token)) add('error', 'missing-layout-contract', 'views/layouts/app.blade.php', token);
}
if (!/HomepageBlock|homepageBlocks/.test(shellSource)) add('error', 'missing-global-block-query', 'views/layouts/app.blade.php');
for (const zone of ['footer_top', 'footer_1', 'footer_2', 'footer_3', 'footer_bottom', 'float_left', 'float_right']) {
  if (!shellSource.includes(zone)) add('error', 'global-zone-not-rendered', 'views/layouts/app.blade.php', zone);
}
for (const token of ['rel="canonical"', 'property="og:', 'application/ld+json']) {
  if (!layout.includes(token)) add('error', 'missing-seo-head-contract', 'views/layouts/app.blade.php', token);
}
const header = await read('views/partials/header.blade.php');
if (!/Setting::get\s*\(\s*['"]site_logo/.test(header)) add('error', 'admin-logo-not-used', 'views/partials/header.blade.php');
if (!/Danh mục sản phẩm|category-mega|mega-menu/i.test(header)) add('error', 'missing-category-navigation', 'views/partials/header.blade.php');
if (!/rel=["']icon["']/.test(layout)) add('error', 'missing-favicon', 'views/layouts/app.blade.php');

const productDetail = await read('views/product.blade.php');
if (!productDetail.includes('cms_product_purchase_button')) add('error', 'missing-detail-purchase-helper', 'views/product.blade.php');
const purchaseFiles = files.filter((file) => {
  const name = relative(file);
  return /product|catalog/i.test(name) && file.endsWith('.blade.php') && name !== 'views/product.blade.php';
});
const purchaseSources = await Promise.all(purchaseFiles.map((file) => fs.readFile(file, 'utf8')));
if (!purchaseSources.some((source) => source.includes('cms_product_purchase_button'))) {
  add('error', 'missing-card-purchase-helper', 'views/partials');
}
const listing = await read('views/products/index.blade.php');
for (const token of ["links('pagination::theme')", 'route(\'products.index\'']) {
  if (!listing.includes(token)) add('error', 'missing-listing-contract', 'views/products/index.blade.php', token);
}
if (!/isEmpty\s*\(|empty-state|catalog-empty/i.test(listing)) add('error', 'missing-listing-empty-state', 'views/products/index.blade.php');

for (const file of files.filter((item) => /\.(php|blade\.php|css|js)$/i.test(item))) {
  const source = await fs.readFile(file, 'utf8'); const name = relative(file);
  const rules = [
    ['adjacent-blade-directives', /@(endif|endforeach|endforelse)@endsection/i],
    ['raw-root-relative-url', /(?:href|action)=["']\/(?!\/)/i],
    ['hardcoded-sell-route', /route\s*\(\s*["']sell\.|["']\/gio-hang/i],
    ['unversioned-theme-css-js', /(?<!versioned_)theme_asset\s*\(\s*["'](?:css|js)\//i],
    ['dead-commerce-control', /name=["'](?:sort|min_price|max_price|brand|stock)["']/i],
  ];
  for (const [rule, pattern] of rules) if (pattern.test(source)) add(rule === 'dead-commerce-control' ? 'warning' : 'error', rule, name);
  if (/route\s*\(\s*["']contact\.store/.test(source) && /name=["'](?:company|position|address)["']/i.test(source)) add('error', 'unsupported-core-contact-fields', name);
  if (file.endsWith('.blade.php') && source.length > 800 && !source.includes('\n')) add('warning', 'minified-blade-template', name);
}

const seed = await read('seed.php');
const productsSection = seed.match(/['"]products['"]\s*=>\s*\[([\s\S]*?)\n\s*\],\s*\n\s*['"](?:services|news|testimonials|menu_items)['"]\s*=>/)?.[1] || '';
const productCount = (productsSection.match(/['"]category_slug['"]\s*=>/g) || []).length;
if (productCount < 9) add('error', 'insufficient-seed-products', 'seed.php', `Found ${productCount}; require enough for grids and page 2`);

let provenanceDocument = {};
try { provenanceDocument = JSON.parse(await read('assets/ASSET-SOURCES.json')); } catch { add('error', 'invalid-json', 'assets/ASSET-SOURCES.json'); }
const provenance = Array.isArray(provenanceDocument) ? provenanceDocument : provenanceDocument.assets;
if (!Array.isArray(provenance)) add('error', 'invalid-provenance-shape', 'assets/ASSET-SOURCES.json');
else for (const [index, item] of provenance.entries()) {
  const label = `assets/ASSET-SOURCES.json#${index}`;
  const missing = [];
  if (!item?.file && !item?.path) missing.push('file');
  for (const key of ['sourceUrl', 'sourceType', 'rights', 'rightsEvidence', 'accessedAt', 'sha256', 'transformations', 'factualStatus']) if (item?.[key] === undefined || item[key] === '') missing.push(key);
  if (missing.length) add('error', 'missing-provenance-fields', label, missing.join(', '));
  const allowedRights = ['customer-provided', 'owned', 'licensed', 'public-domain', 'generated', 'placeholder-not-for-release'];
  if (item?.rights && !allowedRights.includes(item.rights)) add('error', 'invalid-provenance-rights', label, item.rights);
  if (item?.rights === 'placeholder-not-for-release') add('error', 'release-placeholder-asset', label, item.file);
  const itemFile = item?.file || item?.path;
  if (itemFile) {
    const assetsRoot = path.resolve(theme, 'assets');
    const assetPath = path.resolve(assetsRoot, itemFile.replace(/^assets[\\/]/, ''));
    if (assetPath !== assetsRoot && !assetPath.startsWith(`${assetsRoot}${path.sep}`)) {
      add('error', 'unsafe-provenance-path', label, itemFile);
      continue;
    }
    const data = await fs.readFile(assetPath).catch(() => null);
    if (!data) add('error', 'missing-provenance-asset', label, itemFile);
    else if (item.sha256 && crypto.createHash('sha256').update(data).digest('hex') !== String(item.sha256).toLowerCase()) add('error', 'asset-hash-mismatch', label, itemFile);
  }
}

for (const file of files.filter((candidate) => relative(candidate).includes('/translations/') && candidate.endsWith('.xml'))) {
  const source = await fs.readFile(file, 'utf8'); const name = relative(file);
  if (!source.includes('<language ') || !source.includes('</language>')) add('error', 'invalid-translation-root', name);
  if (slug && !path.basename(file).startsWith(`${slug}_`)) add('error', 'invalid-translation-filename', name);
}

if (Array.isArray(provenance)) {
  const recorded = new Set(provenance.map((item) => String(item.file || item.path || '').replaceAll('\\', '/').replace(/^assets\//, '')));
  for (const file of files.filter((candidate) => relative(candidate).startsWith('assets/images/'))) {
    const assetName = relative(file).replace(/^assets\//, '');
    if (!recorded.has(assetName)) add('error', 'asset-missing-provenance-record', 'assets/ASSET-SOURCES.json', assetName);
  }
}

const report = { passed: errors.length === 0, theme, scannedFiles: files.length, metrics: { defaults: defaults.length, productCount, provenanceRecords: Array.isArray(provenance) ? provenance.length : 0 }, errors, warnings };
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (output) { await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true }); await fs.writeFile(path.resolve(output), serialized); }
process.stdout.write(serialized);
if (errors.length) process.exitCode = 1;
