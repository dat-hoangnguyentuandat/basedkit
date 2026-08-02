---
name: io-sitemap
description: "Turn a website-sitemap result into clear input, output, and implementation-handling docs for full website delivery."
---

# I/O Sitemap

Use when the user already has a sitemap from `website-sitemap` and wants a delivery spec that defines:
- what inputs must be collected
- what final website outcome is required
- how the team/agent should transform the inputs into the output

## What this skill produces

Create a folder like `artifacts/io-sitemap/<project-or-host>/` containing:
- `input.md` - all required business, brand, content, asset, and functional inputs
- `output.md` - the expected finished website quality bar and acceptance outcome
- `handle.md` - the step-by-step transformation process from sitemap + inputs to production-ready pages

## Workflow

1. Read the sitemap produced by `website-sitemap`, especially page list, template groups, navigation, forms, CTA areas, assets, and crawl-gap notes.
2. Infer what information is missing to build each page/template completely.
3. Write `input.md` using `references/file-specs.md` and `assets/input.md` as the structure baseline.
4. Write `output.md` as a concrete acceptance spec for desktop + mobile delivery, using `assets/output.md`.
5. Write `handle.md` as the implementation playbook from raw inputs to shipped site, using `assets/handle.md`.
6. If the sitemap has gaps, explicitly mark assumptions and ask for the missing input instead of inventing facts.

## Rules

- Keep the docs implementation-oriented, not vague consulting prose.
- Tie every required input back to specific pages, templates, forms, products, or flows in the sitemap.
- Cover both content completeness and functional correctness.
- Include desktop and mobile expectations in `output.md`.
- Include QA, broken-link checks, responsive checks, and content-mapping steps in `handle.md`.
- If a site section needs repeated structured content, define the content model clearly.

## Notes

- Prefer concise bullets and checklists.
- If the user gives extra business context beyond the sitemap, merge it into the three files.
- If the user wants code later, these files become the contract for design/build/QA.

## References

- `references/file-specs.md` - required structure for all three files
- `assets/input.md` - starter template
- `assets/output.md` - starter template
- `assets/handle.md` - starter template
