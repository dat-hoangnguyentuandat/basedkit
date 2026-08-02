---
name: srctree
description: Generate or compare a source-tree baseline. For each code file in a given folder, create a matching .md file under .claude/Srctree/ containing header metadata (hash/lines/size) + a symbols list (functions/APIs) + the verbatim source, so you can later detect exactly which file/function/API was lost or modified — WITHOUT git. Invoke when the user says "srctree", "generate baseline .md", "scan src into Srctree", or "compare Srctree against current code". The user will name the exact folder to process.
---

# Srctree

Each code file → **one `.md` file** under `.claude/Srctree/`, mirroring the directory structure.
The `.md` is the **baseline (original snapshot)** of the code file. Compare `.md` ↔ current code to know **what was lost and where** — no git required.

Path mapping (root = the folder the user names):
`<root>/services/auth.js` → `<root>/.claude/Srctree/services/auth.js.md`

## First step — ask if missing
- The user MUST name the **root folder**. If unclear → ask one question.
- Ask for the mode if unclear: **(a) generate** the baseline `.md`, or **(b) compare** current code against an existing baseline.

## Excluded directories (always skip)
`node_modules .git .svn .hg bin obj dist build out target coverage vendor __pycache__ .next .nuxt .cache publish .claude`
Skip binary files (images/exe/dll/zip/fonts…) — process text files only.

---

## Mode A — Generate baseline

Scan the whole root folder (minus the exclusion list). For each source file, produce exactly one `.md` following the **3 tiers** below. Follow the format strictly.

### Tier 1 — Header metadata (fast diff, no need to read content)
| Field | Meaning |
|-------|---------|
| Path | relative path from root |
| Lines | total line count |
| Size | size (KB) |
| SHA-256 | hash of the full content (first 8 chars) |
| Exported | timestamp the `.md` was generated |

### Tier 2 — Symbols list (pinpoints lost func/API)
List every symbol + its line number. Detection dispatches on file extension — each language has its own regex set in `scripts/srctree_gen.sh`:

| Language | ext | Detects |
|----------|-----|---------|
| PHP | php | class/interface/trait/enum, function, const |
| JS/TS | js cjs mjs ts jsx tsx vue svelte | function, class, interface, type, exported const/arrow, module.exports |
| Python | py | def / async def, class |
| Go | go | func (+receiver), type struct/interface, var, const |
| Rust | rs | fn/pub fn, struct/enum/trait/impl/mod/type/const |
| Ruby | rb | def, class, module |
| Java/Kotlin/Scala | java kt kts scala | class/interface/enum/object, methods, @*Mapping |
| C/C++ | c h cpp cc hpp | function defs, struct/class/enum/namespace/typedef |
| C# | cs | class/interface/struct/record, methods, [Http*] |
| Swift | swift | func/class/struct/enum/protocol/extension |
| Shell | sh bash | `name()`, `function name` |

Each line: `- L<line> | <verbatim symbol line>`. Unknown extensions → Tier 2 empty (T1+T3 still apply).

### Tier 2b — Config-array fingerprint (CRITICAL — catches the most common vibe-code loss)
Functions/methods are easy to spot when missing. The dangerous loss is a **single element silently dropped from a config array, route table, or validation block** — the function still exists, so a func-only symbol list stays blind. Capture these as a **named list with an item count**, so a `7 → 6 items` delta is an instant red flag.

Detection dispatches on ecosystem (see `scripts/srctree_gen.sh`):

| Ecosystem | ext | Captures |
|-----------|-----|----------|
| Laravel / PHP | php | model arrays `$fillable`/`$casts`/`$guarded`/`$appends`/`$hidden`/`$dates`/`$with` (prop + count + keys); `Route::*`; validation `'field' => 'rules'`; migration `$table->col()`; `config/*.php` top-level keys |
| Django / Flask | py | `path()`/`re_path()`/`url()`/`@app.route`; settings UPPERCASE list/dict assignments; model `field = models.XxxField(` |
| Express / Nest / Fastify | js cjs mjs ts jsx tsx | `app/router.<verb>()`, `@Get/@Post/...` decorators |
| Go web | go | `.GET/.POST/.Handle/.Group()` (gin/echo/mux/chi) |
| Spring | java kt kts | `@Get/Post/Put/Delete/Patch/RequestMapping` |
| SQL | sql | `CREATE TABLE/INDEX/VIEW`, `ALTER TABLE` |
| dotenv | env files | `KEY=` names |

