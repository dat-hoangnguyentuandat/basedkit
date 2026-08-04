# Frontend Quality

## Design Fidelity

- Implement the actual app/site screen, not a marketing placeholder.
- Match the provided sitemap/mockup, industry tone, content density, spacing, typography, and image crops.
- Use real local bitmap assets for campaign heroes, products, categories, brands, editorial cards, and trust/CTA surfaces where visual inspection matters.
- Keep cards at 8px radius or less unless the design system explicitly differs. Avoid nested cards and decorative gradients/orbs unrelated to the brand.

## Typography

- Use the requested font consistently across body, controls, and headings; load only required weights.
- Set `text-wrap: balance` on dynamic headings and `text-wrap: pretty` on copy.
- Use semantic line spans plus an editable break setting for critical brand/hero titles.
- Avoid global `word-break: break-all`, `overflow-wrap:anywhere`, random `<br>`, and scattered `&nbsp;`.
- Use discrete mobile font sizes; do not continuously scale all type with viewport width.

## Stable Media

- Set explicit aspect ratio or responsive height constraints for product cards, campaign heroes, product galleries, category tiles, testimonial avatars, and logos.
- Use `object-fit: cover` for photos and `contain` for logos.
- Keep product-gallery/detail images aligned to purchase information; do not let portrait intrinsic dimensions create a full-page column.
- Reserve image dimensions and use `loading="lazy"` below the fold.

## Reviews

- Use the shared pattern in `review-cards.md` on every review surface.
- Show the actual reviewer avatar through the model accessor when it loads. Keep initials rendered underneath remote images and hide only a failed image at runtime; a non-empty Google URL is not a successful avatar.
- Preserve reviewer name, role/source, rating, and content.
- Use a relevant background image plus readable overlay when the design calls for an image-backed testimonial section.
- Keep cards equal-height and aligned across desktop/mobile.
- Clamp very long excerpts in the grid and expose the full unmodified text through an accessible bounded dialog; never let one imported review create a tall row with empty sibling cards.

## Interaction And Accessibility

- Use familiar icons with fixed width/height; use text for commands only where needed.
- Provide hover, active, disabled, loading, and `:focus-visible` states.
- Keep touch targets about 44px, cursor feedback, and transitions around 150–300ms.
- Respect `prefers-reduced-motion`.
- Add useful image alt text and labels for icon-only controls.
- Maintain at least 4.5:1 text contrast and avoid layout-shifting hover effects.

## Responsive Contract

Test at 1440, 1024, 768, 390, 375, and 320px. Confirm:

- No horizontal overflow or incoherent overlap.
- Header/menu remains usable.
- Heading lines remain meaningful.
- Cards/grids collapse predictably.
- Buttons/forms fit without clipped text.
- Footer columns and brand align correctly.
- Pagination wraps and retains stable button dimensions.

## CSS Hygiene

- Define a small token system for colors, text, lines, container, radius, shadow, and spacing.
- Avoid one-note palettes and unrelated copied widget colors.
- Inspect global widgets for inline hardcoded styles; override only inside the current theme when they conflict.
- Keep class names scoped enough to avoid global rules resizing SVGs, images, or widget internals.
