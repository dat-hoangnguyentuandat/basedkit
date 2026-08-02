# Plugin Widget Boundary

Use a plugin widget when it needs a route, permission, migration, API, hook, shortcode, plugin-wide setting, business data or reuse across themes.

```text
plugins/{slug}/
├── plugin.json
└── widgets/{type}/{variant}.blade.php
```

Register `widgets.{type}.label`, `allowed_zones` and `settings_schema` in `plugin.json`. The plugin must be active before the widget appears in the layout builder.

Keep block fields in `widgets.*.settings_schema`: title, content, image, CTA, items, color and layout. Keep plugin admin pages for CRUD, workflow, import/export, logs, API and plugin-wide settings. Do not duplicate block settings or redirect the layout-builder edit button to plugin settings.

If a theme seeds a plugin widget, declare the dependency where the CMS supports it and verify activation order. Keep plugin views/assets self-contained; do not require `themes/{theme}` or `theme-assets/{theme}`.
