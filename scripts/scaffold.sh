#!/usr/bin/env bash
# scaffold.sh — детерминированный скаффолд Next.js-проекта демо-сайта из templates/.
# Никакого create-next-app (интерактив/сеть): просто копируем выверенный каркас.
#
#   bash scaffold.sh <project-dir> [brand-display-name] [latin-slug]
#
set -euo pipefail

PROJ="${1:?usage: scaffold.sh <project-dir> [brand] [slug]}"
BRAND="${2:-Демо-Компания}"
SLUG="${3:-}"

SK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$SK/templates"

if [ -z "$SLUG" ]; then
  SLUG="$(printf '%s' "$BRAND" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//')"
fi
[ -z "$SLUG" ] && SLUG="demosite-app"

# Картинки лежат в assets/images (бандлятся в /_next/static/media), а не в public/.
mkdir -p "$PROJ/data" "$PROJ/assets/images"
cp -R "$T/app" "$T/components" "$T/lib" "$PROJ/"
cp "$T/package.json" "$T/next.config.mjs" "$T/tsconfig.json" "$T/postcss.config.mjs" "$PROJ/"

# имя пакета
if command -v node >/dev/null 2>&1; then
  node -e "const f='$PROJ/package.json',fs=require('fs');const p=JSON.parse(fs.readFileSync(f));p.name='$SLUG';fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n')" || true
fi

# safety net: если data/site.json ещё не положили — берём пример, чтобы build не падал
if [ ! -f "$PROJ/data/site.json" ] && [ -f "$T/data/site.sample.json" ]; then
  cp "$T/data/site.sample.json" "$PROJ/data/site.json"
fi

cat > "$PROJ/.gitignore" <<'EOF'
/node_modules
/.next
/out
*.log
.DS_Store
EOF

# next требует next-env.d.ts (создастся сам при первом build, но положим заглушку)
cat > "$PROJ/next-env.d.ts" <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

echo "✓ Scaffolded Next.js project: $PROJ  (package name: $SLUG)"
echo "  Дальше: положить data/site.json + public/images, затем npm install && npm run dev"
