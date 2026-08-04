# Widget Registry

## Required Zones

Declare all admin zones in `widgets.php`:

```php
'zones' => [
  'header' => ['label' => 'Header'],
  'main' => ['label' => 'Trang chủ'],
  'sidebar' => ['label' => 'Sidebar'],
  'footer_top' => ['label' => 'Footer trên'],
  'footer_1' => ['label' => 'Footer 1'],
  'footer_2' => ['label' => 'Footer 2'],
  'footer_3' => ['label' => 'Footer 3'],
  'footer_bottom' => ['label' => 'Footer dưới'],
  'float_left' => ['label' => 'Trái'],
  'float_right' => ['label' => 'Phải'],
],
```

Admin directly accesses header, main, sidebar, footer zones; missing keys can break layout management.

## Select Widget Types

Prefer core types: `header`, `topbar`, `banner`, `slider`, `service-section`, `service-block`, `about`, `stats`, `product-list`, `product-group`, `post-group`, `partners`, `why-choose`, `process`, `customer-testimonials`, `contact-form`, `newsletter`, `product-filter`, `list-of-articles-by-category`, `editor`, `menu`, `social-links`, `fanpage`, `footer`, `floating-action-buttons`.

- Use `banner` for one static hero; use `slider` only for real multiple slides.
- Use model-backed groups for catalog/news content; use repeaters for manual content.
- Keep header in `header`, CTA in `main`/`footer_top`, footer columns in `footer_1..3`, copyright in `footer_bottom`, floating actions in float zones.

## Verify Variants Dynamically

Before declaring a `style_key`:

```powershell
Get-ChildItem public\admin-assets\widgets\{type} -Filter *.blade.php
Get-ChildItem themes\{slug}\widgets\{type} -Filter *.blade.php
```

Do not trust old variant lists. The renderer requires a physical file named exactly `{style_key}.blade.php`.

## Defaults Contract

Each default includes `zone`, `block_type`, `style_key`, `title`, and `settings`. `settings` must mirror every key read by that widget. Use industry-specific realistic defaults with valid internal URLs and current-theme asset paths.

Recommended homepage sequence:

1. Header global block
2. Hero banner/slider
3. Primary services/products
4. About/proof
5. Process/why choose/stats
6. Testimonials
7. News/content
8. CTA
9. Footer columns, copyright, floating actions

## Isolation And Overrides

- Survey standard widget markup and embedded styles before use.
- Prefer theme CSS when markup already supports the design.
- Override in `themes/{slug}/widgets/{type}/{variant}.blade.php` when structure, hardcoded styles, fallback content, or editable fields differ.
- Never edit another theme or depend on another theme's override.
- Never add theme-only widgets to `public/admin-assets/widgets`.

## Registry Audit

For every default, verify:

- Block type exists in `widgets` registry.
- Zone appears in `allowed_zones`.
- Variant file exists.
- Settings keys equal schema keys and Blade reads.
- Model-backed data exists or widget has a designed empty state.
- Admin edit popup opens and saves without dropping nested/image values.
