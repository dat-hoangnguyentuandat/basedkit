#!/usr/bin/env sh
set -eu

REPOSITORY="${BASEKIT_REPOSITORY:-dat-hoangnguyentuandat/basekit}"
REF="${BASEKIT_REF:-main}"
INSTALL_ROOT="${BASEKIT_HOME:-$HOME/.basekit}"
BIN_DIR="${BASEKIT_BIN_DIR:-$HOME/.local/bin}"
SOURCE_DIR="${BASEKIT_SOURCE_DIR:-}"
TEMP_DIR=""

cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then rm -rf "$TEMP_DIR"; fi
}
trap cleanup EXIT INT TERM

command -v node >/dev/null 2>&1 || { echo "Node.js 18 or newer is required." >&2; exit 1; }
node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' || {
  echo "Node.js 18 or newer is required." >&2
  exit 1
}

if [ -z "$SOURCE_DIR" ]; then
  command -v curl >/dev/null 2>&1 || { echo "curl is required." >&2; exit 1; }
  command -v tar >/dev/null 2>&1 || { echo "tar is required." >&2; exit 1; }
  TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t basekit)"
  curl -fsSL "https://codeload.github.com/$REPOSITORY/tar.gz/$REF" -o "$TEMP_DIR/basekit.tar.gz"
  tar -xzf "$TEMP_DIR/basekit.tar.gz" -C "$TEMP_DIR"
  SOURCE_DIR="$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
fi

mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
STAGED_APP="$INSTALL_ROOT/app.new.$$"
PREVIOUS_APP="$INSTALL_ROOT/app.previous"
cp -R "$SOURCE_DIR" "$STAGED_APP"
if [ -d "$PREVIOUS_APP" ]; then rm -rf "$PREVIOUS_APP"; fi
if [ -d "$INSTALL_ROOT/app" ]; then mv "$INSTALL_ROOT/app" "$PREVIOUS_APP"; fi
mv "$STAGED_APP" "$INSTALL_ROOT/app"

cat > "$BIN_DIR/basekit" <<EOF
#!/usr/bin/env sh
exec node "$INSTALL_ROOT/app/bin/basekit.mjs" "\$@"
EOF
chmod +x "$BIN_DIR/basekit" "$INSTALL_ROOT/app/bin/basekit.mjs"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    PROFILE="$HOME/.profile"
    MARKER="# BaseKit launcher"
    if ! grep -F "$MARKER" "$PROFILE" >/dev/null 2>&1; then
      printf '\n%s\nexport PATH="%s:$PATH"\n' "$MARKER" "$BIN_DIR" >> "$PROFILE"
    fi
    ;;
esac

echo "BaseKit launcher installed at $BIN_DIR/basekit"
echo "Open a new terminal, enter a project directory, and run: basekit"
