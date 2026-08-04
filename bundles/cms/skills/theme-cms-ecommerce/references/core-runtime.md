# Core Runtime Contract

## Inspect First

Read these files before changing a theme:

- `app/Services/Theme/ThemeInstaller.php`
- `app/Services/Theme/ThemeManager.php`
- `app/Services/Theme/ThemeSeeder.php`
- `app/Services/Theme/ThemeWidgetSynchronizer.php`
- `app/Services/Theme/ThemeAssetVersion.php`
- `app/Services/Widget/WidgetRegistry.php`
- `app/Services/Widget/WidgetSettingsSchemaValidator.php`
- `app/Providers/ThemeServiceProvider.php`
- `resources/views/widgets/render.blade.php`

## Install And Resolve

- ZIP install requires `theme.json` and `views/`; slug must match `^[a-z0-9][a-z0-9_-]{1,63}$`.
- Installer accepts a flat ZIP or one wrapper directory, replaces the existing theme directory, publishes assets, and bumps the asset release ID.
- Active theme resolution order: admin `?theme=slug` preview, admin preview session, `ACTIVE_THEME`, saved `active_theme`, then `default`.
- Missing active theme silently falls back to `default`.
- Active theme views are prepended to the Blade finder. Missing theme views therefore fall through to shared views; prevent this by shipping every route view.

## Activation

- `ThemeManager::activate()` saves `active_theme`, syncs standard widgets non-destructively, runs `seed.php`, seeds homepage defaults only when that theme has no blocks, then clears compiled views.
- Existing theme widget files survive normal sync. `php artisan theme:widgets-sync {slug} --force` overwrites them from the standard set.
- Changing `widgets.php > defaults` after activation does not update existing `HomepageBlock` rows. Delete/reseed only that theme's blocks in a controlled test when defaults must be reapplied.

## Widget Rendering

Renderer precedence:

1. `themes/{active}/widgets/{type}/{variant}.blade.php`
2. `public/admin-assets/widgets/{type}/{variant}.blade.php`
3. `plugins/{plugin}/widgets/{type}/{variant}.blade.php`

The renderer injects block, site settings, menu items, products, services, news, and categories. Missing widget files render nothing; verify every default variant physically exists.

## Seed Behavior

- Seed keys: `settings`, `categories`, `products`, `services`, `news`, `testimonials`, `menu_items`.
- Catalog entities are upserted by slug/name.
- When a seeded catalog list is non-empty, rows not listed by the new theme are pruned. Do not claim seed is non-destructive.
- Empty product/service/news/testimonial/category lists skip pruning for that table.
- Imported Google testimonials with `source = google` survive pruning; seed-managed reviews may not.
- Menu items seed only when the menu table is empty, preserving admin navigation on reactivation.

## Theme Boundaries

- Theme owns presentation, widget views, assets, registry, and demo data.
- Plugin owns new routes, migrations, permissions, APIs, hooks, shortcodes, and reusable cross-theme business features.
- Declare plugin dependencies in `theme.json` only when explicitly required.
- A commerce-capable theme declares support, but remains usable when `sell` is inactive. The core purchase helper keeps the theme-owned contact/detail fallback and lets active plugins replace only the action contract.
