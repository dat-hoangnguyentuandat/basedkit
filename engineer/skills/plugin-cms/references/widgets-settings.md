# Plugin Widgets And Settings

Declare each widget in `plugin.json` and create `widgets/{type}/{variant}.blade.php`:

```json
{
  "widgets": {
    "announcement-bar": {
      "label": "Announcement Bar",
      "allowed_zones": ["header", "main"],
      "settings_schema": {
        "message": {"type": "textarea", "label": "Nội dung", "rows": 2},
        "button_url": {"type": "url", "label": "Đường dẫn", "default": "/lien-he"}
      }
    }
  }
}
```

Supported field types: `text`, `textarea`, `richtext`, `number`, `select`, `checkbox`, `image`, `color`, `url`, `repeater`. Match schema keys to Blade reads; use `fields` for repeater and `store` for images. Dot keys are valid only where the current validator supports them.

`$block->settings` stores block-specific content. `PluginSetting` stores plugin-wide configuration. Do not duplicate title/content/image/CTA/items/color forms in the plugin admin when the layout builder schema handles them.

Renderer precedence remains active theme widget, core widget, then plugin widget. The plugin must be active. If a theme seeds a plugin widget, declare and verify the dependency.
