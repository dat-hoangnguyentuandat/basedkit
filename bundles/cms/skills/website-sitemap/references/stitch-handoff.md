# Stitch handoff

Generate `stitch-prompt.md` beside the validated sitemap at `<CMS_PROJECT>/artifacts/sitemaps/<site-slug>/`. Treat the sitemap as source of truth.

## Required prompt sections

1. Project identity: business, audience, locale, goals.
2. Design intent: direction, tone, palette guidance, typography, imagery.
3. Global shell: header, footer, navigation, primary CTA, floating actions.
4. Screens: every entry in `stitch.screens`, grouped by template.
5. Screen sections: order, purpose, content source, interaction, responsive behavior.
6. Components: cards, forms, filters, pagination, dialogs, empty states.
7. Content constraints: use supplied facts; preserve Vietnamese text; show placeholders explicitly.
8. Delivery constraints: desktop and mobile, accessible contrast, reusable design system.

## Guardrails

- Do not introduce pages, products, claims, prices, contact data, or credentials absent from the sitemap.
- Do not turn placeholders into factual marketing copy.
- Keep repeated sections visually consistent across screens.
- Design listing and detail states together.
- Include error, empty, and long-content behavior where declared.
- Produce or export `DESIGN.md`, screen images, and code only as implementation reference.

## Handoff to theme-cms-business or theme-cms-ecommerce

Provide together:

- `sitemap.json`: functionality, routes, content, CMS contract.
- `sitemap.md`: review summary and assumptions.
- `stitch-prompt.md`: generation request.
- `DESIGN.md`: approved visual tokens when available.
- desktop/mobile screen exports.

Resolve conflicts in favor of factual requirements in `sitemap.json`; use approved design artifacts for visual decisions.
