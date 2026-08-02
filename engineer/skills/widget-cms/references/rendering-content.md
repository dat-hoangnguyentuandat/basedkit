# Rendering And Assets

## Rich Content

Widget output passes through the CMS shortcode/hook pipeline. For admin-authored rich text use:

```blade
{!! cms_content($settings['content'] ?? '', $block) !!}
```

Do not output untrusted admin HTML directly when shortcode/content processing is required. Escape plain text and URLs. Scope queries and add a limit.

## CSS And JS

Scope selectors under a widget prefix. Use `@once` for shared inline asset pushes. Wrap JS in an IIFE or module, read options from `data-*`, and prevent duplicate initialization when multiple blocks render.

```blade
@once
  @push('css')
  <style>.announcement-widget{padding:16px}</style>
  @endpush
@endonce
```

Plugin widgets load `plugin-assets/{slug}/...`; theme widgets use the theme asset helper. Never hardcode another theme's asset path.

## Legacy

Legacy forms/validation may exist in `resources/views/admin/homepage-layout/_blocks.blade.php` and `HomepageLayoutController`. Maintain them only for old widgets; do not add new special cases when schema can express the field.
