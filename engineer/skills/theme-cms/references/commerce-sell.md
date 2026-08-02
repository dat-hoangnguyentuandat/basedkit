# Commerce Theme And Sell Compatibility

## Classification Gate

Treat a theme as commerce-capable when any of these is true:

- The brief describes a shop, store, retail, catalog sale, physical/digital goods, ordering, checkout, cart, or product prices intended for purchase.
- The sitemap or intended primary navigation contains Sản phẩm.
- Product cards/details contain Mua, Đặt hàng, Thêm vào giỏ, or a clickable price intended to start a purchase.

Do not classify a service-only theme merely because the CMS requires `product.blade.php` or synchronized product widgets exist. Complete themes ship core route views, so file presence is not a runtime capability signal.

## Manifest Contract

Add this exact shape to `theme.json` for a commerce-capable theme:

```json
"supports": {
  "products": true,
  "commerce": {
    "purchase_action": true
  }
}
```

This is an opt-in compatibility declaration, not a plugin dependency. The theme must still render a useful contact or product-detail fallback when `sell` is absent or inactive. Do not add `sell` to a required-plugin list solely for purchase enhancement.

## Purchase Action Contract

Never call `route('sell....')`, hardcode `/gio-hang`, inspect the plugin database, or check a plugin folder from theme code. Render the core helper and let its hook replace the action:

```blade
{!! cms_product_purchase_button($product, [
  'context' => 'detail',
  'class' => 'theme-btn theme-btn--primary',
  'fallback_label' => 'Liên hệ đặt mua',
  'fallback_url' => route('contact'),
  'sell_label' => 'Thêm vào giỏ',
  'aria_label' => 'Thêm '.$product->name.' vào giỏ hàng',
]) !!}
```

The active `sell` plugin changes the helper result to a CSRF-protected POST form. When inactive, the helper renders the theme fallback link. Preserve theme styling through the `class` option and add a scoped `.cms-product-purchase-form` layout rule when needed.

For a price action on a card:

```blade
{!! cms_product_purchase_button($product, [
  'context' => 'card-price',
  'class' => 'theme-product-card__price-action',
  'fallback_label' => number_format((float) $product->display_price, 0, ',', '.').'₫',
  'fallback_url' => route('product.show', $product->slug),
  'sell_label' => number_format((float) $product->display_price, 0, ',', '.').'₫',
  'aria_label' => 'Thêm '.$product->name.' vào giỏ hàng',
]) !!}
```

The fallback price links to product detail; the active-plugin price becomes a POST button. Never trust a price or total submitted by the browser—the `sell` plugin recalculates current product price and stock.

## Markup And Layout Rules

- Never nest the generated POST form/button inside an `<a>` that wraps the whole card. Use `<article>`, separate image/title/detail anchors, and a sibling purchase helper.
- Use the helper on every intended purchase surface: product detail primary CTA, listing/home product-card price or buy button, related products, and theme-specific product widget cards.
- Keep ordinary product-detail links as GET anchors. Only purchase actions become POST.
- Give disabled/out-of-stock controls an intentional visual state; active `sell` returns Hết hàng when stock is zero.
- Keep `@stack('css')`, the CSRF meta tag, and `@stack('js')` in `layouts.app` so plugin pages and forms work across routes.
- Do not seed a Giỏ hàng menu URL. `sell` owns cart/checkout routes and may be inactive.

## Required Verification

1. Confirm `theme_supports('products')` and `theme_supports('commerce.purchase_action')` return true for the theme.
2. Deactivate `sell`; render product detail/list/home widgets and require the declared fallback link, valid styling, and no missing route.
3. Activate `sell`; require each purchase surface to render `method="post"`, an `_token`, and a valid framework-generated action URL.
4. Click each surface and require one item in `/gio-hang`; test repeated add, update, remove, empty cart, and the back-to-products link.
5. Test stock zero, inactive product, price change after adding, checkout validation, one successful COD order, and responsive cart/checkout at 390 and 320px.
6. Verify service-only themes have no commerce capability and retain their original contact/service behavior.
