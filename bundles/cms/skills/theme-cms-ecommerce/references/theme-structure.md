# Theme Structure

## Required Tree

```text
themes/{slug}/
├── theme.json
├── widgets.php
├── seed.php
├── assets/
│   ├── ASSET-SOURCES.json
│   ├── css/{slug}.css
│   ├── js/{slug}.js
│   └── images/
├── widgets/{type}/{variant}.blade.php
└── views/
    ├── layouts/app.blade.php
    ├── home.blade.php
    ├── contact.blade.php
    ├── product.blade.php
    ├── testimonials.blade.php
    ├── products/index.blade.php
    ├── news/index.blade.php
    ├── news/show.blade.php
    └── partials/{header,footer,homepage-block}.blade.php
```

Ship optional route views such as `brands`, `promotions`, or `wishlist` only when the CMS/plugin exposes those existing routes. Do not invent frontend routes in a theme.

## theme.json

```json
{
  "name": "{slug}",
  "version": "1.0.0",
  "author": "CMS",
  "preview": "assets/images/preview.png",
  "requires_layout": false,
  "supports": {
    "products": true,
    "commerce": {
      "purchase_action": true
    }
  },
  "description": "Short theme description"
}
```

- Folder name must match manifest `slug` when present, otherwise `name`. Prefer both fields with the same slug-safe value when the runtime supports them.
- Use PNG/JPG preview when the design must be inspectable; favicon may be SVG.
- Keep source assets inside the theme. Never reference another theme's public folder.
- Include the `supports` object shown above only for a product-selling theme or a theme whose intended primary menu includes Sản phẩm. Omit commerce support for service-only themes. `supports` declares compatibility; it is not a hard dependency on the `sell` plugin.

## View Ownership

- Every public view starts with `@extends('layouts.app')`.
- Only the layout includes header/footer and renders global zones.
- Route views own page content, breadcrumbs, title/description sections, empty states, filters, sorting, price/stock states, and pagination.
- Detail views render admin content through `cms_content()`.
- Commerce-capable product detail/cards render buy or clickable-price actions through `cms_product_purchase_button()` as specified in `commerce-sell.md`; never call `sell.*` routes directly.
- Use classes/tokens from the current theme; never load `shop.css`, `style.css`, or image paths from an unrelated theme.

## Widget Ownership

- Activation copies standard widget PHP files into the theme non-destructively.
- Add a theme override only when CSS/settings cannot express the required structure or when the standard widget contains wrong hardcoded content/style.
- Keep an override at the exact `{type}/{style_key}.blade.php` path so later activation cannot restore an unwanted shared fallback.

## No Legacy Contamination

Audit names, visible strings, comments, URLs, image filenames, defaults, and ZIP entries for old industries/themes. Fallback text must be neutral or current-industry content. Do not copy source directories from `satc`, `helmet`, spa, shop, or another customer theme.

## Package Shape

`php artisan theme:package {slug}` stores source files without a wrapper folder. Confirm ZIP contains `theme.json`, `views`, `assets/ASSET-SOURCES.json`, current assets, `widgets.php`, `seed.php`, and required widget overrides; exclude public published copies, caches, logs, and unrelated assets. Generate sorted source/ZIP file manifests with SHA-256 and require parity.
