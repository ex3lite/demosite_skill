#!/usr/bin/env bash
# publish.sh — публикация сгенерированного сайта:
#   1) ИСХОДНИКИ → в указанный GitHub-репозиторий (создаёт репо при необходимости)
#   2) СТАТИЧЕСКИЙ БИЛД (next export, out/) → в GitHub Releases как zip-ассет
#
# Использует gh CLI (должен быть авторизован: gh auth login). Идемпотентно.
#
#   bash publish.sh --project <dir> --repo <owner/repo|git-url> [опции]
#
# Опции:
#   --repo <owner/repo|url>   целевой репозиторий (обяз.)
#   --project <dir>           папка сгенерированного сайта (по умолч. текущая)
#   --visibility private|public   видимость нового репо (по умолч. private)
#   --branch <name>           ветка исходников (по умолч. main)
#   --tag <tag>               тег релиза (по умолч. build-YYYYMMDD-HHMM)
#   --message <msg>           сообщение коммита исходников
#   --source-only             только исходники (без релиза/билда)
#   --release-only            только билд+релиз (без коммита/пуша исходников)
#   --no-release              синоним --source-only
#   --dry-run                 показать действия, ничего не выполняя
set -euo pipefail

PROJECT="."; REPO=""; VIS="private"; BRANCH="main"; TAG=""; MSG=""
SOURCE=1; RELEASE=1; DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2;;
    --repo) REPO="$2"; shift 2;;
    --visibility) VIS="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    --tag) TAG="$2"; shift 2;;
    --message) MSG="$2"; shift 2;;
    --source-only|--no-release) RELEASE=0; shift;;
    --release-only) SOURCE=0; shift;;
    --dry-run) DRY=1; shift;;
    -h|--help) sed -n '2,30p' "$0"; exit 0;;
    *) echo "Неизвестная опция: $1" >&2; exit 2;;
  esac
done

[ -n "$REPO" ] || { echo "Ошибка: нужен --repo <owner/repo|url>" >&2; exit 2; }
[ -d "$PROJECT" ] || { echo "Ошибка: нет папки проекта: $PROJECT" >&2; exit 2; }

# нормализуем repo → slug owner/repo
SLUG="$REPO"
SLUG="${SLUG#git@github.com:}"
SLUG="${SLUG#https://github.com/}"
SLUG="${SLUG#http://github.com/}"
SLUG="${SLUG%.git}"
case "$SLUG" in */*) :;; *) echo "Ошибка: repo должен быть owner/repo: $REPO" >&2; exit 2;; esac

command -v gh >/dev/null || { echo "Ошибка: нет gh CLI (brew install gh; gh auth login)" >&2; exit 3; }
gh auth status >/dev/null 2>&1 || { echo "Ошибка: gh не авторизован (gh auth login)" >&2; exit 3; }

[ -n "$TAG" ] || TAG="build-$(date +%Y%m%d-%H%M%S)"
PROJECT="$(cd "$PROJECT" && pwd)"
cd "$PROJECT"

# имя/домен бренда для сообщений (из data/site.json, если есть)
BRAND="$(node -e "try{console.log(require('./data/site.json').brand.name)}catch(e){console.log('')}" 2>/dev/null || echo "")"
DOMAIN="$(node -e "try{console.log(require('./data/site.json').brand.domain)}catch(e){console.log('')}" 2>/dev/null || echo "")"
[ -n "$MSG" ] || MSG="site: ${BRAND:-$SLUG}${DOMAIN:+ ($DOMAIN)}"

run() { if [ "$DRY" = 1 ]; then echo "DRY: $*"; else eval "$*"; fi; }

echo "▶ Проект: $PROJECT"
echo "▶ Репозиторий: $SLUG  (видимость: $VIS, ветка: $BRANCH)"
echo "▶ Релиз: $([ "$RELEASE" = 1 ] && echo "тег $TAG" || echo "пропущен")"

# ── .gitignore (на случай отсутствия) ────────────────────────────────────────
if [ ! -f .gitignore ]; then
  run "printf '%s\n' '/node_modules' '/.next' '/out' '/dist' '*.log' '.DS_Store' > .gitignore"
fi

# ── 1. ИСХОДНИКИ ─────────────────────────────────────────────────────────────
if [ "$SOURCE" = 1 ]; then
  [ -d .git ] || run "git init -q -b '$BRANCH'"
  run "git add -A"
  # коммитим только если есть изменения
  if [ "$DRY" = 1 ]; then echo "DRY: git commit -m \"$MSG\" (если есть изменения)"; else
    git diff --cached --quiet || git commit -q -m "$MSG"
  fi
  # репозиторий существует?
  if gh repo view "$SLUG" >/dev/null 2>&1; then
    echo "  репозиторий существует — пушу"
    URL="$(gh repo view "$SLUG" --json sshUrl -q .sshUrl 2>/dev/null || echo "git@github.com:$SLUG.git")"
    if git remote get-url origin >/dev/null 2>&1; then run "git remote set-url origin '$URL'"; else run "git remote add origin '$URL'"; fi
    run "git push -u origin '$BRANCH'"
  else
    echo "  репозиторий не найден — создаю ($VIS) и пушу"
    run "gh repo create '$SLUG' --$VIS --source=. --remote=origin --push --description '${BRAND:-demosite} site'"
  fi
fi

# ── 2. БИЛД + РЕЛИЗ ──────────────────────────────────────────────────────────
if [ "$RELEASE" = 1 ]; then
  if [ ! -d node_modules ]; then
    echo "  ставлю зависимости"; run "npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund"
  fi
  echo "  собираю статический экспорт (out/)"
  run "DEMOSITE_EXPORT=1 npm run build"
  if [ "$DRY" != 1 ] && [ ! -d out ]; then echo "Ошибка: out/ не создан (проверьте сборку)" >&2; exit 4; fi
  ZIPNAME="${SLUG##*/}-${TAG}.zip"
  run "mkdir -p dist"
  run "rm -f 'dist/$ZIPNAME'"
  run "(cd out && zip -qr '../dist/$ZIPNAME' .)"
  NOTES="Статическая сборка сайта ${BRAND:-}${DOMAIN:+ ($DOMAIN)}. Раздавайте содержимое архива как статику (nginx root). Сгенерировано demosite."
  if gh release view "$TAG" --repo "$SLUG" >/dev/null 2>&1; then
    echo "  релиз $TAG существует — добавляю/обновляю ассет"
    run "gh release upload '$TAG' 'dist/$ZIPNAME' --repo '$SLUG' --clobber"
  else
    echo "  создаю релиз $TAG"
    run "gh release create '$TAG' 'dist/$ZIPNAME' --repo '$SLUG' --title '$TAG' --notes \"$NOTES\""
  fi
fi

echo "✓ Готово."
[ "$SOURCE" = 1 ] && echo "  исходники: https://github.com/$SLUG"
[ "$RELEASE" = 1 ] && echo "  релиз:     https://github.com/$SLUG/releases/tag/$TAG"
