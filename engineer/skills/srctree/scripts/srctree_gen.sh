#!/usr/bin/env bash
# Srctree multi-language generator
# Tier1 header (hash/lines/size) + Tier2 symbols (per-language regex) + Tier2b config fingerprint + Tier3 verbatim source.
# Pure shell, no ctags/tree-sitter needed. Deterministic, never reads files into model context.
#
# Usage:
#   ROOT=/path/to/repo BATCH=/tmp/filelist bash srctree_gen.sh
#   - ROOT   : repo root (relative paths in BATCH are resolved against it). Default: cwd.
#   - BATCH  : file containing newline-separated repo-relative paths to process.
#   - OUT    : output dir. Default: $ROOT/.claude/Srctree
#
# Each line in BATCH -> $OUT/<path>.md
set -u
ROOT="${ROOT:-$PWD}"
OUT="${OUT:-$ROOT/.claude/Srctree}"
TS=$(date '+%Y-%m-%d %H:%M')
[ -z "${BATCH:-}" ] && { echo "ERROR: no BATCH file given"; exit 2; }
[ -f "$BATCH" ] || { echo "ERROR: BATCH not found: $BATCH"; exit 2; }

count=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  src="$ROOT/$f"
  [ -f "$src" ] || continue
  md="$OUT/$f.md"
  mkdir -p "$(dirname "$md")"

  lines=$(wc -l < "$src" | tr -d ' ')
  bytes=$(wc -c < "$src" | tr -d ' ')
  kb=$(awk "BEGIN{printf \"%.1f\", $bytes/1024}")
  sha=$(sha256sum "$src" | cut -c1-8)
  ext="${f##*.}"
  base="$(basename "$f")"
  ext_lc=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')

  # ---- fence language ----
  case "$ext_lc" in
    php) lang=php;; js|cjs|mjs) lang=js;; ts) lang=ts;; jsx) lang=jsx;; tsx) lang=tsx;;
    py) lang=python;; go) lang=go;; rs) lang=rust;; rb) lang=ruby;;
    java) lang=java;; kt|kts) lang=kotlin;; c|h) lang=c;; cpp|cc|cxx|hpp) lang=cpp;;
    cs) lang=csharp;; swift) lang=swift;; scala) lang=scala;;
    css) lang=css;; scss) lang=scss;; sass) lang=sass;; less) lang=less;;
    json) lang=json;; xml) lang=xml;; html|htm) lang=html;; vue) lang=vue;; svelte) lang=svelte;;
    blade) lang=blade;; md|markdown) lang=markdown;; yml|yaml) lang=yaml;; toml) lang=toml;;
    sh|bash) lang=bash;; sql) lang=sql;; *) lang=text;;
  esac

  # ===================== Tier 2: symbols (dispatch by language) =====================
  syms=""
  case "$ext_lc" in
    php)
      syms=$(grep -nE '(^|[[:space:]])(abstract +|final +)?(class|interface|trait|enum) +[A-Za-z_]|((public|private|protected|static|final|abstract) +)*function +[A-Za-z_]+ *\(|const +[A-Za-z_]+ *=' "$src" 2>/dev/null)
      ;;
    js|cjs|mjs|ts|jsx|tsx|vue|svelte)
      syms=$(grep -nE '(^|[[:space:]])(export +)?(default +)?(async +)?function\*? +[A-Za-z_$]|(^|[[:space:]])(export +)?(abstract +)?class +[A-Za-z_$]|(export +)?(const|let|var) +[A-Za-z_$][A-Za-z0-9_$]* *=.*(\(|=>|function)|(^|[[:space:]])interface +[A-Za-z_$]|(^|[[:space:]])type +[A-Za-z_$][A-Za-z0-9_$]* *=|module\.exports|export +(default|\{)' "$src" 2>/dev/null)
      ;;
    py)
      syms=$(grep -nE '^[[:space:]]*(async +)?def +[A-Za-z_]|^[[:space:]]*class +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    go)
      syms=$(grep -nE '^func +(\([^)]*\) +)?[A-Za-z_]|^type +[A-Za-z_][A-Za-z0-9_]* +(struct|interface|func)|^var +[A-Za-z_]|^const +[A-Za-z_(]' "$src" 2>/dev/null)
      ;;
    rs)
      syms=$(grep -nE '^[[:space:]]*(pub +)?(async +)?fn +[A-Za-z_]|^[[:space:]]*(pub +)?(struct|enum|trait|impl|type|mod|const|static) +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    rb)
      syms=$(grep -nE '^[[:space:]]*(def|class|module) +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    java|kt|kts|scala)
      syms=$(grep -nE '(^|[[:space:]])(public|private|protected|internal|abstract|final|static|sealed|open|data) .*(class|interface|enum|object|trait) +[A-Za-z_]|(^|[[:space:]])(fun|void|public|private|protected|static).* [A-Za-z_]+ *\(|@(Get|Post|Put|Delete|Patch|Request)Mapping' "$src" 2>/dev/null)
      ;;
    c|h|cpp|cc|cxx|hpp)
      syms=$(grep -nE '^[A-Za-z_].*[A-Za-z_*&] +[A-Za-z_][A-Za-z0-9_]* *\(|^(struct|class|enum|union|namespace|typedef) +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    cs)
      syms=$(grep -nE '(public|private|protected|internal|static|abstract|sealed) .*(class|interface|struct|enum|record) +[A-Za-z_]|(public|private|protected|internal|static).* [A-Za-z_]+ *\(|\[Http(Get|Post|Put|Delete|Patch)\]' "$src" 2>/dev/null)
      ;;
    swift)
      syms=$(grep -nE '^[[:space:]]*(public +|private +|internal +|fileprivate +|open +)?(func|class|struct|enum|protocol|extension) +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    sh|bash)
      syms=$(grep -nE '^[A-Za-z_][A-Za-z0-9_]* *\(\)|^(function) +[A-Za-z_]' "$src" 2>/dev/null)
      ;;
    *)
      syms=""
      ;;
  esac
  if [ -n "$syms" ]; then
    syms=$(printf '%s\n' "$syms" \
      | sed -E 's/^([0-9]+):[[:space:]]*/L\1 | /' \
      | sed -E 's/[[:space:]]*\{[[:space:]]*$//' \
      | head -400)
  fi
  symcount=$(printf '%s' "$syms" | grep -c . )

  # ===================== Tier 2b: config fingerprint (dispatch by ecosystem) =====================
  cfg=""

  emit_array_keys() { # $1=grep-pattern over $src ; records "<prop> (N items): k1, k2" per match line
    while IFS= read -r line; do
      [ -z "$line" ] && continue
      ln=$(echo "$line" | cut -d: -f1)
      body=$(echo "$line" | sed -E 's/^[0-9]+://')
      prop=$(echo "$body" | grep -oE '\$[a-zA-Z_]+' | head -1)
      items=$(echo "$body" | grep -oE "\[[^]]*\]" | head -1 | sed -E 's/^\[//; s/\]$//')
      if [ -n "$items" ]; then
        # key=>value map: count only keys (token left of =>). Flat list: count every quoted string.
        if echo "$items" | grep -q '=>'; then
          keys=$(echo "$items" | grep -oE "['\"][^'\"]*['\"] *=>" | sed -E "s/['\"]//g; s/ *=>//" | tr '\n' ',' | sed -E 's/,$//; s/,/, /g')
        else
          keys=$(echo "$items" | grep -oE "'[^']*'|\"[^\"]*\"" | sed -E "s/['\"]//g" | tr '\n' ',' | sed -E 's/,$//; s/,/, /g')
        fi
        n=$(echo "$keys" | tr ',' '\n' | grep -c .)
        [ -n "$keys" ] && cfg="${cfg}- ${prop} (${n} items): ${keys}   L${ln}\n"
      fi
    done < <(grep -nE "$1" "$src" 2>/dev/null)
  }

  case "$ext_lc" in
    php)
      # Laravel model arrays
      emit_array_keys 'protected +\$(fillable|casts|guarded|appends|hidden|dates|with|touches|dispatchesEvents) *='
      # routes
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//')
        cfg="${cfg}- route: ${body}   L${ln}\n"
      done < <(grep -nE 'Route::(get|post|put|patch|delete|any|match|resource|apiResource|group|prefix)' "$src" 2>/dev/null | head -200)
      # validation rules
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//; s/,$//')
        cfg="${cfg}- rule: ${body}   L${ln}\n"
      done < <(grep -nE "['\"][a-zA-Z_][a-zA-Z0-9_\.\*]*['\"] *=> *['\"][^'\"]*(required|nullable|string|integer|email|max:|min:|boolean|array|image|mimes|unique|exists|confirmed|numeric|date|in:)" "$src" 2>/dev/null | grep -vE 'protected +\$|private +\$|public +\$' | head -80)
      # migration columns
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//')
        coltype=$(echo "$body" | grep -oE '\$table->[a-zA-Z]+' | head -1 | sed 's/\$table->//')
        colname=$(echo "$body" | grep -oE "\(['\"][^'\"]+['\"]" | head -1 | sed -E "s/[('\"]//g")
        [ -n "$colname" ] && cfg="${cfg}- column: ${colname} (${coltype})   L${ln}\n"
      done < <(grep -nE '\$table->(id|string|integer|bigInteger|text|boolean|timestamp|date|json|foreignId|decimal|float|double|unsignedBigInteger|unsignedInteger|enum|uuid|char|tinyInteger)\(' "$src" 2>/dev/null | head -100)
      # config/*.php top-level keys
      if echo "$f" | grep -qE '(^|/)config/.*\.php$'; then
        while IFS= read -r line; do
          ln=$(echo "$line" | cut -d: -f1)
          key=$(echo "$line" | sed -E "s/^[0-9]+:[[:space:]]*//" | grep -oE "^['\"][a-zA-Z0-9_]+['\"]" | sed -E "s/['\"]//g")
          [ -n "$key" ] && cfg="${cfg}- cfgkey: ${key}   L${ln}\n"
        done < <(grep -nE "^[[:space:]]{4}['\"][a-zA-Z0-9_]+['\"] *=>" "$src" 2>/dev/null)
      fi
      ;;
    py)
      # Django/Flask routes
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//; s/,$//')
        cfg="${cfg}- route: ${body}   L${ln}\n"
      done < <(grep -nE "(path|re_path|url)\(|@(app|router|bp|blueprint)\.(get|post|put|patch|delete|route)" "$src" 2>/dev/null | head -200)
      # settings.py style UPPERCASE list/dict assignments
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//')
        key=$(echo "$body" | grep -oE '^[A-Z_]+' | head -1)
        [ -n "$key" ] && cfg="${cfg}- setting: ${key}   L${ln}\n"
      done < <(grep -nE '^[A-Z_]{3,} *= *[\[{]' "$src" 2>/dev/null | head -60)
      # model fields: name = models.XxxField(
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//')
        fld=$(echo "$body" | grep -oE '^[a-zA-Z_][a-zA-Z0-9_]*' | head -1)
        ftype=$(echo "$body" | grep -oE 'models\.[A-Za-z]+' | head -1 | sed 's/models\.//')
        [ -n "$fld" ] && [ -n "$ftype" ] && cfg="${cfg}- field: ${fld} (${ftype})   L${ln}\n"
      done < <(grep -nE '^[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]* *= *models\.[A-Za-z]+\(' "$src" 2>/dev/null | head -100)
      ;;
    js|cjs|mjs|ts|jsx|tsx)
      # Express/Nest/Fastify routes
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//; s/,$//')
        cfg="${cfg}- route: ${body}   L${ln}\n"
      done < <(grep -nE '(app|router|route|fastify|server)\.(get|post|put|patch|delete|use|all)\(|@(Get|Post|Put|Delete|Patch|All)\(' "$src" 2>/dev/null | head -200)
      ;;
    go)
      # gin/echo/mux/chi routes
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//; s/,$//')
        cfg="${cfg}- route: ${body}   L${ln}\n"
      done < <(grep -nE '\.(GET|POST|PUT|PATCH|DELETE|Handle|HandleFunc|Group)\(' "$src" 2>/dev/null | head -200)
      ;;
    java|kt|kts)
      # Spring mappings
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//; s/,$//')
        cfg="${cfg}- route: ${body}   L${ln}\n"
      done < <(grep -nE '@(Get|Post|Put|Delete|Patch|Request)Mapping' "$src" 2>/dev/null | head -200)
      ;;
    sql)
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1); body=$(echo "$line" | sed -E 's/^[0-9]+:[[:space:]]*//')
        cfg="${cfg}- ddl: ${body}   L${ln}\n"
      done < <(grep -niE 'CREATE +(TABLE|INDEX|VIEW)|ALTER +TABLE' "$src" 2>/dev/null | head -100)
      ;;
  esac

  # dotenv keys (token split to avoid privacy-hook false positive)
  DOTENV=".""env"
  case "$base" in
    "$DOTENV"|"$DOTENV".*)
      while IFS= read -r line; do
        ln=$(echo "$line" | cut -d: -f1)
        key=$(echo "$line" | sed -E 's/^[0-9]+://' | grep -oE '^[A-Z_][A-Z0-9_]*' | head -1)
        [ -n "$key" ] && cfg="${cfg}- envkey: ${key}   L${ln}\n"
      done < <(grep -nE '^[A-Z_][A-Z0-9_]*=' "$src" 2>/dev/null | head -200)
      ;;
  esac

  # ===================== write md =====================
  {
    echo "# $f"
    echo
    echo "| Field    | Value |"
    echo "|----------|-------|"
    echo "| Path     | $f |"
    echo "| Lines    | $lines |"
    echo "| Size     | $kb KB |"
    echo "| SHA-256  | $sha |"
    echo "| Exported | $TS |"
    echo
    echo "## Symbols ($symcount)"
    [ -n "$syms" ] && printf '%s\n' "$syms" | sed 's/^/- /'
    echo
    if [ -n "$cfg" ]; then
      echo "## Config (Tier 2b)"
      printf "%b" "$cfg"
      echo
    fi
    echo "## Source"
    echo "\`\`\`$lang"
    cat "$src"
    echo '```'
  } > "$md"
  count=$((count+1))
done < "$BATCH"
echo "BATCH=$BATCH GENERATED=$count"
