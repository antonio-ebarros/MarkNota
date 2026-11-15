#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

if [ ! -d "dist" ] || [ ! -d "dist-electron" ]; then
  npm run build
fi

exec ./node_modules/.bin/electron . "$@"
