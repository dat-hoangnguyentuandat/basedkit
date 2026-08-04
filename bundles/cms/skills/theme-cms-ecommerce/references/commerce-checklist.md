# Ecommerce implementation checklist

## Before implementation

- Confirm sitemap includes `/san-pham`, category routes, product detail, `/gio-hang`, checkout, order success, account/contact, and policy pages as applicable.
- Confirm the shared header has a data-driven `Danh mục sản phẩm` mega-menu with a left category rail, 3–4 child-category columns, keyboard/focus support, and a mobile accordion/drawer variant.
- Read the inherited `commerce-sell.md` contract and inspect existing Sell plugin routes/helpers before writing views.
- Decide desktop product columns and seed page size as columns × 2; provide enough products for page 2.
- Record source, license, and transformation for every imported product/hero/brand asset in `assets/ASSET-SOURCES.json`.

## Required checks

- Theme manifest declares products and purchase action.
- Product cards/detail use `cms_product_purchase_button()` and no hardcoded Sell route.
- Inactive Sell plugin renders a safe contact/detail fallback.
- Active Sell plugin submits POST with CSRF, adds the correct product, and redirects under the configured subfolder.
- Cart supports quantity update, remove, empty state, and preserves locale/query context where configured.
- Checkout validates required fields and records a real test order; success and failure states are rendered.
- Out-of-stock products disable purchase without hiding price/status.
- Internal links, filters, category links, pagination page 2, images, SEO metadata, and mobile overflow pass QA.
- Test mega-menu open/close with mouse, keyboard, touch/mobile menu, Escape, and focus traversal; verify no category or cart link is obscured by the panel.

## Evidence handoff

Include route/status matrix, product/category counts, seed provenance, screenshots at desktop/mobile sizes, browser cart/checkout evidence, quality/SEO reports, and the inspected ZIP manifest.
