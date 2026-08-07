# SEO Quality Gate

After activation, asset publish, cache clear, seed, and public server startup, run an available SEO audit implementation. Use the integrated skill below when installed; otherwise perform the same coverage with host browser/SEO tooling and record the substitution:

```text
.agents/skills/seo/SKILL.md
```

Audit the rendered public URL, not Blade source alone. Cover technical, page, schema, sitemap, local, content, and image concerns. Absence of one named external skill is not permission to skip SEO.

## Required Coverage

- `/`
- `/san-pham`, one category-filtered listing, and one product detail
- `/gio-hang` and checkout when the Sell plugin is active
- `/tin-tuc` and one news detail
- `/lien-he`
- `/danh-gia`

## Required Checks

- Unique useful title, meta description, one H1, coherent headings, canonical, language, viewport, favicon.
- Open Graph/social metadata where expected.
- Correct absolute URLs under configured `APP_URL`/subfolder.
- Crawlable status codes, redirects, 404 behavior, internal links, robots, sitemap XML, and no accidental noindex.
- Appropriate JSON-LD such as `Product`, `Offer`, `BreadcrumbList`, and `Organization`/`LocalBusiness` when factual, with price, availability, brand, and rating data only when supplied; never invent claims.
- Consistent business identity between Settings, visible footer/contact, local-business records, and schema.
- Image URL 200, alt text, dimensions, format/weight, and no placeholder assets.
- Detail pages with meaningful metadata/canonical and indexable content.

## Release Rule

1. Fix all Critical/High findings and rerun affected checks.
2. Record Medium/Low findings with impact and follow-up.
3. Do not report completion when the public URL cannot be audited.
4. Include audited URL, modules used, before/after finding counts, schema/sitemap/local results, and remaining risks in handoff.

SEO checks complement functional/visual QA; they do not replace route, admin, pagination, asset, or responsive tests.
