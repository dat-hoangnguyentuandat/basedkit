#!/usr/bin/env bash
# List processable text files in a repo, split into N batches for parallel generation.
# Usage: ROOT=/path/to/repo NBATCH=8 OUTDIR=/tmp bash srctree_list.sh
#   prints TEXT_FILES=<n> and writes $OUTDIR/srctree_batch_00.. files.
set -u
ROOT="${ROOT:-$PWD}"
NBATCH="${NBATCH:-8}"
OUTDIR="${OUTDIR:-/tmp}"

EXCLUDE_DIRS='^(node_modules|\.git|\.svn|\.hg|bin|obj|dist|build|out|target|coverage|vendor|__pycache__|\.next|\.nuxt|\.cache|publish|\.claude|storage|public/(theme-assets|vendor|build))/'
BIN_EXT='\.(png|jpe?g|gif|svg|ico|webp|bmp|tiff?|woff2?|ttf|eot|otf|zip|gz|tar|7z|rar|exe|dll|so|dylib|bin|pdf|mp[34]|avi|mov|wav|flac|class|jar|pyc|o|a|lock|map|min\.js|min\.css)$'

# prefer git tracked files; fall back to find
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  files=$(git -C "$ROOT" ls-files)
else
  files=$(cd "$ROOT" && find . -type f | sed 's#^\./##')
fi

filtered=$(printf '%s\n' "$files" \
  | grep -vE "$EXCLUDE_DIRS" \
  | grep -ivE "$BIN_EXT" \
  | grep -v '^$')

total=$(printf '%s\n' "$filtered" | grep -c .)
echo "TEXT_FILES=$total"

rm -f "$OUTDIR"/srctree_batch_* 2>/dev/null
printf '%s\n' "$filtered" | split -d -n r/"$NBATCH" - "$OUTDIR/srctree_batch_"
for b in "$OUTDIR"/srctree_batch_*; do
  echo "$b -> $(grep -c . "$b")"
done
