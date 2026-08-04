# Ecommerce layout reference

Use these observations as structural direction, not as a visual or copy clone.

## Reference patterns

- `https://myphammakeup.com`: product-first navigation with a large Sản phẩm taxonomy, search/contact utility, category list, slider/hero, and a Sản phẩm mới section. Use this for a compact category-led makeup catalog.
- `https://sammishop.com`: search and account utility, promotional navigation (siêu ưu đãi, bán chạy, thương hiệu, makeup, skincare, body, hair, phụ kiện), trust promises, flash-sale/new-arrival/deal modules, brand chips, recommendation grids, policy footer, and newsletter/app promotion. Use this for a mature retail homepage hierarchy.
- `https://takibeauty.com`: delivery/pickup utility, cart count, multi-level category menu, trust badges, category discovery, new-arrival cards with brand, discount, old/new prices, ratings, and `Thêm vào giỏ`, followed by editorial content. Use this for dense catalog and purchase affordances.

## Recommended order

1. Announcement/promotion strip.
2. Header top row: logo/brand, address or delivery utility, search, account/contact, cart count.
3. Main navigation row: home, about/brand, products, news/blog, promotions, contact.
4. Product-category header row: a visible `Danh mục sản phẩm` trigger or left rail plus a wide mega menu. Use one category column and 3–4 child-category columns; show nested groups such as skincare, makeup, body, hair, accessories, tools, and sets when the catalog supports them.
5. Category navigation or chips.
6. Full-width campaign hero with one primary shopping CTA.
7. Trust promises: authenticity, shipping, returns, support.
8. Flash sale or featured deal grid.
9. Bestseller/new-arrival product grid with view-all link.
10. Category/brand discovery row.
11. Editorial/blog or routine/guide content.
12. Newsletter, store/contact, policies, and footer.

## Mega-menu behavior

Render category data from active root menu children or product categories. Keep the panel aligned to the content container, layered above the hero, and wide enough for labels without one-word wrapping. Open on hover only as an enhancement; support click, focus-within, Escape, and touch. Add an explicit close/accordion interaction on mobile. Keep the cart and search controls outside the menu panel and visible while the menu is open.

## Product-card rules

Keep image crops stable and product names readable. Show regular price only when no sale exists; show sale price, original price, and a derived discount badge when both values are valid. Keep purchase action separate from the product-detail link to avoid nested interactive elements. Use a visible unavailable state instead of a fake add-to-cart action.
