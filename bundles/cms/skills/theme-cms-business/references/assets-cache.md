# Assets And Cache Versioning

## URL Rules

- Blade theme image: `theme_asset('images/file.jpg')`.
- Seed/widget theme path: `theme-assets/{slug}/images/file.jpg` without a leading slash.
- Uploaded admin image: storage path resolved through `asset('storage/'.$path)`.
- CSS/JS: always `versioned_theme_asset('css/{slug}.css')` and `versioned_theme_asset('js/{slug}.js')`.

Do not use another theme's assets, root `asset('css/...')`, static query versions, or `filemtime()`.

## Admin-Editable Image Resolver Contract

Widget image settings have two different path shapes:

- Seeded theme image: `theme-assets/{slug}/images/file.jpg`.
- Admin upload: `homepage-{block-type}/file.jpg`, stored on the `public` disk and served under `/storage/`.

Never resolve `$block->settings` images with only `asset(ltrim($path, '/'))`; that produces a 404 for admin uploads. Use this resolver in every theme widget that reads an editable image, including repeater images:

```php
$resolveImage = static function ($path) {
    $path = ltrim((string) $path, '/');

    if ($path === '' || str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, 'data:')) {
        return $path;
    }

    if (str_starts_with($path, 'theme-assets/') || str_starts_with($path, 'storage/') || str_starts_with($path, 'admin-assets/')) {
        return asset($path);
    }

    return asset('storage/'.$path);
};
```

Apply the same rules to hero, about, process, fleet, CTA backgrounds, testimonial/repeater images, and any new configurable image field. Core model accessors may already resolve their own image paths; inspect them before adding another prefix.

On each deployment, ensure `public/storage` exists (`php artisan storage:link`). This is required in addition to correct widget URL resolution.

## Publish Behavior

ZIP install automatically publishes `themes/{slug}/assets` to `public/theme-assets/{slug}` and generates a new release ID. Direct edits under `themes/{slug}` do not update the public copy on Windows; publish manually:

```powershell
php artisan tinker --execute='app(\App\Services\Theme\ThemeInstaller::class)->publishAssets("{slug}", base_path("themes/{slug}"));'
php artisan view:clear
```

Publishing removes/replaces only that slug's public asset directory, then bumps `theme_asset_version_{slug}`. The changed `?v=` URL forces browsers/CDNs to fetch new CSS/JS.

## Verification

1. Confirm source file exists under `themes/{slug}/assets`.
2. Confirm published file exists under `public/theme-assets/{slug}`.
3. Read rendered HTML and confirm CSS/JS URLs contain `?v=<release-id>`.
4. Request each important asset and confirm `200` with expected content type.
5. Upload a replacement image through `/admin/bo-cuc-trang-chu`, reload the public page, and confirm the rendered URL contains `/storage/` and returns `200`.
6. Repeat the upload check for top-level and repeater image fields used by the theme.
7. Compare source/published/served sizes when diagnosing stale CSS.

Use `config('app.url')` or the rendered URL; `APP_URL` may include `/cms/public`.

## Images

- Download verified real images into the theme; do not rely on fragile Google thumbnail URLs at runtime.
- Keep only assets used by seed/views/widgets/preview/favicon.
- Use inspectable dimensions and meaningful filenames.
- Avoid white placeholder SVGs for visible content.
- Set local asset path in seed/defaults and republish before visual QA.

## Cache Commands

Use cache commands after the relevant operation:

```powershell
php artisan view:clear
php artisan cache:clear
```

Compiled view/cache clearing does not replace public assets and does not bust browser cache by itself. Publishing plus `versioned_theme_asset()` is the required combination.

## Package

Package source theme assets, not `public/theme-assets`. After package, inspect ZIP for current CSS, images, widget overrides, and absence of obsolete assets/brand tokens.
