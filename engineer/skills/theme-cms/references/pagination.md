# Pagination Contract

Laravel's default paginator view may emit Tailwind classes. Themes do not load Tailwind, causing giant SVG arrows and broken controls. Every listing must use the shared CMS view:

```blade
@if($items->hasPages())
  <div class="pagination-wrap">
    {{ $items->links('pagination::theme') }}
  </div>
@endif
```

Use the actual variable (`$products`, `$services`, `$posts`, `$testimonials`). Never call plain `$items->links()`.

## Required CSS

```css
.pagination-wrap{width:100%;margin-top:40px;overflow:hidden}
.pagination{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
.pagination .page-item{display:flex;flex:0 0 auto;margin:0;padding:0}
.pagination .page-link{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:42px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--text);font:inherit;font-size:14px;font-weight:600;line-height:1;text-decoration:none;white-space:nowrap}
.pagination a.page-link:hover,.pagination .active .page-link{background:var(--primary);border-color:var(--primary);color:#fff}
.pagination .disabled .page-link{opacity:.42;cursor:not-allowed;pointer-events:none}
.pagination .page-link:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.pagination .page-link svg{display:block;width:16px!important;height:16px!important;min-width:16px;max-width:16px;flex:0 0 16px}
@media(max-width:560px){.pagination{gap:6px}.pagination .page-link{min-width:38px;height:38px;padding:0 10px;font-size:13px}.pagination .page-link svg{width:15px!important;height:15px!important;min-width:15px;max-width:15px}}
```

Adapt tokens, not required dimensions/states.

## Query Preservation

Product/service/news controllers already call `withQueryString()`. Preserve existing search/category keys in forms/links. Do not hand-build pagination query strings in Blade.

## Test

- Ensure data/settings produce at least two pages.
- Test page 1 and `?page=2` for products, services, news, testimonials.
- Test combined filters such as `?cat=...&q=...&page=2` where supported.
- Confirm 200 status, one active page, previous/next states, keyboard focus, 15–16px arrows, and no 390px overflow.

Audit default links:

```powershell
rg -n -- "->links\(\)" themes\{slug}\views
rg -n "links\('pagination::theme'\)" themes\{slug}\views
```
