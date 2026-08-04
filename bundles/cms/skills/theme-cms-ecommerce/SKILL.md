---
name: theme-cms-ecommerce
description: "This skill should be used independently to create, update, validate, or package complete Laravel CMS storefronts with product catalogs, search, promotions, cart, checkout, and responsive shopping UX."
license: MIT
metadata:
  version: "1.0.0"
---

# CMS Ecommerce Theme Builder

Create a complete installable ecommerce theme for the configured Laravel CMS root. This skill is self-contained: its `references/` and `scripts/` directories include the full CMS theme contracts, quality gates, asset rules, widget schemas, commerce rules, and validation workflow. Use `themes\\default` as the structural reference and inspect real widget variants before implementation. Produce a working storefront, not a company introduction page.

## Required storefront outcome

- Make the homepage sell or discover products immediately: announcement/promotion bar, header with search and cart, category navigation, hero campaign, featured/bestseller/new-arrival grids, offer strip, brand/category discovery, editorial content, trust/support promises, newsletter, and footer policies.
- Make the desktop header include a dedicated `Danh mục sản phẩm` trigger/rail directly below or beside the main navigation. Open it as a wide mega menu: a left category column and a 3–4 column panel of child categories/subcategories, with clear separators, hover/focus states, and optional campaign image/CTA. Populate it from active CMS menu/category data, never hardcode a single brand's taxonomy.
- Keep the mega menu usable on mobile: collapse to an accordion/drawer, keep search/cart visible, preserve keyboard navigation, and prevent horizontal overflow. Do not hide product categories behind a generic hamburger only.
- Make `/san-pham` or the configured product route a first-class destination in primary navigation. Include category filters, search, sort, pagination, price/sale state, stock state, empty state, and mobile filter controls.
- Make product cards consistent: fixed media ratio, badge, brand/category, name, rating when factual, sale price plus original price, discount label when derivable, wishlist only when implemented, and a visible `Thêm vào giỏ`/purchase action.
- Make product detail pages purchase-ready: gallery, title, SKU/brand, price, sale comparison, stock, variant/quantity controls when supported, add-to-cart form, shipping/return trust copy, description/specification tabs, related products, and breadcrumbs.
- Make cart and checkout paths real under the configured subfolder. Test active `sell` POST/CSRF flows, redirect to cart, quantity/remove/empty states, checkout validation, COD/payment result, and out-of-stock behavior.

## Layout direction

Read [ecommerce-layout.md](references/ecommerce-layout.md) before writing sitemap, widgets, seed, views, or CSS. Use the referenced sites as pattern evidence, never as copied content, branding, or assets. Load the other local references by phase exactly as listed in the included contracts; do not require another skill to resolve them.

## Data and CMS contracts

- Declare `supports.products` and `supports.commerce.purchase_action` in `theme.json`.
- Seed realistic categories, products, prices, sale prices, stock, brands, SKU, product images, and enough records to exercise page 2. Never fabricate availability or reviews; label placeholders in provenance.
- Register editable product-list, category, promotion, brand, trust, newsletter, and commerce blocks. Keep labels, CTA destinations, filters, and media admin-editable.
- Render prices and purchase actions through `cms_product_purchase_button()` with the inactive-plugin fallback. Never hardcode `sell.*` routes or root-relative `/gio-hang` URLs.
- Load [commerce-checklist.md](references/commerce-checklist.md) and the local references `commerce-sell.md`, `pagination.md`, `assets-cache.md`, `internal-links.md`, `validation.md`, and `deterministic-quality-gates.md` before implementation/QA.

## Visual and responsive QA

- Favor clean cosmetics retail hierarchy: generous product imagery, restrained neutral/beige or brand palette, high-contrast sale accents, compact utility header, and clear shopping actions.
- Validate 1440, 1024, 768, 390, 375, and 320px. Keep search/cart/menu usable, product prices aligned, cards equal-height, filters non-overflowing, and checkout controls reachable.
- Capture homepage, category/listing page 1 and 2, product detail, cart, checkout, and mobile menu after lazy images settle. Run the deterministic quality gate and SEO gate after the final source edit.

## Handoff

Report storefront routes, category/product seed counts, active/inactive `sell` behavior, cart/checkout evidence, stock and sale-price behavior, responsive screenshots, SEO result, package path, ZIP parity, and any factual data limitations.
