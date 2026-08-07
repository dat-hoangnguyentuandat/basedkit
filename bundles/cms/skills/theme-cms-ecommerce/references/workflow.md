# Ecommerce Theme Workflow

Follow these phases in order. A failed gate blocks the next phase.

## 1. Runtime discovery

Read `core-runtime.md`, `cms-data-routes.md`, `theme-structure.md`, and `capability-matrix.md`. Inspect the named CMS files plus active commerce plugin routes/views/hooks. Produce `capability-matrix.json`. Gate: every requested control is classified as `required`, `required-if-supported`, `optional-by-brief`, or `unsupported`.

## 2. Evidence and design

Read `approved-design.md`, `ecommerce-layout.md`, `frontend-quality.md`, and `assets-provenance.md`. Read the brief, sitemap, approved design manifest, and all supplied screenshots. Produce a screen/component/token map and `assets/ASSET-SOURCES.json`. Gate: factual and visual placeholders are identified; no unlicensed asset is accepted as production content.

## 3. Data and navigation

Read `seed-data.md`, `widget-schema.md`, `widgets-registry.md`, and `internal-links.md`. Map verified data to actual model/seeder fields. Define menu/category hierarchy and mega-menu fallback for sparse data. Gate: seed fields exist at runtime, page 2 is exercisable, and every visible widget value has an editable source.

## 4. Theme implementation

Read `global-shell.md`, `assets-cache.md`, `pagination.md`, `review-cards.md`, and `canonical-theme.md`. Build from the configured default theme and current standard widgets, never another customer theme. Gate: compile views, run the bundled checker, publish assets, and resolve all static errors.

## 5. Commerce integration

Read `commerce-sell.md` and `commerce-checklist.md`. Test inactive Sell fallbacks first, then active Sell purchase surfaces and plugin-owned pages. Gate: real product add/update/remove/empty/out-of-stock/checkout validation/success evidence; no hardcoded plugin route.

## 6. QA, SEO, and package

Read `deterministic-quality-gates.md`, `seo-gate.md`, `validation.md`, and `troubleshooting.md`. Run browser, admin-edit, responsive, SEO, package, reinstall, and ZIP parity checks. Gate: no Critical/High finding, no empty evidence set, and installed ZIP matches the validated source.

## Evidence integrity

- A report passes only when every required assertion contains observations.
- Zero cards, zero screenshots, zero tested purchase actions, unavailable URLs, or skipped admin edits cannot be recorded as a pass.
- Record commands, URLs, timestamps, viewport, status, and artifact paths so another agent can reproduce the result.
