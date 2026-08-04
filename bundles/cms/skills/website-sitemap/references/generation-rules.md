# Architecture generation rules

## Minimum useful architecture

Select pages from user goals and content depth. Do not add pages only to make the sitemap look large.

- Local service: Home, Services, About, Reviews or proof, News only with a content goal, Contact.
- Professional practice: add team/expertise and service details when evidence supports them.
- Commerce: Home, category/listing, product detail, cart/purchase flow, policies, contact.
- Portfolio/project business: Home, project listing/detail, services, about, contact.
- Course/education: programs, program detail, instructors, outcomes, FAQ, enrollment/contact.

## Homepage

Specify sections that answer in order:

1. Who the business is and what it offers.
2. Why the visitor should trust it.
3. Main services/products.
4. Proof: reviews, projects, credentials, process.
5. Primary conversion action.

Avoid unsupported statistics, guarantees, awards, years of experience, and medical outcomes.

## Routes and templates

- Use stable locale-appropriate kebab-case routes.
- Define listing/detail pairs only for scalable collections.
- Reuse templates instead of duplicating page structures.
- Define intentional empty states and pagination expectations for collections.
- Keep one shared global shell with header, footer, SEO, and floating actions.

## Content provenance

Classify values as `supplied`, `crawled`, `inferred`, or `placeholder`. Preserve reviews and contact facts verbatim except safe formatting. Keep remote asset URLs as source evidence; do not promise they are reusable or licensed.

## Design direction

Infer a restrained direction from industry and audience. Specify intent, tone, accessibility, layout behavior, imagery rules, and optional palette guidance. Do not over-constrain Stitch with pixel measurements unless explicitly provided.

## CMS handoff

Map each visible section to a content source or editable widget setting. Identify routes, models, zones, forms, filters, CTAs, assets, and capabilities required by implementation. Keep sitemap independent of a particular Blade file while using concepts understood by `theme-cms-business` and `theme-cms-ecommerce`.
