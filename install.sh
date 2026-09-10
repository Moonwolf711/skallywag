#!/usr/bin/env bash
# Skallywag installer for macOS / Linux.
#   curl -fsSL https://raw.githubusercontent.com/Moonwolf711/skallywag/main/install.sh | bash
# Options (environment variables):
#   SKALLYWAG_DRYRUN=1        print every step, change nothing
#   SKALLYWAG_SKIP_MODEL=1    do not pull the Ollama model
#   SKALLYWAG_SKIP_SKILLS=1   do not touch ~/.claude
#   SKALLYWAG_MODEL=<name>    Ollama model to pull (default qwen2.5:7b)
#   SKALLYWAG_ZIP=<path>      purchased Skallywag.zip to unpack + set up
set -euo pipefail
REPO="${SKALLYWAG_REPO:-Moonwolf711/skallywag}"
BRANCH="${SKALLYWAG_BRANCH:-main}"
MODEL="${SKALLYWAG_MODEL:-qwen2.5:7b}"
DRY="${SKALLYWAG_DRYRUN:-0}"
BASE="${HOME}/.skallywag"
SRC="${BASE}/public"

step() { printf '\033[36m==> %s\033[0m\n' "$1"; }
note() { printf '    %s\n' "$1"; }
run()  { if [ "$DRY" = "1" ]; then printf '    \033[33m[dry-run] %s\033[0m\n' "$1"; else shift; "$@"; fi; }
have() { command -v "$1" >/dev/null 2>&1; }

echo; echo "  SKALLYWAG  -  an AI first mate inside Ableton Live"; echo "  The captain doesn't steer the ship. The crew does."; echo
[ "$DRY" = "1" ] && echo "  DRY RUN: nothing will be installed or copied."

step "Dependencies"
OS="$(uname -s)"
if have node; then note "Node.js $(node --version) found"
elif [ "$OS" = "Darwin" ] && have brew; then run "brew install node" brew install node
else echo "    install Node.js LTS from https://nodejs.org then rerun"; [ "$DRY" = "1" ] || exit 1; fi
if have ollama; then note "Ollama found"
elif [ "$OS" = "Darwin" ] && have brew; then run "brew install ollama" brew install ollama
else echo "    install Ollama from https://ollama.com/download then rerun"; [ "$DRY" = "1" ] || exit 1; fi

step "Skallywag files"
URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz"
fetch() { mkdir -p "$BASE"; rm -rf "$SRC" "$BASE/extract"; mkdir -p "$BASE/extract"; curl -fsSL "$URL" | tar -xz -C "$BASE/extract"; mv "$BASE/extract"/* "$SRC"; rm -rf "$BASE/extract"; }
run "download $URL -> $SRC" fetch
note "repo files: $SRC"

step "Skallywag Lite device"
if [ "$OS" = "Darwin" ]; then USERLIB="$HOME/Music/Ableton/User Library"; else USERLIB="$HOME/Ableton/User Library"; fi
LITE="$USERLIB/Presets/Audio Effects/Max Audio Effect/Skallywag Lite"
if [ -d "$USERLIB" ]; then
  copy_lite() { mkdir -p "$LITE"; cp "$SRC"/device-lite/* "$LITE"/; }
  run "copy device-lite -> $LITE" copy_lite
  note "in Live: User Library > Presets > Audio Effects > Max Audio Effect > Skallywag Lite"
else
  echo "    Ableton User Library not found at $USERLIB; copy $SRC/device-lite there yourself"
fi

step "Claude Code channel agents + template skill"
if [ "${SKALLYWAG_SKIP_SKILLS:-0}" = "1" ]; then note "skipped (SKALLYWAG_SKIP_SKILLS)"
elif ! have claude && [ ! -d "$HOME/.claude" ]; then note "Claude Code not found; skipping. Files stay in $SRC/claude"
else
  copy_skills() { mkdir -p "$HOME/.claude/agents" "$HOME/.claude/skills/skallywag-template" "$BASE/tools"; cp "$SRC"/claude/agents/*.md "$HOME/.claude/agents/"; cp -R "$SRC"/claude/skills/skallywag-template/. "$HOME/.claude/skills/skallywag-template/"; cp "$SRC/tools/osc.py" "$BASE/tools/osc.py"; }
  run "copy agents + skill -> ~/.claude, osc.py -> $BASE/tools" copy_skills
fi

step "Local model ($MODEL)"
if [ "${SKALLYWAG_SKIP_MODEL:-0}" = "1" ]; then note "skipped (SKALLYWAG_SKIP_MODEL)"
elif ! have ollama && [ "$DRY" != "1" ]; then echo "    ollama not on PATH yet; open a new terminal and run: ollama pull $MODEL"
else run "ollama pull $MODEL  (one-time download, several GB)" ollama pull "$MODEL"; fi

step "Skallywag bundle"
ZIP="${SKALLYWAG_ZIP:-}"
if [ -z "$ZIP" ]; then note "no bundle given. Bought Skallywag? rerun with SKALLYWAG_ZIP=<path to Skallywag.zip>. Get it: https://4420607908526.gumroad.com/l/skallywag"
elif [ ! -f "$ZIP" ]; then echo "    bundle not found: $ZIP"
else
  DST="$HOME/Documents/Skallywag"
  unpack() { mkdir -p "$DST"; unzip -o -q "$ZIP" -d "$DST"; SETUP="$(find "$DST" -name setup.command | head -1)"; if [ -n "$SETUP" ]; then chmod +x "$SETUP" "$(dirname "$SETUP")/run.command" 2>/dev/null || true; (cd "$(dirname "$SETUP")" && ./setup.command); else echo "    setup.command not found inside the bundle"; fi; }
  run "unpack $ZIP -> $DST and run setup.command" unpack
  note "then: run.command, and drag device/Skallywag.amxd onto a MIDI track"
fi

echo; printf '\033[32m  Done.\033[0m\n'; echo "  Say it exactly. It's in the set."; echo
