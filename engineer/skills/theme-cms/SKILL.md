---
name: theme-cms
description: "This skill should be used when creating, updating, validating, or packaging a complete Laravel CMS theme with dynamic widgets, seed data, shared layout, versioned assets, pagination, and SEO QA."
license: MIT
metadata:
  version: "5.1.0"
---

# CMS Theme Builder

Create a complete installable theme for `C:\xampp\htdocs\cms`. Treat `themes\default` as the structural reference and `themes\luatsucanmong` as the latest quality example. Keep content, assets, widget settings, routes, and admin editing coherent.

## Load References By Phase

1. Start with [core-runtime.md](references/core-runtime.md), [theme-structure.md](references/theme-structure.md), [cms-data-routes.md](references/cms-data-routes.md), [internal-links.md](references/internal-links.md), and [commerce-sell.md](references/commerce-sell.md) whenever the brief, sitemap, seed, or menu contains products, prices, buying, ordering, shop/store language, or a Sản phẩm destination.
2. Before writing `widgets.php`, load [widgets-registry.md](references/widgets-registry.md), [widget-schema.md](references/widget-schema.md), and [seed-data.md](references/seed-data.md).
3. Before writing views/CSS, load [global-shell.md](references/global-shell.md), [frontend-quality.md](references/frontend-quality.md), [review-cards.md](references/review-cards.md), and [canonical-theme.md](references/canonical-theme.md).
4. Before listing pages, load [pagination.md](references/pagination.md). Before publishing assets, load [assets-cache.md](references/assets-cache.md).
5. Before handoff, load [seo-gate.md](references/seo-gate.md), [validation.md](references/validation.md), and [troubleshooting.md](references/troubleshooting.md).

## Required Workflow

1. Read the sitemap/design and inspect the current CMS files before creating anything.
2. Inspect `themes\default` and real widget variants under `public\admin-assets\widgets`; never clone `satc`, `helmet`, spa, shop, or another industry theme.
3. Create `theme.json`, `widgets.php`, `seed.php`, complete route views, isolated widget overrides only where required, and theme assets.
4. Make every visible setting editable through widget schema or an admin model/Setting. Do not hide content in Blade fallbacks.
5. Verify every `style_key` and every route before activation. Seed realistic industry data and valid menu URLs.
6. Activate the theme, publish assets, clear view/cache state, and reseed blocks only when testing changed defaults.
7. Run smoke tests, pagination tests, responsive screenshots, legacy-content audit, and package audit.
8. Run the SEO skill at `C:\Users\TDat\.claudekit\engineer\skills\seo\SKILL.md` against the public URL. Fix Critical/High findings before completion.
9. Package with `php artisan theme:package {slug}` and inspect the ZIP contents.

## Non-Negotiable Contracts

- Public views extend one `layouts.app`; that layout owns header, footer, float zones, head metadata, versioned CSS/JS, and global blocks.
- Header/footer use the same zone data on every route. Header logo reads admin `site_logo`; block `settings.logo` never overrides it.
- Homepage is block-driven. Declare every admin zone, especially `footer_top`, `footer_1..3`, `footer_bottom`, and `float_left/right`.
- Use `theme_asset()` for theme images and `versioned_theme_asset()` for CSS/JS. Never use `filemtime()` or stale static versions.
- Every admin-editable image resolver must distinguish seeded theme paths from uploaded storage paths. Never pass a raw widget image setting directly to `asset()`; follow the resolver contract in `assets-cache.md` and test an actual admin upload before packaging.
- Use `pagination::theme`, preserve query strings, and constrain pagination SVGs to 15–16px.
- Use `cms_content()` for admin-authored rich content. Use `role` for testimonials, `theme-assets/{slug}/...` for seeded asset paths, and real routes only.
- Resolve every admin/widget-provided internal CTA or menu URL through Laravel `url()`/named routes. Never output a raw leading-slash path such as `/san-pham`: it escapes subfolder deployments such as `/cms/public` and can return Not Found.
- Classify a theme as commerce-capable when its business type sells products or its intended primary menu contains Sản phẩm. Declare `supports.products` and `supports.commerce.purchase_action` in `theme.json`, and render every buy/price action through `cms_product_purchase_button()` with a non-plugin fallback. Never hardcode a `sell.*` route in a theme.
- Validate rendered anchors with browser-equivalent URL resolution against the actual public page URL. Do not prepend `APP_URL` manually during tests, because that can hide broken root-relative links.
- Keep heading line breaks semantic and editable. Avoid `break-all`, global `anywhere`, random `<br>`, or copied old-theme content.

## Mandatory UI Quality Contracts

### Footer: one source of truth

