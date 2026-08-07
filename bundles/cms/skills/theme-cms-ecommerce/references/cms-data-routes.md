# CMS Data, Routes, And Settings

## Stable Public Routes

| Route | Path | View |
|---|---|---|
| `home` | `/` | `home` |
| `products.index` | `/san-pham` | `products.index` |
| `product.show` | `/san-pham/{slug}` | `product` |
| `news.index` | `/tin-tuc` | `news.index` |
| `news.show` | `/tin-tuc/{slug}` | `news.show` |
| `contact` | `/lien-he` | `contact` |
| `contact.store` | POST `/lien-he` | JSON response |
| `testimonials.index` | `/danh-gia` | `testimonials` |

Do not link `/uu-dai`, `/bang-gia`, `/dat-lich`, or a standalone search route unless core actually defines it. Product/news search uses `?q=`; category and sort filters use controller-supported query keys.

## Existing Optional Routes

Core also defines `/tu-van`, `/tuyen-sinh`, `/diem-noi-bat`, and `/khoa-hoc-noi-bat`. Use only when the requested site needs them and the corresponding view is shipped; otherwise omit from navigation.

Plugin `sell` may add `/gio-hang`, `/thanh-toan`, and `/dat-hang-thanh-cong/{token}` only while it is active. Themes must not seed or hardcode those optional routes. A product purchase control reaches them through the core hook contract when `sell` is active and retains its declared fallback otherwise; see `commerce-sell.md`.

## Admin-Editable Settings

- Identity: `site_name`, `site_logo`, `site_desc`, `site_tagline`
- Contact: `hotline`, `zalo`, `email`, `address`, `working_hours`
- Social: `facebook_url`, `youtube_url`, `instagram_url`
- Campaign/hero: `hero_heading`, `hero_lead`, `hero_desc`, plus theme-owned announcement/promotion settings
- Pagination: `products_per_page`, `news_per_page`, `testimonials_per_page`, `search_per_page`, and related-count keys
- Reviews: `google_review_url`
- Operations: `maintenance_mode`, `maintenance_message`

Use `\App\Models\Setting::get()` unless the file imports `Setting` explicitly. Do not invent settings that no admin form/model uses unless the theme owns a schema field for them.

## Controller Data

- Home receives active products, categories, testimonials, FAQs, news, and grouped homepage blocks.
- Product listings support search, category filters, configured page size, and `withQueryString()`.
- News uses `danh-muc` for category and configured pagination.
- Testimonial listing prioritizes rows with avatars and provides a Google review URL when available.
- Detail routes increment views and provide related records.

## Menu Contract

Seed an ecommerce-first core menu: Trang chủ, Sản phẩm, Danh mục sản phẩm (with children), Khuyến mãi and Thương hiệu only when supported, Tin tức, and Liên hệ. Do not seed a plugin-owned Giỏ hàng URL. Let the active commerce integration expose cart navigation through its verified hook/helper; use a catalog or contact fallback while inactive. Use `type`, `url`, `slug`, and optional `children`; never use nonexistent `route_name` column. Menu seed runs only on an empty table, so inspect existing menu data during testing.

Seeded/admin URLs may be stored as paths such as `/san-pham`, but views must resolve them through `url(ltrim($path, '/'))` or a named route before rendering. Never emit stored root-relative paths directly; see `internal-links.md`.

If the intended primary menu contains Sản phẩm, treat the theme as commerce-capable even when the brief does not explicitly say “shop” or “bán hàng”. Declare the manifest capability and audit every product detail/card action.

## Content Rendering

Use `cms_content($value, $model)` for product, news, category/editorial, and other admin-authored rich content so core/plugin shortcodes and content hooks execute. Escape plain labels and settings with `{{ }}`.
