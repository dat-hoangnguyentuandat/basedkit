# Sitemap contract v2

Produce UTF-8 JSON with these top-level keys.

Save the canonical file at `<CMS_PROJECT>/artifacts/sitemaps/<site-slug>/sitemap.json`. Keep `sitemap.md`, `stitch-prompt.md`, and optional `research/` beside it. Derive `<site-slug>` from `site.slug` and keep both values identical.

## Required fields

```json
{
  "schemaVersion": "2.0",
  "generatedAt": "ISO-8601",
  "source": {
    "mode": "brief|structured|crawl|hybrid",
    "inputs": [{ "type": "brief", "reference": "inline", "authoritative": true }],
    "confidence": "high|medium|low",
    "assumptions": [],
    "gaps": []
  },
  "site": {
    "name": "Business name",
    "slug": "business-name",
    "locale": "vi-VN",
    "businessType": "service-business",
    "goals": [],
    "audiences": []
  },
  "design": {
    "direction": "",
    "tone": [],
    "palette": {},
    "typography": {},
    "imagery": []
  },
  "navigation": { "header": [], "footer": [] },
  "templates": [],
  "pages": [],
  "content": {},
  "cms": { "capabilities": [], "models": [], "zones": [] },
  "stitch": { "screens": [], "promptFile": "stitch-prompt.md" }
}
```

## Navigation item

Use `{ "label": "Dịch vụ", "route": "/dich-vu", "type": "internal" }`. External items use `url` and `type: external`. Every internal route must exist in `pages`.

## Template

Use `{ "id": "service-listing", "type": "listing", "purpose": "...", "regions": [] }`. IDs must be unique. Common types: `home`, `listing`, `detail`, `content`, `contact`, `search`, `legal`.

## Page

Required page fields:

```json
{
  "id": "services",
  "name": "Dịch vụ",
  "route": "/dich-vu",
  "template": "service-listing",
  "purpose": "Help visitors compare services",
  "seo": { "title": "", "description": "", "primaryKeyword": "" },
  "sections": [],
  "dataSources": ["services"]
}
```

Each section requires `id`, `type`, `purpose`, `contentSource`, and `responsive`. Add `cta`, `fields`, `items`, or `notes` only when relevant. Use placeholders such as `content.services` instead of invented facts.

## Content and CMS

Store supplied facts under `content`. Add top-level `content._provenance` with a source class (`supplied`, `crawled`, `inferred`, or `placeholder`) for each content collection; add field-level provenance when one collection mixes sources. Declare collections required by pages under `cms.models`. Declare homepage/footer/float block zones under `cms.zones`. Declare `products` and `commerce.purchase_action` when selling or ordering appears.
