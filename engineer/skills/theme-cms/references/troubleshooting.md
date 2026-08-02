# Troubleshooting

## CSS/JS/Images Look Old

Cause: source assets changed but public copy or browser URL did not. Run `publishAssets()` for the slug, then `view:clear`; confirm `versioned_theme_asset()` emits a new `?v=`. Do not use `filemtime()`.

## Image Breaks After Editing A Homepage Block

Cause: CMS uploads store a public-disk-relative path such as `homepage-about/file.jpg`, but the theme widget resolved it with `asset($path)` and generated `/homepage-about/file.jpg` instead of `/storage/homepage-about/file.jpg`.

Fix every editable image resolver in the affected theme, not the core uploader. Preserve absolute/data URLs, pass `theme-assets/`, `storage/`, and `admin-assets/` through `asset()`, and prefix other relative paths with `storage/` as documented in `assets-cache.md`. Then run `php artisan storage:link` on the deployment host, clear views, replace the image again in admin, and require a served `200` URL before packaging.

## Page Uses Another Theme's Style

Cause: a required view is missing and Blade falls through to shared resources. Ship every route view in `views/`, especially `services/index`, `service`, `products/index`, `product`, `news/index`, `news/show`, and `testimonials`. Clear compiled views.

## Homepage Blocks Missing

Check `widgets.php` exists, active theme is correct, `HomepageBlock::where('theme_name', $slug)` has rows, and `home.blade.php` renders grouped main blocks. If defaults changed after activation, delete/reseed only that theme's blocks in a test database.

## Admin Layout Undefined Zone

Add all hardcoded admin zones, especially `footer_top`, `footer_1`, `footer_2`, `footer_3`, `footer_bottom`, `float_left`, and `float_right`. Keep labels and allowed zones consistent.

## Widget Missing Or Empty

Check exact `block_type/style_key` file under theme or standard widgets. Confirm `WidgetRegistry` loaded the active theme, variant exists, and widget settings keys match the schema. Inspect embedded styles for wrong hardcoded colors/fonts and create a theme override when needed.

## Defaults Do Not Change

Core seeds homepage defaults only when no block exists. Delete only the target slug's `HomepageBlock` rows, reload admin layout, and reseed in a controlled environment. Do not delete all themes' blocks.

## Menu Is Wrong

Menu seed runs only when `menu_items` is empty. Inspect `MenuItem` rows, remove only intentional stale demo navigation in a test environment, rerun activation, then verify six valid primary links and nested children.

## Logo Is Wrong

Header must read `Setting::get('site_logo')` at render time. Check old upload data, storage URL, `brand-logo` max dimensions, and header widget priority. Do not delete a user's uploaded logo during theme activation.

## Pagination Is Broken

Replace plain `links()` with `links('pagination::theme')`; add wrapper/page-item/page-link CSS and explicit SVG sizes. Check controller `withQueryString()` and test page 2 with filters.

## Homepage Button Or Footer Link Returns Not Found

Cause: a widget/menu setting such as `/san-pham` was emitted directly into `href`. In a deployment under `/cms/public`, the browser resolves it against the domain root and requests `/san-pham` outside the application. Another common cause is fixing defaults without updating persisted `HomepageBlock.settings`.

Resolve internal settings through `url(ltrim($value, '/'))` or named routes while preserving external, hash, `tel:`, and `mailto:` links. Apply the resolver to every widget that reads editable URLs, not only the reported button. Update/reseed the active block settings when needed, clear views, and run the browser-equivalent audit in `internal-links.md`. Never validate by manually prepending the application base URL to a raw leading-slash href; that hides the bug.

## Review Avatar Shows A Broken Image Or Blank Circle

Cause: the template assumes a non-empty remote avatar URL will load, or it initially hides the initials fallback and relies on a late `onerror` timing change. Google avatar URLs can expire, reject hotlinking, or fail after first paint.

Use the model accessor, but always render stable initials underneath the remote image in the same fixed-size grid wrapper. Give the image an empty `alt`, `referrerpolicy="no-referrer"`, and `onerror="this.hidden=true"`. Reuse one partial on homepage and `/danh-gia`. Test an intentionally invalid URL after waiting for image load/error; no broken icon, visible alt text, or empty avatar is acceptable.

## One Long Review Makes The Whole Row Extremely Tall

Cause: an unbounded quote grows the CSS grid row, forcing short sibling cards to match its height and leaving large blank areas.

Clamp the default excerpt to a deliberate line count, keep the author anchored with `margin-top:auto`, and expose the full review through an accessible bounded dialog with internal scrolling. Preserve the complete original content; do not truncate it in the database. Test the pagination page containing the longest imported review, not only seed reviews.

## ZIP Install Fails

Confirm valid ZIP MIME, `theme.json` at root or one wrapper level, valid slug, `views/` directory, and no unsafe `..` entry. Repackage with `php artisan theme:package {slug}` and inspect entries.

## Product Button Still Opens Contact While Sell Is Active

Confirm the active theme manifest declares both `supports.products = true` and `supports.commerce.purchase_action = true`. Ensure the view uses `cms_product_purchase_button()` rather than a hardcoded contact anchor, the `sell` plugin is active, and `sell.cart.items.store` exists in `route:list`. Clear compiled views after changing the manifest or Blade.

If a product card wraps the entire card in `<a>`, do not insert the purchase form inside that anchor. Change the outer element to `<article>`, retain separate links for image/title/detail, and render the purchase helper as a sibling POST form. Nested interactive controls are invalid and browsers may submit or navigate unpredictably.

## Service Theme Unexpectedly Shows Cart Actions

Remove the commerce capability from service-only `theme.json`. Runtime detection must not scan for inherited product view files because all complete themes ship core route views. Compatibility is an explicit manifest decision based on the requested business type or intended Sản phẩm menu.

## Old Content Remains

Search theme source and ZIP for old brand strings, URLs, filenames, fallback text, and old public asset paths. Replace theme override files rather than editing shared widget files.
