---
name: website-sitemap
description: "Map any website into a clone-ready sitemap with pages, templates, navigation, assets, forms, and crawl gaps for same-origin URLs."
license: MIT
version: 1.0.0
---

# Website Sitemap

Use when the user gives a website URL and wants a detailed sitemap for cloning, reverse engineering, redesign, migration, IA review, or content inventory.

## What this skill produces

Create a folder like `artifacts/sitemaps/<host>/` containing:
- `sitemap.json` - machine-readable crawl output
- `sitemap.md` - human summary for cloning
- optional follow-up notes for JS-only or gated pages

## Workflow

1. Normalize the input URL, keep the original path if the user targets a subsection.
2. Crawl same-origin pages first. Prefer the provided script:
   - `node scripts/crawl_site.js --url <URL> --out <DIR>`
   - Add `--max-pages 300` for larger sites
   - Add `--subtree-only` when user wants only one section
3. Seed discovery from:
   - input page links
   - `/sitemap.xml`
   - `robots.txt` sitemap entries
   - canonical links and nav/footer links found during crawl
4. After crawl, inspect `sitemap.md` and `sitemap.json` for gaps:
   - JS-rendered routes not present in raw HTML
   - auth-gated flows
   - search/filter/facet states
   - API-backed content grids
5. If gaps matter, supplement manually with browser tooling, then append notes instead of pretending the crawl was complete.

## Required analysis

For each crawl, report:
- page groups by template or section
- nav structure and important user flows
- titles, meta descriptions, canonicals, H1s
- internal links, external links, images, scripts, stylesheets, iframes
- forms, buttons, and likely interactive areas
- orphan candidates, redirects, broken pages, duplicate titles, duplicate canonicals
- clone risks: JS app shell, lazy content, gated content, locale variants

## Output standard

`sitemap.md` should include:
- scope and crawl settings
- top-level section tree
- page inventory table or bullets
- reusable template clusters
- asset inventory summary
- forms/interactions summary
- crawl gaps and confidence level

## Notes

- Stay on the same origin unless the user asks for cross-domain mapping.
- Respect clear rate limits or blocking.
- For huge sites, crawl a representative sample first and say what remains.
- If the user wants a pure XML sitemap only, derive it from `sitemap.json` instead of reclawing.

## References

- `references/clone-audit.md` - how to turn crawl output into a clone plan
- `scripts/crawl_site.js` - deterministic crawler
- `scripts/test_crawl_site.js` - smoke tests for parser helpers
