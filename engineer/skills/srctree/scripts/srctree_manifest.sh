#!/usr/bin/env bash
# Write _manifest.md with project-wide totals (Files/Symbols/Routes/Config arrays).
# Usage: OUT=/path/to/.claude/Srctree bash srctree_manifest.sh
set -u
OUT="${OUT:-$PWD/.claude/Srctree}"
TS=$(date '+%Y-%m-%d %H:%M')

mds=$(find "$OUT" -name '*.md' ! -name '_manifest.md' 2>/dev/null)
files=$(printf '%s\n' "$mds" | grep -c .)
syms=$(printf '%s\n' "$mds" | xargs grep -hE '^## Symbols \(' 2>/dev/null \
  | sed -E 's/.*\(([0-9]+)\).*/\1/' | awk '{s+=$1} END{print s+0}')
routes=$(printf '%s\n' "$mds" | xargs grep -hcE '^- route:' 2>/dev/null | awk '{s+=$1} END{print s+0}')
cfgarr=$(printf '%s\n' "$mds" | xargs grep -lE '^## Config \(Tier 2b\)' 2>/dev/null | grep -c .)

{
  echo "# Srctree manifest"
  echo
  echo "| Field         | Value |"
  echo "|---------------|-------|"
  echo "| Generated     | $TS |"
  echo "| Files         | $files |"
  echo "| Symbols       | $syms |"
  echo "| Routes        | $routes |"
  echo "| Config arrays | $cfgarr |"
} > "$OUT/_manifest.md"

echo "FILES=$files SYMS=$syms ROUTES=$routes CFG=$cfgarr"
