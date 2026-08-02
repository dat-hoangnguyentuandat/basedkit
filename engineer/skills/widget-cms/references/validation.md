# Widget Validation

Run:

```powershell
php artisan view:cache
php artisan view:clear
php artisan test --filter=WidgetSettingsSchemaValidatorTest
```

For plugin widgets also inspect:

```powershell
php artisan route:list --name=admin.plugins --except-vendor
php artisan tinker --execute="echo app(App\Services\Plugin\PluginManager::class)->list()->pluck('name')->implode(',');"
```

Check:

- Widget appears only in declared `allowed_zones`.
- Popup fields save the exact `$block->settings` keys, including supported nested keys.
- Multiple instances do not collide in IDs, CSS or JS.
- Rich content, images, links, empty state and mobile layout render correctly.
- Plugin is active and manifest/Blade paths resolve.
- No unrelated theme/core fallback, hardcoded industry text or unbounded query remains.
