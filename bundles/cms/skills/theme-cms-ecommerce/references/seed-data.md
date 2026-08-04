# Seed Data

## Supported Shape

```php
return [
  'settings' => [],
  'categories' => [],
  'products' => [],
  'services' => [],
  'news' => [],
  'testimonials' => [],
  'menu_items' => [],
];
```

Use `category_slug` in product/news seed rows; the seeder resolves IDs. Keep `services` empty unless the brief explicitly needs a service catalog. Use unique slugs and valid model fields. Use `role`, not `position`, for testimonials.

## Authoritative Data Warning

Core treats non-empty catalog lists as authoritative:

- Non-empty product/service/news lists prune rows with other slugs.
- Non-empty testimonial lists prune non-Google rows with other names.
- Non-empty categories prune categories with other slugs after catalog pruning.
- Empty lists skip pruning for that table.

Activate only in an environment where replacing theme-owned demo/catalog data is intended. Do not describe activation as universally non-destructive.

## Settings

Seed site identity, contact details, social links, pagination, campaign hero, announcement, shipping/trust promises, product filters, and other core-supported settings. Use the exact keys documented in `cms-data-routes.md`. Do not seed stale logo paths as the authoritative header logo; admin `site_logo` remains the source of truth.

## Menu

Provide an ecommerce-first main menu with product categories and nested children. `menu_items` has no `route_name` column. Each item may use `label`, `type`, `url`, `slug`, `target`, ordering, SEO fields, and `children`.

Menu seed runs only when the table is empty. Existing navigation from another theme must be reviewed/reset deliberately in test; never silently delete a user's customized menu in theme code.

## Content Volume

Seed enough realistic data to exercise the design and pagination:

- Products: enough cards for every homepage/list state requested and at least one page-2 boundary.
- Categories/brands: enough active rows to render the mega-menu left rail and 3–4 child columns.
- News: at least three meaningful articles with excerpt/content/image.
- Testimonials: preserve provided reviewer names, role, rating, avatar/source fields, and review text without inventing claims.
- Categories: only those referenced by seeded rows.

Do not pad with unrelated old-theme data. If pagination must be visible, either seed more than one page or temporarily lower per-page settings during QA and restore them afterward.

## Asset Paths

Use paths such as `theme-assets/{slug}/images/product-a.jpg` without a leading slash. Confirm each source file exists under `themes/{slug}/assets` and is published to `public/theme-assets/{slug}`.

## Reactivation And Defaults

- Settings/catalog seed reruns on activation.
- Homepage defaults seed only when no block exists for the theme.
- When testing modified defaults, back up if needed, delete only `HomepageBlock` rows for that slug, then let core seed them again.
- Verify counts and visible records after activation; do not infer seed success from command exit alone.
