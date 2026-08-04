# Validation And Handoff

## Static Audits

```powershell
php artisan view:cache
php artisan theme:widgets-sync {slug}
rg -n -i "SATC|Helmet CMS|Hải Luật|luatsuhailuat|spa|shop|camera|wifi|placeholder" themes\{slug} -g '!assets/images/*'
rg -n -- "->links\(\)" themes\{slug}\views
rg -n "asset\(['\"](css|js)/|filemtime\(|theme-assets/(satc|helmet|spa|shop)" themes\{slug}
rg -n "asset\(ltrim\([^\n]*(image|path)|str_starts_with\([^\n]*'http'\)[^\n]*asset\(ltrim" themes\{slug}\widgets
rg -n "route\(['\"]sell\.|href=['\"]/gio-hang|action=['\"]/gio-hang" themes\{slug}
```

The legacy-token and image-resolver scans must be reviewed for false positives, not blindly ignored. A raw editable image passed to `asset()` without storage-path handling is a release blocker.

## Smoke Routes

Request every route the theme ships and representative detail routes. Require 200 for valid pages and intentional 404 for invalid slugs. Include `/`, `/san-pham`, one category-filtered listing, `/san-pham/{slug}`, `/gio-hang`, checkout, order success, `/tin-tuc`, `/tin-tuc/{slug}`, `/lien-he`, and policy routes when shipped.

Check rendered HTML for:

- One theme shell and no duplicated header/footer.
- Main blocks, empty states, breadcrumbs, titles, descriptions, assets, forms, and links.
- No exception/fallback view from `resources/views`.
- CSS/JS `?v=` release IDs and served 200 assets.

Run the browser-equivalent anchor audit from `internal-links.md` on the homepage and every shared navigation/footer shell. Require all internal CTA, category, card, review, menu, footer, and floating-action destinations to return 200 or an explicitly reviewed intentional redirect. Test using the deployed subfolder URL (for example `/cms/public`), not only domain root. A manual `$base + $href` concatenation is invalid because it can conceal root-relative Not Found bugs.

For a commerce-capable theme, additionally require:

- `theme.json` resolves true for `theme_supports('products')` and `theme_supports('commerce.purchase_action')`.
- With `sell` inactive, detail/card purchase controls render the declared safe fallback and no `sell.*` route is referenced.
- With `sell` active, every intended buy/clickable-price surface renders a POST form with `_token`, adds one product, and redirects to the rendered `/gio-hang` URL under the configured subfolder.
- Quantity update/remove, empty cart, checkout validation, successful COD order, and out-of-stock disabled state work without nested forms or nested interactive anchors.

## Admin Checks

Open `/admin/bo-cuc-trang-chu` and verify all declared zones render without undefined keys. Add/edit/reorder/delete a block as an admin. Open schema popup, save text/image/repeater values, reload, and confirm persistence. Replace at least one top-level widget image and one repeater image, then verify their rendered `/storage/` URLs return `200`. Confirm seeded `/theme-assets/` images still return `200`. Verify `theme_name`, block counts, and style files.

## Visual Checks

Use Playwright or an equivalent browser at 1440, 1024, 768, 390, 375, and 320px. Capture home, mega-menu open state, product listing, product detail, cart, checkout, contact, and pagination page 2. Click representative hero, category, mega-menu child, product, cart, footer, and mobile-menu links and require the expected non-404 destination. Check no horizontal overflow, clipped text, giant SVG, unstable product crop, broken logo, overlapping footer, or accidental old palette.

For reviews, also capture the homepage review block and the pagination page containing the longest imported review after remote images have settled. Deliberately test a broken remote avatar URL and require visible initials with no broken-image icon, alt fragment, blank circle, or layout shift. Verify short/medium/very-long cards align before interaction, `Xem đầy đủ` exposes the complete text in a bounded dialog, and closing restores normal focus/scroll behavior.

## Data Checks

```powershell
php artisan tinker --execute="echo 'Products: '.App\Models\Product::count().', Categories: '.App\Models\Category::count().', News: '.App\Models\News::count().', Testimonials: '.App\Models\Testimonial::count();"
php artisan cache:clear
php artisan view:clear
```

Compare counts to the seed and document authoritative pruning effects. Do not reset unrelated database tables.

## Final Package

```powershell
php artisan theme:package {slug}
```

Inspect the ZIP directly. Confirm manifest, views, registry, seed, current assets, widget overrides, and no fallback/old-theme tokens. Report package path and byte size.
