# Approved Design Contract

Do not code from an industry adjective alone. Use the approved sitemap/design artifacts as the visual source of truth.

## Required inputs

- Sitemap and route inventory.
- Approved design manifest or decision record.
- Desktop and mobile evidence for home, listing, detail, cart, checkout, success, and other required routes.
- Typography, color, spacing, container, grid, radius, media-ratio, and interaction decisions.
- Factual guardrails separating design placeholders from verified production data.

Stitch may produce the approved evidence, but the contract is tool-neutral. Record project/screen identifiers when Stitch is used. Never copy generated names, prices, stock, ratings, policies, discounts, or delivery claims into seed without factual evidence.

## Component map

For every screen, map each visible region to its owner and source:

```text
screen -> component -> route/widget/view -> data source -> editable source -> breakpoint states
```

Include header/mega-menu, hero, product card, grids, filters, detail purchase area, plugin pages, footer, empty/error/loading/disabled states, and mobile navigation.

## Fidelity gate

Capture the implemented screen at the same viewport as its approved evidence after fonts and lazy images settle. Compare structure, hierarchy, container width, typography, spacing, crop, alignment, density, color, and open/disabled/error states. Record differences and approval. A screenshot existing is not proof of fidelity; an empty or wrong-state screen fails.
