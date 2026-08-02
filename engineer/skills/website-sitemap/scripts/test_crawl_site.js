const test = require('node:test');
const assert = require('node:assert/strict');
const { extractHtmlData, parseXmlLocs, parseRobotsSitemaps, normalizeUrl } = require('./crawl_site');

test('normalizeUrl strips hash and resolves relative URLs', () => {
  assert.equal(normalizeUrl('/docs#intro', 'https://example.com/base/').href, 'https://example.com/docs');
});

test('parseXmlLocs extracts loc entries', () => {
  const xml = '<?xml version="1.0"?><urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>';
  assert.deepEqual(parseXmlLocs(xml), ['https://example.com/a', 'https://example.com/b']);
});

test('parseRobotsSitemaps extracts sitemap directives', () => {
  const robots = 'User-agent: *\nSitemap: https://example.com/sitemap.xml\nSitemap: https://example.com/news.xml';
  assert.deepEqual(parseRobotsSitemaps(robots), ['https://example.com/sitemap.xml', 'https://example.com/news.xml']);
});

test('extractHtmlData finds links, assets, forms, and metadata', () => {
  const html = `<!doctype html><html lang="en"><head><title>Demo</title><meta name="description" content="Desc"><link rel="canonical" href="/demo"><link rel="stylesheet" href="/app.css"></head><body><h1>Main</h1><a href="/about">About</a><img src="/hero.png"><script src="/app.js"></script><form action="/submit" method="post"><input name="email"></form></body></html>`;
  const data = extractHtmlData(html, 'https://example.com/');
  assert.equal(data.title, 'Demo');
  assert.equal(data.metaDescription, 'Desc');
  assert.equal(data.canonical, 'https://example.com/demo');
  assert.deepEqual(data.h1, ['Main']);
  assert.equal(data.links[0], 'https://example.com/about');
  assert.equal(data.assets.images[0], 'https://example.com/hero.png');
  assert.equal(data.assets.scripts[0], 'https://example.com/app.js');
  assert.equal(data.forms[0].action, 'https://example.com/submit');
});
