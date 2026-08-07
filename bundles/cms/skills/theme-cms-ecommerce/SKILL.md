---
name: theme-cms-ecommerce
description: Create, update, validate, or package production Laravel CMS ecommerce themes with approved-design fidelity, editable catalog widgets, Sell-compatible purchase flows, responsive storefront QA, asset provenance, and reinstallable ZIP evidence.
---

# CMS Ecommerce Theme Builder

Build a product-first storefront for the configured Laravel CMS. Treat the theme as presentation and editable demo data; do not invent core/plugin capabilities, routes, facts, reviews, policies, prices, stock, or asset rights.

## Non-negotiable outcome

- Ship the complete core route-view tree, a global storefront shell, local versioned assets, registry, seed, widget overrides, provenance, and an installable ZIP.
- Make catalog discovery primary: visible product navigation, search, data-driven categories, stable product cards, listing pagination, product detail, and honest empty/unavailable states.
- Use `cms_product_purchase_button()` on every purchase surface. Remain useful when Sell is inactive; test real POST/CSRF/cart/checkout behavior when active.
- Keep visible content admin-editable through settings, models, menus, or widget schemas. Never ship dead controls or unsupported filters.
- Match approved design evidence at required breakpoints. Do not substitute a generic beige cosmetics layout when the brief or approved design differs.

## Required workflow

Read [workflow.md](references/workflow.md) first. For creation or substantial redesign, execute every phase in order and do not implement before the capability matrix and approved-design contract exist. For focused update, validation, or packaging, reuse current evidence, run the affected phases, and create any missing evidence required for the claim being made; never invent it merely to unblock release.

At each phase:

1. Read every reference named for that phase completely.
2. Inspect the current CMS/plugin source identified by the reference; documentation never overrides runtime evidence.
3. Record unsupported or unknown capabilities and degrade honestly.
4. Produce the phase artifacts from real evidence.
5. Run the specified gate before advancing.

## Release rules

- `required`: fail when absent.
- `required-if-supported`: implement only when verified by models/controllers/routes/helpers/plugins; otherwise document the fallback.
- `optional-by-brief`: implement only when requested or present in approved design.
- Never render a control that the current public controller/plugin cannot execute.
- Never hardcode `sell.*` routes or `/gio-hang`; follow [commerce-sell.md](references/commerce-sell.md).
- Never claim design, SEO, commerce, responsive, admin-edit, provenance, or ZIP parity from static source inspection alone.

## Validation and handoff

Run the bundled checker from the skill directory:

```powershell
node scripts/check-theme-quality.mjs --theme "<theme-path>"
```

Then complete runtime/browser/admin/SEO/package gates from [validation.md](references/validation.md). A static pass is necessary, never sufficient.

Report approved-design evidence, capability matrix, storefront routes, seed counts, inactive/active Sell results, admin edit checks, responsive screenshots, SEO findings, provenance result, package path/hash, reinstall result, ZIP parity, and factual limitations.