Each recorded as a named entry with an **item count** where it's an array (`$fillable (7 items): ...`), so a `7 → 6` delta is an instant red flag.

Format:
```
## Config (Tier 2b)
- $fillable (7 items): name, slug, description, image, sort_order, is_active, parent_id   L30
- $casts (1 item): is_active   L32
- validate login (2 fields): username:required, password:required   L41
```
When in doubt whether something is "config", err toward recording it. A missing array element is exactly the failure mode this tier exists to catch.

### Tier 3 — Verbatim source
The full original file content in a code block (fence by language), for line-by-line diffing when needed.

### `.md` template
```markdown
# src/services/auth.js

| Field    | Value                |
|----------|----------------------|
| Path     | src/services/auth.js |
| Lines    | 142                  |
| Size     | 4.2 KB               |
| SHA-256  | a1b2c3d4             |
| Exported | 2026-06-14 20:31     |

## Symbols (6)
- fn    login(user, pass)      L12
- fn    refreshToken(token)    L48
- class AuthService            L70
- api   POST /api/auth/login   L102

## Config (Tier 2b)
- $fillable (7 items): name, slug, description, image, sort_order, is_active, parent_id   L30
- validate login (2 fields): username:required, password:required   L41

## Source
\`\`\`js
<full original file content>
\`\`\`
```

(Omit the `## Config` section only when the file genuinely has no config array, route, validation, or migration content.)

### Project manifest (`_manifest.md` at Srctree root)
After generating all files, write `.claude/Srctree/_manifest.md` with project-wide totals so a wholesale loss is obvious at a glance:
```markdown
# Srctree manifest
| Generated | 2026-06-14 21:24 |
| Files     | 10080 |
| Symbols   | 4231 |
| Routes    | 188 |
| Config arrays | 96 |
```
On compare, a drop in any of these totals (e.g. `Files 10080 → 10073`) is the first-line alarm before per-file detail.

When done → report: total files, number of `.md` created, output directory.

---

## Mode B — Compare (detect lost code)

For each `.md` under `.claude/Srctree/`, find the matching code file and compare across the 3 tiers:

1. **Tier 1 (hash)** — recompute SHA-256/Lines/Size of current code, compare against the `.md` header:
   - match → unchanged, skip
   - differ → modified, go to tier 2
   - code missing → **DELETED**
2. **Tier 2 (symbols)** — symbols in `.md` minus symbols parsed from current code:
   - in `.md`, gone from code → **func/API REMOVED** (report name + old line)
   - in code, not in `.md` → newly added func
   - shifted line / changed signature → modified
3. **Tier 2b (config arrays)** — compare item counts and key lists. This is the highest-signal check for vibe-code loss:
   - `$fillable 7 → 6 items` → **report exactly which key vanished** (e.g. `lost: parent_id`)
   - missing route entry → **ROUTE REMOVED** (method + URI)
   - missing validation field → **RULE REMOVED**
4. **Tier 3 (source)** — diff the `.md` source block against current code → `+/-` per line (only when detail is needed).
5. Code file present but no `.md` → **ADDED**.

Start by diffing `_manifest.md` totals against a fresh recount — if `Files`/`Symbols`/`Routes`/`Config arrays` dropped, that is the headline before listing per-file detail.

### Sample report
```
MANIFEST  Files 10080→10079  Symbols 4231→4225  Config 96→95

MODIFIED  app/Models/Category.php   49→45 lines
  - $fillable 7→6 items   lost: parent_id        (config loss — silent!)
MODIFIED  src/services/auth.js   142→90 lines, -2 symbols
  - fn  refreshToken()        (was L48)
  - api POST /api/auth/login  (was L102)
DELETED   src/utils/old.js
ADDED     src/utils/new.js
```

Finally: summarize MANIFEST deltas + MODIFIED/DELETED/ADDED counts, and list the lost func/API/config-key explicitly. Flag config-array losses first — they are the easiest to miss and the most damaging.
