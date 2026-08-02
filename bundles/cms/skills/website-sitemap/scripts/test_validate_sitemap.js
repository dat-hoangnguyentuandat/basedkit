const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validate, validateLocation } = require('./validate_sitemap');

function fixture() {
  return {
    schemaVersion: '2.0',
    generatedAt: '2026-08-02T10:00:00.000Z',
    source: { mode: 'brief', inputs: [], confidence: 'medium', assumptions: [], gaps: [] },
    site: { name: 'Nha Khoa Kim Ngân', slug: 'nha-khoa-kim-ngan', locale: 'vi-VN', businessType: 'dental-clinic', goals: [], audiences: [] },
    design: { direction: 'Professional', tone: [], palette: {}, typography: {}, imagery: [] },
    navigation: { header: [{ label: 'Trang chủ', route: '/', type: 'internal' }], footer: [] },
    templates: [{ id: 'home', type: 'home', purpose: 'Convert visitors', regions: [] }],
    pages: [{ id: 'home', name: 'Trang chủ', route: '/', template: 'home', purpose: 'Introduce business', seo: {}, sections: [{ id: 'hero', type: 'hero', purpose: 'Introduce', contentSource: 'content.business', responsive: 'Stack on mobile' }], dataSources: ['business'] }],
    content: { _provenance: { business: 'supplied' }, business: { name: 'Nha Khoa Kim Ngân' } },
    cms: { capabilities: [], models: [], zones: ['header', 'footer'] },
    stitch: { screens: ['home'], promptFile: 'stitch-prompt.md' },
  };
}

assert.deepEqual(validate(fixture()), []);

const broken = fixture();
broken.pages[0].template = 'missing';
broken.navigation.header[0].route = '/missing';
const errors = validate(broken);
assert(errors.some((error) => error.includes('unknown template')));
assert(errors.some((error) => error.includes('undeclared route')));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-validator-'));
const output = path.join(root, 'artifacts', 'sitemaps', 'nha-khoa-kim-ngan');
fs.mkdirSync(output, { recursive: true });
for (const file of ['sitemap.md', 'stitch-prompt.md']) fs.writeFileSync(path.join(output, file), 'test');
assert.deepEqual(validateLocation(path.join(output, 'sitemap.json'), fixture(), root), []);
assert(validateLocation(path.join(root, 'wrong', 'sitemap.json'), fixture(), root).length > 0);
fs.rmSync(root, { recursive: true, force: true });

console.log('validate_sitemap tests passed');
