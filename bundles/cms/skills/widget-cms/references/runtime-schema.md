# Runtime And Schema

## Ownership And Precedence

Paths:

```text
Theme:  themes/{slug}/widgets/{type}/{variant}.blade.php
Core:   public/admin-assets/widgets/{type}/{variant}.blade.php
Plugin: plugins/{slug}/widgets/{type}/{variant}.blade.php
```

Renderer precedence is theme, then core, then plugin. Activation/sync can make shared widget files visible; inspect the active theme and plugin state before editing.

## Block Contract

`$block` is a `HomepageBlock` with `id`, `theme_name`, `zone`, `block_type`, `style_key`, `title`, `settings`, `sort_order`, `is_active`.

Common injected values include `$siteName`, `$siteTag`, `$hotline`, `$hotlineTel`, `$email`, `$address`, `$facebook`, `$youtube`, `$zalo`, `$navItems`, `$solutionCats`, `$products`, `$services`, `$news`, `$categories`.

Read settings defensively:

```blade
@php
  $settings = $block->settings ?? [];
  $title = $block->title ?: ($settings['title'] ?? 'Tiêu đề');
@endphp
```

## Schema Fields

Supported types: `text`, `textarea`, `richtext`, `number`, `select`, `checkbox`, `image`, `color`, `url`, `repeater`.

- Use `fields` for repeater children.
- Use `store` for image storage scope.
- Use dot keys only where the current validator/renderer supports them.
- Keep schema defaults and seeded `settings` aligned.
- Expose heading breaks or line arrays instead of hardcoded customer text.
