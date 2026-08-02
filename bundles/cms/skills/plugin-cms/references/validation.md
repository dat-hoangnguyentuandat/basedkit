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
- Add a widget only to an allowed zone; edit/save through the schema popup.
- Test shortcode, hook, form CSRF, asset HTTP 200 and duplicate JS boot where applicable.
- Test console `section/item`, CRUD/filter/pagination/export redirects where applicable.
- Inspect ZIP for manifest, required files, no cache/vendor/path/theme contamination.

Block completion on route/view errors, missing permissions, broken schema persistence, data loss, stale theme dependency or failed critical smoke test.
