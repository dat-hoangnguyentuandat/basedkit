# Assets And Packaging

Store plugin assets under:

```text
plugins/{slug}/assets/css/plugin.css
plugins/{slug}/assets/js/plugin.js
plugins/{slug}/assets/images/...
```

Install/activation publishes them to `public/plugin-assets/{slug}/...`. Use plugin paths in widget/view code, never `themes/{theme}` or `theme-assets/{theme}`. Scope CSS and use `@once` for shared loads.

For cache busting, follow the current CMS asset helper/version contract. Do not copy a theme's stale cache strategy or hardcode a development path.

Before ZIP:

- Keep `plugin.json` at the expected root.
- Include only required `routes`, `resources`, `widgets`, `assets`, `database` and `src` files.
- Với plugin có giao diện, include loader và đầy đủ bộ dịch `vi`/`en`; liệt kê entry trong ZIP để xác nhận cả hai locale thực sự được đóng gói.
- Exclude cache, vendor, node_modules, generated ZIPs and temporary files.
- Check no theme dependency or absolute local path remains.
- Reinstall/update without data loss.

Use the project's supported plugin packaging/install flow; verify the ZIP by listing its entries.