- Render footer identity, contact, and navigation from shared footer zones and global Settings. Do not add a second hardcoded contact column beside footer_3.
- Give every footer zone a deliberate fallback, but suppress that fallback when the corresponding admin zone has content.
- Render the footer on every public route from the same layout block collection; never duplicate footer markup in a route view.
- Verify the rendered footer has exactly one contact heading, one brand/contact identity, no duplicate phone/address blocks, and no unexpected wrapping to a new row at desktop widths.
- Keep footer columns responsive: four columns on wide screens, two on tablet, one on mobile, without duplicate or orphan columns.

### Listings and pagination

- Apply this contract to every grid/card listing that can grow: products, services, news/posts, testimonials/reviews, destinations, galleries, portfolios, projects, FAQs, and any theme-specific collection—not only named core routes.
- The desktop grid may use any deliberate column count. Keep at most two rows per page: page size = desktop columns × 2 (for example, 4 columns = 8 items/page; 3 columns = 6 items/page; 2 columns = 4 items/page). Do not hardcode six globally.
- Store the calculated page-size default in the theme seed Settings and keep it editable through the CMS pagination settings. If the responsive desktop column count changes by breakpoint, use the largest intended desktop count for pagination and document the choice.
- Use the shared pagination::theme view for every paginated listing and preserve search/category query strings.
- Test page 1 and page 2 for every listing with enough seed data to cross that theme’s calculated boundary. Confirm page 1 never renders a third row at the intended desktop width, page 2 returns the remainder, and mobile collapses predictably.
- Add an intentional empty state and fixed card image aspect ratios/heights so one intrinsic image cannot stretch a row.

### Review/testimonial cards

- Use the model avatar accessor or the full mixed-path resolver so uploaded, seeded, and remote avatars all resolve correctly.
- Render initials underneath every remote avatar, not only when its URL is initially empty. Hide only the failed `<img>` in `onerror`; never let an expired, blocked, or late-failing Google avatar expose a broken-image icon or an empty circle.
- Derive stable initials from the first letters of the first two name words, preserve reviewer name, role/source, rating, and full content, and use the same avatar partial on homepage and review listing/detail surfaces.
- Make review cards equal-height flex columns. The quote/content area grows with flex: 1; avatar, name, and role stay aligned at the bottom of every card in the row.
- Clamp long review excerpts to a deliberate line count in the default grid. Provide an accessible `Xem đầy đủ` control that reveals the complete unmodified review in a dialog or equivalent bounded scroll surface; expanding content must not stretch the other cards in the row.
- Keep the rating summary and review CTA editable and factual. Use a clear action label such as Viết đánh giá when linking to Google review submission.
- Test missing avatars, valid local/uploaded avatars, valid remote avatars, deliberately broken remote URLs, slow/late failures, and short/medium/very long reviews. Authors must remain aligned per row on desktop and stack cleanly on mobile.

### Typography and wrapping system

- Define one theme-wide typography token scale (headline-xl, headline-lg, headline-md, body, label) in theme CSS. Apply the same tokens to hero, sections, cards, reviews, CTA, detail pages, and footer headings; do not fix one block with unrelated one-off sizes.
- Set global heading rules to text-wrap: balance, word-break: normal, and overflow-wrap: normal. Set body/copy rules to text-wrap: pretty; never use global white-space: nowrap for content.
- All flex/grid text columns must set min-width: 0; heading and copy wrappers must be allowed to grow before text wraps.
- Avoid one-word orphan lines in hero titles, review summaries, navigation labels, CTA headings, card titles, and metadata. Prefer a wider text column, a coherent font scale, or an editable semantic break over arbitrary line-break tags.
- Any intentional nowrap must be limited to compact UI labels and verified not to overflow at 320px.
- Test rendered typography at 1440, 1024, 768, 390, 375, and 320px. Inspect every H1/H2/H3 and major paragraph for orphan words, clipped text, horizontal overflow, and inconsistent scale. Fix the shared token/layout rule, not only a screenshot-specific selector.

## Completion Evidence

Report the theme path, package path, active theme, routes tested, rendered internal-link audit, asset release URL, admin layout result, seed counts, SEO audit result, remaining risks, and whether `php artisan theme:package {slug}` succeeded. For commerce-capable themes, also report the manifest capability, product-detail/card purchase surfaces, inactive-plugin fallback result, active-`sell` POST/CSRF result, cart redirect, and out-of-stock state. Include footer duplicate audit, listing page-size/page-2 audit, review avatar/equal-height audit, and typography/wrapping responsive audit. Do not report completion when the SEO gate, any internal CTA/menu returns an unintended 404, any Critical/High functional check, or any mandatory UI quality contract is unresolved.
