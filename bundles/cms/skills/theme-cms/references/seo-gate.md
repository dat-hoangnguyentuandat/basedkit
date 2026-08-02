# SEO Quality Gate

Run the integrated SEO skill after activation, asset publish, cache clear, seed, and public server startup:

```text
.claude/skills/seo/SKILL.md
```

Audit the rendered public URL, not Blade source alone. Use the relevant integrated modules: core `seo`, `seo-technical`, `seo-page`, `seo-schema`, `seo-sitemap`, and `seo-local` for local businesses; add content/images modules when findings require them.

## Required Coverage

- `/`
- `/gioi-thieu`
- `/san-pham` and one product detail when the theme uses products
- `/dich-vu` and one service detail
- `/tin-tuc` and one news detail
- `/lien-he`
- `/danh-gia`

## Required Checks

- Unique useful title, meta description, one H1, coherent headings, canonical, language, viewport, favicon.
- Open Graph/social metadata where expected.
- Correct absolute URLs under configured `APP_URL`/subfolder.
- Crawlable status codes, redirects, 404 behavior, internal links, robots, sitemap XML, and no accidental noindex.
- Appropriate JSON-LD such as `LegalService`/`LocalBusiness`, with factual NAP, map, hours, rating/review data; never invent claims.
- Consistent business identity between Settings, visible footer/contact, local-business records, and schema.
- Image URL 200, alt text, dimensions, format/weight, and no placeholder assets.
- Detail pages with meaningful metadata/canonical and indexable content.

## Release Rule

1. Fix all Critical/High findings and rerun affected checks.
2. Record Medium/Low findings with impact and follow-up.
3. Do not report completion when the public URL cannot be audited.
4. Include audited URL, modules used, before/after finding counts, schema/sitemap/local results, and remaining risks in handoff.

SEO checks complement functional/visual QA; they do not replace route, admin, pagination, asset, or responsive tests.
