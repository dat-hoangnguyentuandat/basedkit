# Lifecycle And Structure

## When To Use

Use a plugin for route, admin page, permission, API, migration, business data, shortcode, hook, frontend integration, reusable widget or plugin-wide settings. Use `theme-cms` for presentation-only changes.

## Standard Layout

```text
plugins/{slug}/
├── plugin.json
├── admin_console.php              # optional
├── src/Plugin.php                 # optional provider
├── routes/admin.php               # optional
├── routes/web.php                 # optional
├── routes/api.php                 # optional
├── database/migrations/            # optional
├── resources/views/                # optional
├── widgets/{type}/{variant}.blade.php
└── assets/                         # optional
```

Use lowercase `kebab-case` for slug, plugin name and permission namespace. Keep plugin code/views/assets/migrations together.

## Lifecycle

1. Create manifest and files.
2. Let `PluginManager` discover or install the plugin.
3. Activate and publish routes/assets/migrations as supported by core.
4. Verify routes, admin menu, permissions, views, widgets and data.
5. Deactivate without deleting data; update/reinstall without destructive migration.

Do not create a half-plugin through UI when the user needs a stable installable module.
