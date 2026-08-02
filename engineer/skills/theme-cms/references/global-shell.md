# Global Shell And Route Views

## One Layout

Every public view extends `layouts.app`. Only the layout renders head, header, footer, floating zones, CSS, and JS. Do not include separate headers/footers in content views.

The layout must query active global blocks on every route, not depend only on `HomeController::$homepageBlocks`:

```blade
@php
  $layoutBlocks = isset($homepageBlocks)
    ? $homepageBlocks
    : \App\Models\HomepageBlock::where('theme_name', active_theme())
        ->where('is_active', true)->orderBy('sort_order')->get()->groupBy('zone');
@endphp
```

Use the same collection for `header`, all footer zones, and float zones. Apply one shared fallback only when the corresponding blocks are absent.

## Head

Include charset, viewport, CSRF token, per-page title/description yields, language, favicon, versioned CSS, and `@stack('css')`. Add canonical/Open Graph/schema according to the SEO gate and core capabilities; use correct absolute URLs and escaped values.

```blade
<link rel="stylesheet" href="{{ versioned_theme_asset('css/{slug}.css') }}">
<script src="{{ versioned_theme_asset('js/{slug}.js') }}"></script>
```

`@stack('css')` and `@stack('js')` are also required for self-contained plugin pages such as `sell` cart/checkout, which extend the active theme layout and publish their own scoped assets.

## Header

- Load active root MenuItem records with active ordered children.
- Keep navigation labels/routes data-driven; include designed empty fallback only when menu data is absent.
- Read `site_logo` directly from `Setting` at render time and resolve through `asset('storage/...')`.
- Never allow widget `settings.logo` or a theme logo to override a configured admin logo.
- If no admin logo exists, render accessible text/brand mark using `site_name`.
- Keep one mobile menu button with `aria-expanded`, keyboard focus, and stable dimensions.

## Footer

- Render `footer_top`, `footer_1..3`, and `footer_bottom` from the same global block collection on every page.
- Use global Settings for identity/contact; use block settings for column-specific content.
- Keep brand wrapping semantic. Derive line spans from current text/settings rather than hardcoding a customer name.

## Homepage

Loop active `main` blocks through `partials.homepage-block`/`widgets.render`. Render sidebar blocks only when present. Defaults in `widgets.php` should normally guarantee content; keep fallback blocks neutral and current-theme-only if needed.

## Content Views

Each route view provides title, description, breadcrumb, H1, empty state, and correct model fields. Listing views retain query parameters and use shared pagination. Detail views use `cms_content()` for rich fields and show related records only when available.

## Audit

Search for header/footer duplication and missing layout inheritance:

```powershell
rg -L "@extends\(['\"]layouts\.app" themes\{slug}\views -g "*.blade.php" -g "!layouts/**" -g "!partials/**"
rg -n "partials\.(header|footer)" themes\{slug}\views -g "*.blade.php" -g "!layouts/app.blade.php"
```

Change the admin logo and verify the same new URL and identical shell on all public routes.
