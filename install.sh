#!/usr/bin/env sh
set -eu

REPOSITORY="${BASEDKIT_REPOSITORY:-dat-hoangnguyentuandat/basedkit}"
REF="${BASEDKIT_REF:-main}"
INSTALL_ROOT="${BASEDKIT_HOME:-$HOME/.basedkit}"
BIN_DIR="${BASEDKIT_BIN_DIR:-$HOME/.local/bin}"
SOURCE_DIR="${BASEDKIT_SOURCE_DIR:-}"
TEMP_DIR=""
RESOLVED_COMMIT="${BASEDKIT_COMMIT:-}"

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
  if [ -z "$RESOLVED_COMMIT" ]; then
    RESOLVED_COMMIT="$(node -e '
      const [repo, ref] = process.argv.slice(1);
      fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(ref)}`, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "basedkit-installer" }
      }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      }).then((data) => process.stdout.write(data.sha || "")).catch(() => process.exit(1));
    ' "$REPOSITORY" "$REF" 2>/dev/null || true)"
  fi
  TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t basedkit)"
  DOWNLOAD_REF="${RESOLVED_COMMIT:-$REF}"
  curl -fsSL "https://codeload.github.com/$REPOSITORY/tar.gz/$DOWNLOAD_REF" -o "$TEMP_DIR/basedkit.tar.gz"
  tar -xzf "$TEMP_DIR/basedkit.tar.gz" -C "$TEMP_DIR"
  SOURCE_DIR="$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
elif [ -z "$RESOLVED_COMMIT" ] && command -v git >/dev/null 2>&1; then
  RESOLVED_COMMIT="$(git -C "$SOURCE_DIR" rev-parse HEAD 2>/dev/null || true)"
fi

mkdir -p "$INSTALL_ROOT" "$BIN_DIR"
STAGED_APP="$INSTALL_ROOT/app.new.$$"
PREVIOUS_APP="$INSTALL_ROOT/app.previous"
cp -R "$SOURCE_DIR" "$STAGED_APP"
if [ -d "$PREVIOUS_APP" ]; then rm -rf "$PREVIOUS_APP"; fi
if [ -d "$INSTALL_ROOT/app" ]; then mv "$INSTALL_ROOT/app" "$PREVIOUS_APP"; fi
mv "$STAGED_APP" "$INSTALL_ROOT/app"

if [ -n "$RESOLVED_COMMIT" ]; then
  node "$INSTALL_ROOT/app/installer/write-release-metadata.mjs" \
    --app "$INSTALL_ROOT/app" --repository "$REPOSITORY" --ref "$REF" \
    --version "2.0.0" --commit "$RESOLVED_COMMIT"
else
  node "$INSTALL_ROOT/app/installer/write-release-metadata.mjs" \
    --app "$INSTALL_ROOT/app" --repository "$REPOSITORY" --ref "$REF" --version "2.0.0"
fi

cat > "$BIN_DIR/basedkit" <<EOF
#!/usr/bin/env sh
exec node "$INSTALL_ROOT/app/bin/basedkit.mjs" "\$@"
EOF
chmod +x "$BIN_DIR/basedkit" "$INSTALL_ROOT/app/bin/basedkit.mjs"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    PROFILE="$HOME/.profile"
    MARKER="# BasedKit launcher"
    if ! grep -F "$MARKER" "$PROFILE" >/dev/null 2>&1; then
      printf '\n%s\nexport PATH="%s:$PATH"\n' "$MARKER" "$BIN_DIR" >> "$PROFILE"
    fi
    ;;
esac

echo "BasedKit launcher installed at $BIN_DIR/basedkit"
echo "Open a new terminal, enter a project directory, and run: basedkit"
