#!/usr/bin/env sh
set -eu

src=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
config="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
dest="$config/plugins/usage-limits"

mkdir -p "$dest"
cp "$src/package.json" "$src/index.ts" "$src/gui-experimental.cjs" "$src/README.md" "$dest/"

printf '\nOpenCode Usage Limits установлен:\n  %s\n\n' "$dest"
printf 'Перезапусти OpenCode или выполни: opencode reload\n'
printf 'Затем открой сессию — плашка появится внизу левой панели.\n\n'
