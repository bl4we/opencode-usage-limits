#!/usr/bin/env sh
set -eu

config="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
dest="$config/plugins/usage-limits"

if [ -d "$dest" ]; then
  rm -rf "$dest"
  printf 'Удалено: %s\n' "$dest"
else
  printf 'Папка не найдена: %s\n' "$dest"
fi

printf 'Перезапусти OpenCode или выполни: opencode reload\n'
