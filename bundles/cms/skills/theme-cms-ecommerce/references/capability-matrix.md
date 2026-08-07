# Runtime Capability Matrix

Inspect runtime source before designing controls. Documentation and reference themes are examples, not proof.

## Required artifact

Create `capability-matrix.json` with entries containing:

```json
{
  "feature": "catalog.sort",
  "classification": "unsupported",
  "evidence": ["app/Http/Controllers/ProductController.php"],
  "inputs": [],
  "owner": "core",
  "themeBehavior": "Do not render a sort control"
}
```

Owners are `core`, `theme`, or a named plugin. Classifications are `required`, `required-if-supported`, `optional-by-brief`, or `unsupported`.

## Inspect at minimum

- Public product controller query keys, pagination, sort, category, price, brand, sale, and stock filtering.
- Product/category/menu fields and relationships, including hierarchy depth.
- Product image/gallery, variant, specification, rating, price, sale, SKU, brand, and stock accessors.
- Purchase helper contract and active plugin hooks/routes/forms.
- Plugin ownership of cart, checkout, order success, account, wishlist, promotions, and policy pages.
- Widget registry field types, renderer precedence, global zones, and asset helpers.

## UI rule

Render only executable controls. A label, chip, range, count, cart icon, rating, variant selector, or filter that cannot change/query real state is a defect. For unsupported features, omit the control or show a clearly labeled informational state; never simulate behavior in theme JavaScript.

## Commerce ownership

The theme owns shell compatibility, styling, cards/details, helper invocation, and inactive fallback. Sell owns its routes, cart state, checkout validation, order creation, totals, stock enforcement, and success pages. Override plugin views only when the runtime explicitly supports theme-owned overrides and record that mechanism as evidence.
