# Input modes

Classify before synthesis. Combine modes when multiple sources exist.

## Brief

Examples: `Xây dựng web Nha Khoa Kim Ngân`, a paragraph, chat transcript.

1. Extract explicit facts and desired outcome.
2. Infer conventional pages and content models for the industry.
3. Mark inferred strategy as `assumption`; use placeholders for unavailable facts.
4. Prefer a compact complete site over speculative features.

## Structured

Examples: ERP Description, task JSON, CSV, requirements, brand document.

1. Preserve identifiers and source values.
2. Normalize business, offers, contacts, assets, reviews, and constraints.
3. Keep `null` or unavailable facts explicit; never convert them into marketing claims.
4. Record source type and reference in `source.inputs`.

## Crawl

Examples: an existing business site, competitor, redesign target.

1. Run `scripts/crawl_site.js` into `<CMS_PROJECT>/artifacts/sitemaps/<site-slug>/research/crawl`.
2. Audit templates, navigation, assets, interactions, SEO, duplicates, and crawl gaps.
3. Separate content inventory from recommended future architecture.
4. Preserve useful intent; do not blindly reproduce broken or redundant structure.

## Hybrid

Examples: ERP facts plus reference website and design notes.

Apply source priority:

1. Direct user requirements.
2. Authoritative ERP/structured business facts.
3. Existing site facts for the same business.
4. Reference/competitor sites for patterns only.
5. Industry inference.

Record conflicts in `source.gaps`; never silently choose a factual value.

## Missing inputs

Continue with labeled assumptions when they do not create legal, commercial, or factual risk. Ask only when a missing choice changes site scope materially, such as commerce versus lead generation or single-brand versus marketplace.
