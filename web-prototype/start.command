#!/bin/zsh
set -eu
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  dancer_node="$(command -v node)"
else
  dancer_node="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$dancer_node" ]]; then
  print 'Install Node.js 22.12+ or 24+, then run pnpm install and pnpm dev.'
  exit 1
fi
if [[ ! -f node_modules/vite/bin/vite.js ]]; then
  print 'Dependencies are missing. Run pnpm install in this directory first.'
  exit 1
fi
exec "$dancer_node" node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173
