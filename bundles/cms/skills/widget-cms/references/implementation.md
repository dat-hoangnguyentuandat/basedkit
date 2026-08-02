# Widget Implementation

## Theme Widget

1. Confirm active theme, target zone and existing style key in `themes/{slug}/widgets.php`.
2. Add `themes/{slug}/widgets/{type}/{variant}.blade.php`.
3. Register label, `allowed_zones`, `settings_schema` and optional defaults.
4. Clear views, open `Admin > Bố cục trang chủ`, add the widget and save through the popup.

## Core Widget

Use `public/admin-assets/widgets/{type}/{variant}.blade.php` only when the behavior and markup are genuinely system-wide. Avoid theme colors, theme asset paths and industry-specific fallback content.

## Blade Rules

- Provide neutral defaults for missing settings.
- Keep `type`, `variant`, registry, defaults and Blade path exact.
- Use semantic sections/headings, accessible labels and valid links.
- Keep IDs stable and unique: `$uid = 'widget-'.$block->id`.
- Do not put database migrations, permissions or plugin business logic in a theme/core widget.

Example:

```blade
@php
  $s = $block->settings ?? [];
  $uid = 'announcement-'.$block->id;
  $message = $s['message'] ?? 'Thông báo';
@endphp
<section id="{{ $uid }}" class="announcement-widget">
  {{ $message }}
</section>
```
