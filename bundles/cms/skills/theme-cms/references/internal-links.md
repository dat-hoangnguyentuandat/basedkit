# Internal Links And Subfolder Deployments

The CMS commonly runs at an `APP_URL` such as `http://localhost/cms/public`. A raw HTML link like `href="/san-pham"` points to `http://localhost/san-pham`, not `http://localhost/cms/public/san-pham`.

## Rendering contract

Use named routes for known core destinations:

```blade
<a href="{{ route('products.index') }}">Tour</a>
<a href="{{ route('testimonials.index') }}">Đánh giá</a>
```

For admin-editable widget/menu URLs, preserve external/protocol links and resolve internal paths through Laravel:

```blade
@php
$resolveUrl = static function ($value) {
    $value = trim((string) $value);

    if ($value === '' || str_starts_with($value, '#')
        || str_starts_with($value, 'http://') || str_starts_with($value, 'https://')
        || str_starts_with($value, 'tel:') || str_starts_with($value, 'mailto:')) {
        return $value ?: '#';
    }

    return url(ltrim($value, '/'));
};
@endphp
<a href="{{ $resolveUrl($settings['cta_url'] ?? '') }}">{{ $settings['cta_label'] }}</a>
```

Apply the same resolver to hero CTAs, category cards, view-all links, review CTAs, manual/repeater links, footer menus, floating actions, and any URL stored in block settings. Query strings such as `/san-pham?cat=tour-trong-nuoc` must remain intact.

Do not:

- emit a raw leading-slash setting directly in `href`;
- use `asset()` for page routes;
- concatenate `config('app.url')` manually;
- assume testing at domain root represents a subfolder deployment;
- fix only seed defaults while leaving persisted `HomepageBlock.settings` unchanged.

## Browser-equivalent audit

Fetch rendered HTML from the actual public URL. Resolve each anchor exactly as a browser does, using the current page URL as the base:

```powershell
$pageUrl = 'http://localhost/cms/public/'
$page = Invoke-WebRequest $pageUrl -UseBasicParsing
$hrefs = [regex]::Matches($page.Content, '<a[^>]+href="([^"]+)"') |
  ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

foreach ($href in $hrefs) {
  if ($href -match '^(#|tel:|mailto:|javascript:)') { continue }
  $resolved = [uri]::new([uri]$pageUrl, $href)
  if ($resolved.Host -ne 'localhost') { continue }
  try {
    $response = Invoke-WebRequest $resolved.AbsoluteUri -UseBasicParsing -MaximumRedirection 0
    $status = $response.StatusCode
  } catch {
    $status = [int]$_.Exception.Response.StatusCode
  }
  "$status|$href|$($resolved.AbsoluteUri)"
}
```

Do not transform `/san-pham` into `$base + '/san-pham'` inside the audit. That artificial concatenation produces a passing test even though the browser goes to the domain root and receives 404.

Require 200 for direct internal destinations. Review 301/302 individually and accept only intentional canonical/auth redirects. Treat every unintended 404 from a homepage CTA, navigation item, card, footer link, or floating action as a release blocker.

After changing widget defaults, update or deliberately reseed the active theme's persisted block settings, clear views, rerun the rendered audit, and package only after it passes.
