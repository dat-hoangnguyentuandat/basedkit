# I/O Sitemap file specs

Use these structures when generating the three files.

## 1) input.md

Purpose: capture everything needed to build the website completely from the sitemap.

Recommended sections:
- Project overview
  - project/site name
  - website goal
  - target users
  - primary conversion goals
- Brand inputs
  - logo files
  - color palette
  - typography
  - visual direction / reference sites
  - icon style / illustration style
- Contact and business info
  - phone
  - email
  - address
  - social links
  - working hours
  - map/embed data
- Sitemap-to-content matrix
  - for each page/template: required heading, body copy, CTA, media, SEO fields, legal copy, structured data needs
- Product/service inputs
  - product list
  - pricing
  - categories
  - specs
  - promotions
  - availability/status
- Functional inputs
  - button actions
  - form fields
  - validation rules
  - submission destination
  - auth/account needs if any
  - search/filter/sort rules if any
- Media/assets inputs
  - hero banners
  - gallery images
  - product images
  - videos
  - downloadable files
- SEO/marketing inputs
  - page titles
  - meta descriptions
  - keywords/topics
  - Open Graph content
  - analytics/pixels/chat widgets
- Technical/environment inputs
  - domain
  - hosting target
  - CMS/admin needs
  - API/integration credentials
  - localization/language needs
- Missing items / assumptions
  - explicitly list unknowns blocking implementation

## 2) output.md

Purpose: define the finished state and acceptance quality of the website.

Recommended sections:
- Delivery summary
- Scope delivered from sitemap
  - all pages/templates built
  - all nav/footer links connected
- UI/UX expectations
  - polished desktop layout
  - polished tablet/mobile layout
  - visual consistency with brand
  - readable typography and hierarchy
- Functional expectations
  - all buttons perform intended action
  - all forms submit correctly
  - no dead links
  - navigation works across all pages
  - dynamic lists/search/filter work as specified
- Content expectations
  - complete content populated
  - images optimized and displayed correctly
  - SEO fields present where required
- Quality expectations
  - responsive on major breakpoints
  - acceptable load behavior
  - empty/error states handled
  - accessibility basics covered
- Deployment/use expectations
  - site can be accessed in real conditions
  - user can complete key journeys successfully
  - admin/content editing expectations if applicable
- Acceptance checklist
  - concise pass/fail bullets

## 3) handle.md

Purpose: describe how to transform sitemap + inputs into the final working website.

Recommended sections:
- Input intake and audit
  - read sitemap
  - group page templates
  - map missing inputs
- Content modeling
  - define reusable sections/components
  - define shared data objects for products/services/posts/testimonials/etc.
- Information architecture to page plan
  - map each sitemap node to a page/template/component
- Design system application
  - apply logo, color, type, spacing, buttons, cards, forms, nav, footer
- Content population workflow
  - assign provided content to each section
  - create placeholder policy for missing content
- Functional implementation
  - wire buttons
  - wire forms
  - connect integrations
  - handle redirects / 404 / search states
- Responsive implementation
  - adapt layout for desktop/tablet/mobile
- QA workflow
  - check links
  - check forms
  - check responsive behavior
  - check media rendering
  - check SEO/meta fields
- Launch readiness
  - pre-launch checklist
  - handoff/deployment notes
- Risks / dependencies
  - missing data, integrations, gated content, unclear flows

Writing rule: this file should read like an actionable production SOP, not a generic summary.
