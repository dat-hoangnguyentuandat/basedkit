# Deterministic Theme Quality Gates

Run the bundled checker before activation and again before packaging:

```powershell
node .agents/skills/theme-cms-ecommerce/scripts/check-theme-quality.mjs --theme themes/<slug> --json <run-dir>/reports/qa/theme-quality.json
```

## Required rendered checks

- No Blade directive appears in response text; DOM order is `header → main → footer`.
- Exactly one header, footer, cart link, and i18n switcher when their plugins are active.
- Cart is outside primary navigation and next to header utilities.
- Admin logo resolves from storage/theme/remote paths; favicon exists and follows the configured logo.
- Core contact forms contain only `name`, `phone`, `email`, `subject`, and `message` unless a plugin explicitly extends the schema.
- Locale pages set matching `<html lang>`, translate page content beyond navigation, and preserve the Vietnamese base locale.
- Mobile navigation opens compactly, keeps utilities visible, and does not overflow at 390, 375, or 320 px.
- Listing/card media uses the approved aspect ratio consistently; source images suit their rendered crop.
- Page heroes align with their following content shell.
- Seed placeholders do not repeatedly expose a temporary brand in labels, article taxonomy, authors, or SKU prefixes.
- QA screenshots and evidence are generated after the final source change.

## Evidence policy

Use `auto-cms qa` as the authority for static, HTTP, DOM, responsive, links, images, and console checks. Manual reports may add mutable fixtures but cannot override a failed deterministic gate. Rerun QA after any theme source edit.
