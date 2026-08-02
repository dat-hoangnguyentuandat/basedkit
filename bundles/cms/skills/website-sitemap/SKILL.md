---
name: website-sitemap
description: "This skill should be used to create, crawl, map, redesign, or migrate website sitemaps and information architecture from briefs, ERP data, URLs, documents, or mixed inputs."
license: MIT
---

# Website Sitemap Architect

Transform sparse or detailed inputs into a complete, implementation-ready website architecture. Accept natural-language briefs, ERP/task content, structured files, documents, existing website URLs, or any combination. Produce one stable sitemap contract for design agents, Google Stitch, and CMS theme builders.

## Load References By Input

1. Read [input-modes.md](references/input-modes.md) for every task.
2. Read [sitemap-contract.md](references/sitemap-contract.md) before creating `sitemap.json`.
3. Read [generation-rules.md](references/generation-rules.md) for brief, ERP, document, and hybrid inputs.
4. Read [clone-audit.md](references/clone-audit.md) and run the crawler only when an existing URL is an input.
5. Read [stitch-handoff.md](references/stitch-handoff.md) before producing design handoff files.

## Required Workflow

1. Classify inputs as `brief`, `structured`, `crawl`, or `hybrid`; preserve source facts and mark assumptions.
2. Extract business identity, audience, goals, offers, trust signals, contact data, content, assets, constraints, and reference URLs.
3. Resolve the CMS project root from the current workspace; write only under `artifacts/sitemaps/<site-slug>/` in that project.
4. For URL inputs, crawl into the sitemap project's research subdirectory. Treat crawl output as evidence, never as the final architecture.
5. Infer the smallest complete information architecture suitable for the business and goals. Do not ask for details that can be safely inferred and labeled.
6. Define navigation, routes, reusable templates, page sections, CTAs, forms, content collections, CMS capabilities, SEO intent, and responsive design direction.
7. Preserve supplied facts exactly. Never invent factual prices, credentials, addresses, ratings, guarantees, legal claims, or contact details.
8. Create the required outputs and validate `sitemap.json` with `scripts/validate_sitemap.js`.
9. Resolve validation failures before handoff. Report assumptions, missing facts, crawl gaps, and confidence.

## URL Crawl

Run deterministic discovery when a public URL is provided:

```bash
node <SKILL_DIR>/scripts/crawl_site.js --url <URL> --out <CMS_PROJECT>/artifacts/sitemaps/<site-slug>/research/crawl
```

Use `--max-pages 300` for large sites and `--subtree-only` for a targeted section. Supplement JS-only, authenticated, or API-backed gaps with browser tools. Do not claim complete coverage when blocked.

## Required Outputs

Create one folder per website inside the current CMS project. The required root is `<CMS_PROJECT>/artifacts/sitemaps`; never write final sitemap artifacts inside the skill directory, a user home directory, or an unrelated workspace.

```text
<CMS_PROJECT>/artifacts/sitemaps/<site-slug>/
├── sitemap.json
├── sitemap.md
├── stitch-prompt.md
└── research/              # only when source evidence exists
```

- `sitemap.json`: canonical machine-readable architecture defined in `sitemap-contract.md`.
- `sitemap.md`: concise human review of pages, templates, navigation, content, assumptions, and risks.
- `stitch-prompt.md`: design-generation brief grounded in the sitemap; no new pages or facts.
- `research/`: raw crawl, ERP export, source notes, or normalized evidence when useful.

For this CMS workspace, an example output is `E:\Project\cms\artifacts\sitemaps\nha-khoa-kim-ngan\sitemap.json`. Create missing directories as needed. Reuse the same slug folder for revisions instead of creating version-suffixed duplicates unless explicitly requested.

## Quality Gates

- Every header/footer destination resolves to a declared route or supplied external URL.
- Every page references a declared template and contains purposeful sections.
- Homepage communicates identity, offer, trust, and one primary action.
- Detail/listing routes exist only when the content model needs them.
- Forms define purpose and fields; commerce is declared when products, prices, ordering, or buying appear.
- Mobile navigation, responsive section behavior, empty states, and scalable listing behavior are specified.
- Source facts, inferred content, placeholders, and unavailable facts remain distinguishable.
- Output gives `theme-cms` enough information to map routes, widgets, models, zones, seed content, and capabilities.

## Validation

```bash
node <SKILL_DIR>/scripts/validate_sitemap.js <CMS_PROJECT>/artifacts/sitemaps/<site-slug>/sitemap.json --project-root <CMS_PROJECT>
node scripts/test_validate_sitemap.js
node scripts/test_crawl_site.js
```

Do not hand off an invalid sitemap or hide unresolved Critical/High gaps.
