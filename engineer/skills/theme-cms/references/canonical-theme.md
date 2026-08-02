# Canonical Complete Theme Pattern

Use `themes/luatsucanmong` as a recent end-to-end example, not as copyable customer content.

## Patterns To Reuse

- Complete manifest, registry, seed, local assets, JS/CSS, route views, partials, and isolated widget overrides.
- All standard zones declared, with header/footer/float blocks included in defaults.
- Theme-specific schema for hero, services, about, process, reviews, CTA, footer menus, and floating controls.
- Homepage composition: hero, primary services, about, process, testimonials, news, CTA, footer.
- Shared layout loads global blocks for non-home routes.
- Listing pages include search/filter, empty states, stable cards, and `pagination::theme`.
- Detail pages render rich admin content through `cms_content()`.
- Testimonials use avatars when available and a designed fallback.
- Montserrat is loaded and applied consistently when required by the design.
- Hero/footer brand headings use semantic line grouping instead of accidental wrapping.
- About image has an explicit responsive height/crop instead of inheriting portrait height.
- CSS/JS use `versioned_theme_asset()` and assets are republished after changes.

## Adapt, Do Not Copy

Replace all of the following for each new theme:

- Slug, manifest, branding, business facts, colors, typography, copy, routes used, categories, products/services/news/reviews.
- Image files, filenames, alt text, map/review URLs, phone/address, menu labels, footer links.
- Widget settings and structure needed by the actual mockup.

Never copy legal claims, reviewer text, business address, or old asset paths into another industry/customer theme.

## Improve On The Example

The example may contain historical compatibility code. New themes must follow current contracts even when the example differs:

- Admin `site_logo` has priority over widget/theme logo settings.
- Avoid customer-specific visible fallback blocks in `home.blade.php`; defaults should carry editable content.
- Keep SEO metadata/canonical/schema more complete than the minimal example head.
- Treat seed catalog lists as authoritative because current core prunes rows not listed.
- Verify all copied standard widgets; remove unused files from the final package only when activation will not restore an unwanted fallback.

## Completeness Test

A theme is comparable in completeness when it can be installed from ZIP, activated on a clean database, edited through admin layout/settings, viewed on every core route, republished without stale assets, audited at mobile/desktop, passed through SEO checks, and packaged again without external theme dependencies.
