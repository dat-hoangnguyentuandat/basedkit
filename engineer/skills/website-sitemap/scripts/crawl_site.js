#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

function decodeHtml(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(text = '') {
  return decodeHtml(text.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeUrl(input, base) {
  try {
    const url = base ? new URL(input, base) : new URL(input);
    url.hash = '';
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) url.port = '';
    return url;
  } catch {
    return null;
  }
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function getAttr(tag, attr) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? match[1] : '';
}

function parseXmlLocs(xml = '') {
  return uniq([...xml.matchAll(/<loc>\s*([^<\s][^<]*)\s*<\/loc>/gi)].map(m => m[1].trim()));
}

function parseRobotsSitemaps(robots = '') {
  return uniq(robots.split(/\r?\n/).map(line => line.match(/^\s*Sitemap:\s*(\S+)/i)?.[1]).filter(Boolean));
}

function extractHtmlData(html, pageUrl) {
  const title = stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const metaDescription = decodeHtml(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] || '');
  const canonical = normalizeUrl(getAttr(html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[0] || '', 'href'), pageUrl)?.href || '';
  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] || '';
  const h1 = uniq([...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => stripTags(m[1])).filter(Boolean));

  const hrefTags = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const links = uniq(hrefTags.map(m => normalizeUrl(m[1], pageUrl)?.href));
  const linkDetails = hrefTags.map(m => ({ url: normalizeUrl(m[1], pageUrl)?.href || '', text: stripTags(m[2]) })).filter(x => x.url);

  const imageTags = [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  const scriptTags = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  const cssTags = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  const iframeTags = [...html.matchAll(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];

  const forms = [...html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].map(m => {
    const openTag = `<form${m[1]}>`;
    const fields = [...m[2].matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].map(field => ({
      tag: field[1].toLowerCase(),
      type: getAttr(field[0], 'type') || field[1].toLowerCase(),
      name: getAttr(field[0], 'name'),
      placeholder: getAttr(field[0], 'placeholder')
    }));
    return {
      action: normalizeUrl(getAttr(openTag, 'action') || pageUrl, pageUrl)?.href || pageUrl,
      method: (getAttr(openTag, 'method') || 'get').toUpperCase(),
      fields
    };
  });

  return {
    title,
    metaDescription,
    canonical,
    lang,
    h1,
    links,
    linkDetails,
    assets: {
      images: uniq(imageTags.map(m => normalizeUrl(m[1], pageUrl)?.href)),
      scripts: uniq(scriptTags.map(m => normalizeUrl(m[1], pageUrl)?.href)),
      stylesheets: uniq(cssTags.map(m => normalizeUrl(m[1], pageUrl)?.href)),
      iframes: uniq(iframeTags.map(m => normalizeUrl(m[1], pageUrl)?.href))
    },
    forms
  };
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 sitemap-crawler' } });
  const text = await res.text();
  return { status: res.status, finalUrl: res.url, contentType: res.headers.get('content-type') || '', text };
}

function toSection(pathname) {
  const clean = pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  const bits = clean.split('/').filter(Boolean);
  return bits.length ? `/${bits[0]}` : '/';
}

function makeMarkdown(report) {
  const lines = [];
  lines.push(`# Sitemap report: ${report.origin}`);
  lines.push('');
  lines.push(`- Start URL: ${report.startUrl}`);
  lines.push(`- Pages crawled: ${report.pages.length}`);
  lines.push(`- Skipped URLs: ${report.skipped.length}`);
  lines.push(`- Generated: ${new Date(report.generatedAt).toISOString()}`);
  lines.push('');
  lines.push('## Sections');
  for (const [section, count] of Object.entries(report.sections)) lines.push(`- ${section}: ${count} page(s)`);
  lines.push('');
  lines.push('## Pages');
  for (const page of report.pages) {
    lines.push(`- ${page.url}`);
    if (page.title) lines.push(`  - title: ${page.title}`);
    if (page.metaDescription) lines.push(`  - meta: ${page.metaDescription}`);
    if (page.h1.length) lines.push(`  - h1: ${page.h1.join(' | ')}`);
    lines.push(`  - links: ${page.internalLinks.length} internal, ${page.externalLinks.length} external`);
    lines.push(`  - assets: ${page.assetCounts.images} img, ${page.assetCounts.stylesheets} css, ${page.assetCounts.scripts} js, ${page.assetCounts.iframes} iframe`);
    if (page.forms.length) lines.push(`  - forms: ${page.forms.length}`);
  }
  lines.push('');
  lines.push('## Duplicates');
  const dupTitles = Object.entries(report.duplicates.titles).filter(([, urls]) => urls.length > 1);
  const dupCanonicals = Object.entries(report.duplicates.canonicals).filter(([, urls]) => urls.length > 1);
  lines.push(`- Duplicate titles: ${dupTitles.length}`);
  lines.push(`- Duplicate canonicals: ${dupCanonicals.length}`);
  lines.push('');
  lines.push('## Crawl gaps / warnings');
  if (!report.warnings.length) lines.push('- none');
  else for (const warn of report.warnings) lines.push(`- ${warn}`);
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : fallback;
  };
  if (args.includes('--help') || !getArg('--url')) {
    console.log('Usage: node crawl_site.js --url <URL> --out <DIR> [--max-pages 200] [--subtree-only]');
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const start = normalizeUrl(getArg('--url'));
  if (!start) throw new Error('Invalid --url');
  const outDir = getArg('--out', path.join(process.cwd(), 'artifacts', 'sitemaps', start.hostname));
  const maxPages = Number(getArg('--max-pages', '200'));
  const subtreeOnly = args.includes('--subtree-only');
  const startPath = start.pathname.replace(/\/$/, '') || '/';

  const queue = [start.href];
  const seen = new Set();
  const pages = [];
  const skipped = [];
  const warnings = [];
  const xmlSeeds = new Set();

  try {
    const robotsUrl = new URL('/robots.txt', start).href;
    const robots = await fetchText(robotsUrl);
    parseRobotsSitemaps(robots.text).forEach(x => xmlSeeds.add(x));
  } catch {
    warnings.push('robots.txt unavailable');
  }

  xmlSeeds.add(new URL('/sitemap.xml', start).href);
  for (const sitemapUrl of [...xmlSeeds]) {
    try {
      const xml = await fetchText(sitemapUrl);
      parseXmlLocs(xml.text).forEach(loc => queue.push(loc));
    } catch {
      warnings.push(`sitemap seed unavailable: ${sitemapUrl}`);
    }
  }

  while (queue.length && pages.length < maxPages) {
    const next = queue.shift();
    const normalized = normalizeUrl(next);
    if (!normalized || seen.has(normalized.href)) continue;
    seen.add(normalized.href);
    if (normalized.origin !== start.origin) {
      skipped.push({ url: normalized.href, reason: 'cross-origin' });
      continue;
    }
    if (subtreeOnly && !(normalized.pathname === startPath || normalized.pathname.startsWith(`${startPath}/`))) {
      skipped.push({ url: normalized.href, reason: 'outside subtree' });
      continue;
    }

    try {
      const res = await fetchText(normalized.href);
      if (!res.contentType.includes('text/html')) {
        skipped.push({ url: normalized.href, reason: `non-html:${res.contentType || res.status}` });
        continue;
      }
      const finalUrl = normalizeUrl(res.finalUrl)?.href || normalized.href;
      const data = extractHtmlData(res.text, finalUrl);
      const internalLinks = data.links.filter(link => normalizeUrl(link)?.origin === start.origin);
      const externalLinks = data.links.filter(link => normalizeUrl(link)?.origin && normalizeUrl(link)?.origin !== start.origin);
      internalLinks.forEach(link => { if (!seen.has(link)) queue.push(link); });
      const page = {
        url: finalUrl,
        status: res.status,
        title: data.title,
        metaDescription: data.metaDescription,
        canonical: data.canonical,
        lang: data.lang,
        h1: data.h1,
        section: toSection(new URL(finalUrl).pathname),
        internalLinks: uniq(internalLinks),
        externalLinks: uniq(externalLinks),
        linkDetails: data.linkDetails,
        forms: data.forms,
        assets: data.assets,
        assetCounts: {
          images: data.assets.images.length,
          scripts: data.assets.scripts.length,
          stylesheets: data.assets.stylesheets.length,
          iframes: data.assets.iframes.length
        }
      };
      pages.push(page);
    } catch (error) {
      skipped.push({ url: normalized.href, reason: `fetch-failed:${error.message}` });
    }
  }

  const sections = {};
  const titles = {};
  const canonicals = {};
  for (const page of pages) {
    sections[page.section] = (sections[page.section] || 0) + 1;
    if (page.title) (titles[page.title] ||= []).push(page.url);
    if (page.canonical) (canonicals[page.canonical] ||= []).push(page.url);
  }
  if (pages.length >= maxPages) warnings.push(`crawl capped at max-pages=${maxPages}`);

  const report = {
    startUrl: start.href,
    origin: start.origin,
    generatedAt: new Date().toISOString(),
    pages,
    skipped,
    warnings,
    sections,
    duplicates: { titles, canonicals }
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'sitemap.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, 'sitemap.md'), makeMarkdown(report));
  console.log(`Wrote ${pages.length} pages to ${outDir}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}

module.exports = { extractHtmlData, parseXmlLocs, parseRobotsSitemaps, normalizeUrl };
