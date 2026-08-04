# Widget Settings Schema

## Schema-First Rule

Declare `settings_schema` for every theme-specific configurable widget. When a schema exists, `WidgetSettingsSchemaValidator` handles it instead of legacy controller branches.

Supported field types: `text`, `textarea`, `richtext`, `number`, `select`, `checkbox`, `image`, `color`, `url`, `repeater`.

```php
'banner' => [
  'label' => 'Hero',
  'allowed_zones' => ['main'],
  'settings_schema' => [
    'heading' => ['type' => 'text', 'label' => 'Tiêu đề', 'max' => 220],
    'heading_break_after' => ['type' => 'number', 'label' => 'Xuống dòng sau từ', 'min' => 0, 'max' => 20],
    'image' => ['type' => 'image', 'label' => 'Ảnh nền'],
    'image_alt' => ['type' => 'text', 'label' => 'Mô tả ảnh', 'max' => 180],
    'items' => ['type' => 'repeater', 'label' => 'Mục', 'fields' => [
      'title' => ['type' => 'text', 'label' => 'Tiêu đề'],
      'url' => ['type' => 'url', 'label' => 'URL'],
    ]],
  ],
],
```

## Editable Content Contract

Every visible text, image, alt, icon choice, URL, number, badge, CTA, card title, or description must come from one of:

1. `$block->settings` with a matching schema field and default setting.
2. A core admin model such as Service, Product, News, Testimonial, MenuItem.
3. A documented global Setting such as site identity/contact.

Do not hardcode customer-visible content in widget Blade. A fallback is acceptable only when the same key exists in schema/defaults or when it is a neutral empty state.

## Repeater And Image Rules

- Define every child field explicitly.
- Empty rows are removed by the validator.
- Image uploads retain an `existing_{field}` value in repeater forms.
- Theme-seeded images use `theme-assets/{slug}/...`; uploaded images are stored as public-disk-relative paths and must render through `asset('storage/'.$path)`. Use the full mixed-path resolver from `assets-cache.md` because the same setting may contain either shape.
- Set useful `max`, `min`, options, rows, placeholders, and labels.

## Source Selection

For model-backed widgets, expose control fields such as `title`, `subtitle`, `limit`, `content_source`, category/slugs, layout, and display mode. Edit individual records in their admin module; do not duplicate the full catalog into block settings unless the design explicitly requires manual items.

## Semantic Heading Control

For brand/hero headings that require meaningful lines, expose `heading_break_after` or editable `heading_lines`. Split words in Blade and render line spans. Validate the break index; fall back to balanced natural wrapping when invalid.

## Audit

Compare three sets for every configurable widget:

```text
schema keys = defaults.settings keys = keys read in widget Blade
```

Open the admin editor, save without changing values, reload, then upload a new top-level image and a repeater image. Confirm both public URLs return `200` from `/storage/`; seed defaults must continue to return `200` from `/theme-assets/`. A visible field that cannot be changed from admin is a release blocker.
