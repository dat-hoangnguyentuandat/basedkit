# Ecommerce sitemap contract

Apply when `site.businessType` is `ecommerce` or the brief contains products, prices, stock, ordering, cart, checkout, shop/store, or a primary Sản phẩm destination.

## Required CMS contract

- Set `cms.capabilities`: `products`, `commerce.purchase_action`, `cart`, `checkout`.
- Set `cms.models`: at least `products`, `categories`; add `brands`, `news`, `testimonials` only when supported.
- Declare header, main, footer, and floating zones. Make category navigation/mega-menu editable.

## Required templates and pages

- Storefront home (`home`).
- Product/category listing (`product-listing` or `category-listing`) at `/san-pham` with search, category filter, sort, pagination, empty state.
- Product detail (`product-detail`) at `/san-pham/{slug}` with gallery, price/sale, stock, purchase action, related products.
- Cart (`cart`) at `/gio-hang`.
- Checkout (`checkout`) at `/thanh-toan`.
- Order success (`order-success`) at the tokenized Sell-compatible route `/dat-hang-thanh-cong/{token}`.
- News/editorial, contact, shipping, payment, return, privacy, and terms pages when applicable.

## Homepage section order

1. Announcement/promotion.
2. Header utilities: logo, search, account/contact, cart count.
3. Main navigation plus `Danh mục sản phẩm` mega-menu with category rail and 3–4 child columns.
4. Campaign hero.
5. Authenticity/shipping/returns/support promises.
6. Flash sale or featured deals.
7. Bestseller and new-arrival product groups.
8. Brand/category discovery.
9. Editorial/news and newsletter.
10. Footer policies/contact.

## Stitch screens

Include page IDs for home, product listing, product detail, cart, checkout, and order success. Specify desktop mega-menu open state and mobile category drawer/accordion. Require visible search/cart, aligned sale prices, stock states, add-to-cart actions, filters, and checkout controls.

## Data integrity

Never invent prices, stock, variants, reviews, guarantees, shipping thresholds, brands, or promotions. Mark unavailable values as gaps/placeholders. Preserve source provenance for product images and catalog facts.
