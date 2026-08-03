# Plugin Validation

Run the checks that match the plugin:

```powershell
php -l plugins/{slug}/src/Plugin.php
php artisan route:list --name=admin.plugins.{slug} --except-vendor
php artisan route:list --path=admin/plugins/{slug}
php artisan view:cache
php artisan view:clear
```

Also run `node --check plugins/{slug}/assets/js/plugin.js` for JavaScript, migration status for database plugins, and the relevant shortcode/widget tests.

Smoke test:

- Discover, activate and deactivate plugin.
- Open admin route/menu with the plugin permission.
- Verify main admin menu opens the management route declared in `admin_menu`.
- Verify the plugin-list Configure button and Plugins sidebar open `settings_route`, never the management route.
- Verify management list/detail/dashboard pages do not render `admin.plugins._sidebar` or an internal management/settings tab bar.
- Verify only plugin configuration pages render the Plugins sidebar.
- Load each route/view and representative frontend route.
- Với plugin có giao diện, render route/view đại diện bằng `vi` và `en`; kiểm tra title, label, button, validation, flash message và empty state không còn hard-code sai locale.
- Gửi ít nhất một form ở locale `en` và xác nhận locale được giữ qua POST, validation và redirect; kiểm tra fallback `vi` khi thiếu key và khi CMS i18n không hoạt động.
- Add a widget only to an allowed zone; edit/save through the schema popup.
- Test shortcode, hook, form CSRF, asset HTTP 200 and duplicate JS boot where applicable.
- Test console `section/item`, CRUD/filter/pagination/export redirects where applicable.
- Inspect ZIP for manifest, required files, no cache/vendor/path/theme contamination; plugin có giao diện phải chứa loader và bộ dịch `vi`/`en`.

Block completion on route/view errors, missing permissions, broken schema persistence, data loss, stale theme dependency, thiếu bộ dịch `vi`/`en`, mất locale qua form/redirect hoặc failed critical smoke test.
