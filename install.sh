#!/usr/bin/env sh
set -eu

REPOSITORY="${BASEKIT_REPOSITORY:-dat-hoangnguyentuandat/basekit}"
REF="${BASEKIT_REF:-main}"
TARGET="${BASEKIT_TARGET:-$PWD}"
PROVIDER="${BASEKIT_PROVIDER:-}"
SOURCE_DIR="${BASEKIT_SOURCE_DIR:-}"
TEMP_DIR=""

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT INT TERM

choose_provider() {
  if [ -n "$PROVIDER" ]; then return; fi
  if [ ! -r /dev/tty ]; then
    echo "Set BASEKIT_PROVIDER=claude, codex, or both for non-interactive installation." >&2
    exit 1
  fi
  printf '%s\n' "BaseKit target: $TARGET" >/dev/tty
  printf '%s\n' "1) Claude Code" "2) Codex" "3) Both" >/dev/tty
  printf 'Choose a provider [1-3]: ' >/dev/tty
  read -r choice </dev/tty
  case "$choice" in
    1|claude) PROVIDER="claude" ;;
    2|codex) PROVIDER="codex" ;;
    3|both) PROVIDER="both" ;;
    *) echo "Invalid provider selection: $choice" >&2; exit 1 ;;
  esac
}

download_source() {
  if [ -n "$SOURCE_DIR" ]; then return; fi
  command -v curl >/dev/null 2>&1 || { echo "curl is required." >&2; exit 1; }
  command -v tar >/dev/null 2>&1 || { echo "tar is required." >&2; exit 1; }
  TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t basekit)"
  archive="$TEMP_DIR/basekit.tar.gz"
  curl -fsSL "https://codeload.github.com/$REPOSITORY/tar.gz/$REF" -o "$archive"
  tar -xzf "$archive" -C "$TEMP_DIR"
  SOURCE_DIR="$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
}

command -v node >/dev/null 2>&1 || {
  echo "Node.js 18 or newer is required to install BaseKit safely." >&2
  exit 1
}
choose_provider
download_source
mkdir -p "$TARGET"
node "$SOURCE_DIR/installer/install.mjs" --source "$SOURCE_DIR" --target "$TARGET" --provider "$PROVIDER"
echo "BaseKit installed for $PROVIDER in $TARGET"
