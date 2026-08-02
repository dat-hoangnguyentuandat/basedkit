# Clone audit guide

Use this after generating `sitemap.json` and `sitemap.md`.

## Read the crawl in this order

1. Scope: start URL, final origin, pages crawled, skipped URLs.
2. Sections: confirm the site tree matches the user's target.
3. Templates: look for repeated layouts such as home, listing, detail, docs, blog, pricing, auth.
4. Assets: check shared CSS, JS bundles, logos, icons, images, videos, fonts.
5. Interactions: forms, search, filters, tabs, accordions, modals, pagination.
6. Gaps: blocked pages, JS-only routes, infinite scroll, APIs, login walls.

## What matters for cloning

- Navigation hierarchy
- Reusable page templates
- Shared header/footer variants
- Card/list/detail patterns
- CTA locations and form fields
- Asset hotspots: hero media, logos, icon sets, downloadable files
- SEO signals: title, description, canonical, heading structure

## Follow-up prompts this skill should support

- "Generate sitemap for <url>"
- "Map only the blog/docs/shop section"
- "Find all forms and CTA flows"
- "Group pages by template for cloning"
- "Export XML sitemap from the crawl"

## Confidence rubric

- High: sitemap.xml exists, crawl covers target pages, little JS gating.
- Medium: crawl good but some pages rely on JS or lazy APIs.
- Low: auth wall, bot blocking, or SPA shell hides routes.

## If the crawl is incomplete

Say exactly what is missing and why:
- blocked by auth
- blocked by rate limit / anti-bot
- routes only appear after JS events
- content loaded from API after interaction
