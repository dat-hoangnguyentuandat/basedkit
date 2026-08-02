const fs = require('node:fs');
const path = require('node:path');

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isStrings = (value) => Array.isArray(value) && value.every((item) => typeof item === 'string');

function requireKeys(value, keys, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  for (const key of keys) if (!(key in value)) errors.push(`${label}.${key} is required`);
}

function validate(report) {
  const errors = [];
  if (report.schemaVersion !== '2.0') errors.push('schemaVersion must equal 2.0');
  if (!report.generatedAt || Number.isNaN(Date.parse(report.generatedAt))) errors.push('generatedAt must be ISO-8601');
  requireKeys(report.source, ['mode', 'inputs', 'confidence', 'assumptions', 'gaps'], 'source', errors);
  requireKeys(report.site, ['name', 'slug', 'locale', 'businessType', 'goals', 'audiences'], 'site', errors);
  requireKeys(report.design, ['direction', 'tone', 'palette', 'typography', 'imagery'], 'design', errors);
  requireKeys(report.navigation, ['header', 'footer'], 'navigation', errors);
  requireKeys(report.cms, ['capabilities', 'models', 'zones'], 'cms', errors);
  requireKeys(report.stitch, ['screens', 'promptFile'], 'stitch', errors);
  if (!isObject(report.content)) errors.push('content must be an object');
  if (!['brief', 'structured', 'crawl', 'hybrid'].includes(report.source?.mode)) errors.push('source.mode is invalid');
  if (!['high', 'medium', 'low'].includes(report.source?.confidence)) errors.push('source.confidence is invalid');
  for (const key of ['inputs', 'assumptions', 'gaps']) if (!Array.isArray(report.source?.[key])) errors.push(`source.${key} must be an array`);
  if (!report.site?.name || !report.site?.slug || !report.site?.locale || !report.site?.businessType) errors.push('site identity fields cannot be empty');
  for (const key of ['goals', 'audiences']) if (!isStrings(report.site?.[key])) errors.push(`site.${key} must be a string array`);
  for (const key of ['tone', 'imagery']) if (!isStrings(report.design?.[key])) errors.push(`design.${key} must be a string array`);
  if (!isObject(report.content?._provenance)) errors.push('content._provenance must be an object');
  else for (const [key, value] of Object.entries(report.content._provenance)) if (!['supplied', 'crawled', 'inferred', 'placeholder'].includes(value)) errors.push(`content._provenance.${key} is invalid`);

  const templateIds = new Set();
  if (!Array.isArray(report.templates) || report.templates.length === 0) errors.push('templates must be a non-empty array');
  for (const template of report.templates || []) {
    requireKeys(template, ['id', 'type', 'purpose', 'regions'], 'template', errors);
    if (templateIds.has(template.id)) errors.push(`duplicate template id: ${template.id}`);
    else if (template.id) templateIds.add(template.id);
    if (!isStrings(template.regions)) errors.push(`template ${template.id || '?'} regions must be a string array`);
  }

  const routes = new Set();
  const pageIds = new Set();
  if (!Array.isArray(report.pages) || report.pages.length === 0) errors.push('pages must be a non-empty array');
  for (const page of report.pages || []) {
    requireKeys(page, ['id', 'name', 'route', 'template', 'purpose', 'seo', 'sections', 'dataSources'], 'page', errors);
    if (pageIds.has(page.id)) errors.push(`duplicate page id: ${page.id}`); else if (page.id) pageIds.add(page.id);
    if (routes.has(page.route)) errors.push(`duplicate page route: ${page.route}`); else if (page.route) routes.add(page.route);
    if (!templateIds.has(page.template)) errors.push(`page ${page.id || '?'} uses unknown template: ${page.template}`);
    if (!isObject(page.seo)) errors.push(`page ${page.id || '?'} seo must be an object`);
    if (!isStrings(page.dataSources)) errors.push(`page ${page.id || '?'} dataSources must be a string array`);
    if (!Array.isArray(page.sections) || page.sections.length === 0) errors.push(`page ${page.id || '?'} requires sections`);
    for (const section of page.sections || []) requireKeys(section, ['id', 'type', 'purpose', 'contentSource', 'responsive'], `page ${page.id || '?'} section`, errors);
  }

  for (const group of ['header', 'footer']) {
    if (!Array.isArray(report.navigation?.[group])) errors.push(`navigation.${group} must be an array`);
    for (const item of report.navigation?.[group] || []) {
      if (!['internal', 'external'].includes(item.type)) errors.push(`${group} navigation item type is invalid`);
      if (item.type === 'internal' && !routes.has(item.route)) errors.push(`${group} navigation has undeclared route: ${item.route}`);
      if (item.type === 'external' && !item.url) errors.push(`${group} external navigation requires url`);
    }
  }
  for (const key of ['capabilities', 'models', 'zones']) if (!isStrings(report.cms?.[key])) errors.push(`cms.${key} must be a string array`);
  if (!isStrings(report.stitch?.screens) || report.stitch.screens.length === 0) errors.push('stitch.screens must be a non-empty string array');
  else for (const screen of report.stitch.screens) if (!pageIds.has(screen)) errors.push(`stitch screen has no page: ${screen}`);
  if (report.stitch?.promptFile !== 'stitch-prompt.md') errors.push('stitch.promptFile must equal stitch-prompt.md');
  return errors;
}

function validateLocation(file, report, projectRoot) {
  const errors = [];
  const absoluteFile = path.resolve(file);
  const outputRoot = path.resolve(projectRoot, 'artifacts', 'sitemaps');
  const relative = path.relative(outputRoot, absoluteFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) errors.push(`sitemap must be inside ${outputRoot}`);
  if (path.basename(path.dirname(absoluteFile)) !== report.site?.slug) errors.push('sitemap parent folder must equal site.slug');
  for (const sibling of ['sitemap.md', 'stitch-prompt.md']) if (!fs.existsSync(path.join(path.dirname(absoluteFile), sibling))) errors.push(`missing sibling file: ${sibling}`);
  return errors;
}

function main() {
  const file = process.argv[2];
  const rootFlag = process.argv.indexOf('--project-root');
  const projectRoot = rootFlag >= 0 ? process.argv[rootFlag + 1] : null;
  if (!file || !projectRoot) throw new Error('Usage: node validate_sitemap.js <sitemap.json> --project-root <CMS_PROJECT>');
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errors = [...validate(report), ...validateLocation(file, report, projectRoot)];
  if (errors.length) {
    console.error(JSON.stringify({ valid: false, errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ valid: true, pages: report.pages.length, templates: report.templates.length }, null, 2));
}

if (require.main === module) main();
module.exports = { validate, validateLocation };
