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
    site: { name: 'Nha Khoa Kim Ngân', slug: 'nha-khoa-kim-ngan', locale: 'vi-VN', businessType: 'service-business', goals: [], audiences: [] },
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

const ecommerce = fixture();
ecommerce.site = { ...ecommerce.site, name: 'Kun Store', slug: 'kun-store', businessType: 'ecommerce' };
ecommerce.cms = { capabilities: ['products', 'commerce.purchase_action', 'cart', 'checkout'], models: ['products', 'categories'], zones: ['header', 'main', 'footer_1', 'float_right'] };
ecommerce.templates = [
  { id: 'home', type: 'home', purpose: 'Storefront', regions: [] },
  { id: 'product-listing', type: 'listing', purpose: 'Browse products', regions: [] },
  { id: 'product-detail', type: 'detail', purpose: 'Buy product', regions: [] },
  { id: 'cart', type: 'cart', purpose: 'Review cart', regions: [] },
  { id: 'checkout', type: 'checkout', purpose: 'Checkout', regions: [] },
  { id: 'order-success', type: 'order-success', purpose: 'Confirm order', regions: [] },
];
const section = (id, type) => ({ id, type, purpose: id, contentSource: `content.${id}`, responsive: 'Responsive' });
ecommerce.pages = [
  { id: 'home', name: 'Trang chủ', route: '/', template: 'home', purpose: 'Storefront', seo: {}, sections: [section('category-menu', 'mega-menu'), section('featured-products', 'product-group')], dataSources: ['products', 'categories'] },
  { id: 'products', name: 'Sản phẩm', route: '/san-pham', template: 'product-listing', purpose: 'Browse', seo: {}, sections: [section('search', 'search'), section('category-filter', 'filter'), section('sort', 'sort'), section('pagination', 'pagination'), section('empty-state', 'empty')], dataSources: ['products'] },
  { id: 'product', name: 'Chi tiết', route: '/san-pham/{slug}', template: 'product-detail', purpose: 'Buy', seo: {}, sections: [section('gallery', 'gallery'), section('price-stock', 'price-stock'), section('purchase', 'add-to-cart'), section('related-products', 'related-products')], dataSources: ['products'] },
  { id: 'cart', name: 'Giỏ hàng', route: '/gio-hang', template: 'cart', purpose: 'Cart', seo: {}, sections: [section('cart-items', 'cart')], dataSources: ['cart'] },
  { id: 'checkout', name: 'Thanh toán', route: '/thanh-toan', template: 'checkout', purpose: 'Checkout', seo: {}, sections: [section('checkout-form', 'checkout')], dataSources: ['cart'] },
  { id: 'order-success', name: 'Thành công', route: '/dat-hang-thanh-cong/{token}', template: 'order-success', purpose: 'Confirm', seo: {}, sections: [section('order-confirmation', 'order-success')], dataSources: ['order'] },
];
ecommerce.navigation = { header: [{ label: 'Sản phẩm', route: '/san-pham', type: 'internal' }], footer: [] };
ecommerce.stitch = { screens: ecommerce.pages.map((page) => page.id), promptFile: 'stitch-prompt.md' };
ecommerce.content = { _provenance: { products: 'supplied', categories: 'supplied' }, products: [], categories: [] };
assert.deepEqual(validate(ecommerce), []);

const brokenEcommerce = structuredClone(ecommerce);
brokenEcommerce.cms.capabilities = ['products'];
brokenEcommerce.templates = brokenEcommerce.templates.filter((template) => template.id !== 'checkout');
const ecommerceErrors = validate(brokenEcommerce);
assert(ecommerceErrors.some((error) => error.includes('commerce.purchase_action')));
assert(ecommerceErrors.some((error) => error.includes('template: checkout')));

const unusedTemplates = structuredClone(ecommerce);
unusedTemplates.pages = [unusedTemplates.pages[0]];
unusedTemplates.stitch.screens = ['home'];
const unusedErrors = validate(unusedTemplates);
assert(unusedErrors.some((error) => error.includes('canonical product listing page')));
assert(unusedErrors.some((error) => error.includes('canonical checkout page')));

for (const phrase of ['Improve staff productivity', 'Stock photography services', 'Commerce consulting']) {
  const service = fixture();
  service.pages[0].purpose = phrase;
  assert.deepEqual(validate(service), []);
}

const invalidType = fixture();
invalidType.site.businessType = 'dental-clinic';
assert(validate(invalidType).some((error) => error.includes('site.businessType')));

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-validator-'));
const output = path.join(root, 'artifacts', 'sitemaps', 'nha-khoa-kim-ngan');
fs.mkdirSync(output, { recursive: true });
for (const file of ['sitemap.md', 'stitch-prompt.md']) fs.writeFileSync(path.join(output, file), 'test');
assert.deepEqual(validateLocation(path.join(output, 'sitemap.json'), fixture(), root), []);
assert(validateLocation(path.join(root, 'wrong', 'sitemap.json'), fixture(), root).length > 0);
fs.rmSync(root, { recursive: true, force: true });

console.log('validate_sitemap tests passed');
