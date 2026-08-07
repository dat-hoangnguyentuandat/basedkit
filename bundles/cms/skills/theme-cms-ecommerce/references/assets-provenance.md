# Asset Provenance Contract

Every non-generated visible asset must be local and listed in `assets/ASSET-SOURCES.json`. Use either a top-level array or `{ "version": 1, "assets": [] }`; prefer the versioned object.

## Required record

Each record contains `file` (legacy `path` is accepted), `sourceUrl`, `sourceType`, `rights`, `rightsEvidence`, `accessedAt`, `sha256`, `transformations`, `factualStatus`, and optional `notes`.

Allowed `rights` values:

- `customer-provided`
- `owned`
- `licensed`
- `public-domain`
- `generated`
- `placeholder-not-for-release`

“Crawled by request”, “found online”, or a source URL alone is not a license. Reject a production package containing `placeholder-not-for-release` or missing/ambiguous rights. For generated assets, record tool/model and prompt/derivation reference. For customer-provided assets, record the supplied artifact identifier without storing credentials.

## Validation

- Every listed file exists and its SHA-256 matches.
- Every visible bitmap in seed/views/widgets/CSS is listed.
- Every listed production file is used.
- Remote runtime images are allowed only when the runtime data contract requires them and a resilient fallback exists.
- Package the provenance manifest with the source theme.
