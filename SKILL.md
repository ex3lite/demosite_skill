---
name: demosite
description: >
  Автономная фабрика премиальных ОДНОСТРАНИЧНЫХ сайтов-витрин для бизнеса (РФ). На вход —
  ДОМЕН и короткое ОПИСАНИЕ ("dental-lux.ru — премиальная стоматология в Казани"). На выходе —
  готовый, наполненный данными Next.js + React + Tailwind лендинг: бренд, дизайн-система, валидные
  РФ-реквизиты (ИНН/ОГРН/КПП/р-с с реальными контрольными суммами), арт-дирекшн-картинки через
  gpt-image-1.5, рукописный SVG-логотип, лоадер и анимации. КАЖДЫЙ сайт структурно НЕПОХОЖ на другие
  (анти-фингерпринт): палитра, шрифты, радиусы, ритм, варианты секций и порядок выбираются движком
  вариативности по домену/seed. Сайт — самодостаточная витрина (бутафория) перед реальным
  FastAPI-бэкендом: одна страница, чистый URL без саб-роутов, формы без бэкенда, без маркеров «демо».
  Триггеры: демо сайт, сайт-витрина, лендинг, одностраничник, landing page, сделай сайт для домена,
  /demosite. Ниши: ресторан, клиника, стоматология, юрфирма, стройка, ремонт, бьюти, автосервис,
  логистика, недвижимость, фитнес, образование, b2b, магазин. Стек: Next.js, React, Tailwind.
  Картинки: OpenAI gpt-image-1.5 (ключ из ~/.config/demosite/.env) + premium SVG-fallback.
---

# demosite — фабрика сайтов-витрин

Превращает **домен + описание** в **готовый одностраничный сайт-витрину** на Next.js, который
выглядит как настоящий действующий бизнес: заполнен реквизитами, контентом, картинками, анимирован,
и при этом **каждый раз структурно уникален**, чтобы по набору сайтов нельзя было вычислить общий
шаблон. Это скилл-оркестратор: SKILL.md задаёт пайплайн, детали — в `references/`, тяжёлую работу
делают вшитые скрипты и vendored движок `ui-ux-pro-max`.

## Контекст применения
Сайты — **витрины (бутафория) перед реальным бэкендом**. Сайт должен читаться как живой бизнес и
пройти пассивный/активный пробинг: одна страница, чистый URL, рабочие на вид формы (без сервера),
никаких следов «демо/тест/заглушка». Реквизиты заполнены и валидны по форме — это часть реализма.

---

## ШАГ 0 — Ключ OpenAI

Ключ **никогда не в скилле**. Резолв: `OPENAI_API_KEY` → `~/.config/demosite/.env` (chmod 600).
```bash
python3 scripts/credentials.py --check --name OPENAI_API_KEY
```
Нет ключа → спроси у пользователя и сохрани безопасно (из STDIN), затем продолжай:
```bash
printf '%s' "<КЛЮЧ>" | python3 scripts/credentials.py --set --name OPENAI_API_KEY
```
Отказ дать ключ → не блокируйся, генерируй картинки с `--placeholder` (premium SVG). venv (один раз):
```bash
uv venv ~/.config/demosite/venv 2>/dev/null; \
uv pip install --python ~/.config/demosite/venv/bin/python -q openai pillow
PYIMG=~/.config/demosite/venv/bin/python
```

---

## ПАЙПЛАЙН (детали — `references/pipeline.md`, загрузи её в начале)

Вход: **домен + описание**. Объяви нишу/бренд/число секций вслух и иди по шагам.

**1. Инференс.** Из домена → бренд (latin-слаг, имя). Из описания → ниша, город (по умолчанию
**Москва**), тон. Подбери пресет из `data/industries.json` по `ru_keywords`. Лишних вопросов не задавай.

**2. Вариативность (анти-фингерпринт).** Детерминированно по домену получи дизайн+структуру:
```bash
python3 scripts/variation_engine.py --domain <dom> --description "<text>" --industry <slug> \
   --name "<Бренд>" --out /tmp/<slug>.design.json
```
→ `design` (палитра/режим/шрифты/радиус/тень/ширина/ритм) + `variation` (preloader/animation/
heroVariant/sectionVariants) + `sections_order`. Это основа `site.json`. (Подробнее — `references/anti-fingerprint.md`.)

**3. Бренд, логотип, маскот.** Слоган по `references/brand-system.md`. Логотип — простой символ
через слабую модель `gpt-image-1-mini` (ставится в шапку И favicon); без ключа — фолбэк на SVG:
```bash
$PYIMG scripts/gen_logo.py --ai --name "<Бренд>" --industry <slug> --primary <hex> --accent <hex> \
   --seed <seed> --out <project>/public/images/logo.png --favicon <project>/public/icon.png
```
Если описание подразумевает **детский/семейный/игровой** контекст (например «детская стоматология»,
«детский центр», «семейное кафе») — сгенерируй МАСКОТ и используй его как визуал hero:
```bash
$PYIMG scripts/gen_mascot.py --name "<Бренд>" --industry <slug> --theme "<описание персонажа>" \
   --primary <hex> --accent <hex> --out <project>/public/images/mascot.png
# затем в site.json: секции hero проставь "image":"mascot"
```

**4. Данные (RU).** Реквизиты + контент:
```bash
python3 scripts/ru_data.py --industry <slug> --city "<Город|Москва>" --name "<Бренд>" \
   --seed <seed> --team 6 --reviews 9 --services 6 --preset <preset.json> --out <project>/data/ru.json
```
Тексты секций — по `references/copywriting.md` (живой РУ-копирайт, без слопа, без слов «демо»).

**5. Картинки.** На каждую секцию-визуал — арт-дирекшн-промпт по `references/art-direction.md`
(люди — славянская внешность, контекст Москвы/РФ, без текста на фото). Собери `images.json` и:
```bash
$PYIMG scripts/gen_images.py --manifest images.json --out-dir <project>/public/images --concurrency 4
```

**6. Скаффолд и сборка site.json.** Создай проект и собери ЕДИНЫЙ источник правды:
```bash
bash scripts/scaffold.sh <project> "<Бренд>" <slug>
```
Слей в `<project>/data/site.json`: `design`+`variation`+`brand`+`sections_order` (из шага 2) +
`company/contacts/schedule/stats` (из ru.json) + тексты секций + `images` (пути из шагов 3,5) +
`seo`/`nav`/`cta`. `sections[]` строй из `sections_order`, каждой секции — её пропсы (см. каталог
в pipeline.md). Архитектура **data-driven**: код компонентов не трогаем, меняем только site.json +
картинки. Подробно — `references/nextjs-build.md`.

**7. Запуск и превью.** `cd <project> && npm install && npm run build && npm run dev`. Открой в
браузере (chrome-devtools MCP), скриншоты desktop+mobile, проверь консоль, почини.

**8. QA.** Пройди `references/qa-checklist.md` + `references/prop-site.md`: чистый URL, формы без
сети, **0 запрещённых слов** (демо/тест/placeholder/…), контраст, адаптив, картинки, реквизиты,
карта на правильный город, анимации/лоадер работают, два разных домена дают разные сайты.

**9. Публикация (если задан репозиторий).** Если пользователь указал репозиторий — залей
ИСХОДНИКИ туда и СТАТИЧЕСКИЙ БИЛД в GitHub Releases (через `gh`):
```bash
bash scripts/publish.sh --project <project> --repo <owner/repo> [--visibility private|public] [--tag vX]
```
Скрипт: создаёт репо при отсутствии, коммитит/пушит исходники в ветку `main`, собирает статический
экспорт (`DEMOSITE_EXPORT=1 next build` → `out/`), пакует в zip и кладёт в релиз как ассет.
`out/` — самодостаточная статика (раздаётся nginx как root). Опции: `--source-only`,
`--release-only`, `--dry-run`. Нужен авторизованный `gh`.

**10. Сдача.** Путь проекта, локальный URL, ссылки на репозиторий/релиз (если публиковали),
скриншоты, кратко бренд. Деплой на сервер (Vercel/SSL) — по запросу (`deploy-to-vercel`, `ssl_setup_sert`).

---

## Жёсткие правила (prop-site)
- **Одна страница.** Никаких саб-роутов/маршрутизатора. Якорная навигация через `SiteClient`
  скроллит **без изменения URL** (адресная строка — чистый домен). Внешние/`tel:`/`mailto:` — норм.
- **Формы без бэкенда:** `preventDefault` + инлайн-success, никаких `fetch/axios/action`.
- **Запрещённые слова НИГДЕ** (вывод, alt, комментарии, имена): демо, demo, placeholder, пример,
  example, тест, заглушка, fake, mock, dummy, sample, lorem, todo.
- **Реквизиты валидны** (контрольные суммы) и **заполнены**; город по умолчанию **Москва**.
- **OpenAI — ТОЛЬКО картинки.** Ключ OpenAI используется ИСКЛЮЧИТЕЛЬНО для генерации изображений
  (`images.generate`/`images.edit`, модели `gpt-image*`): hero/секции/команда/og, логотип, маскот.
  НИКАКИХ chat/responses/текстовых вызовов через OpenAI — весь копирайт/тексты делает Claude.
  Скрипты `gen_images.py`/`gen_logo.py`/`gen_mascot.py` физически отказываются от не-image моделей.
  Примечание: в дашборде OpenAI `gpt-image-1.5`/`-mini` биллятся в бакете «Responses and Chat
  Completions» (промпт = input-токены) — это и есть генерация картинок, не текстовый чат.
- **Картинки — часть статики.** Все изображения лежат в `public/images/` → отдаются по `/images/*`
  → попадают в статический экспорт `out/images/*` БЕЗ изменений. nginx может раздавать `/images/`
  как статику (`location /images/ { root /var/www/site/out; }`). Логотип/иконка/маскот — там же.
  Сайт ничего не подгружает с внешних доменов, кроме Google Fonts и тайлов OSM-карты.
- **Не индексировать.** Сайты не должны попадать в поиск: `seo.noindex=true` (по умолчанию) →
  meta `noindex,nofollow` + заголовок `X-Robots-Tag` (в next.config). Не убирай это.
- **Картинки:** один визуал на секцию, единая палитра, без текста/логотипов на фото, люди —
  славянская внешность. Логотип — простой gpt-image-1-mini символ (в шапку и favicon), без текста.
- **Шапка и hero ОБЯЗАНЫ различаться между сайтами** — это варианты (`header`: classic/centered/
  split/minimal/floating/topbar; `hero`: split-left/right/bg-image/centered/editorial), выбираемые
  движком по домену. Не своди их к одному паттерну.
- **Иконки — SVG** (набор в `ui/Icon`), не эмодзи. Анимации — `transform/opacity`, reduced-motion.
- **Каждый сайт уникален:** меняй `seed`/домен; не переиспользуй один favicon/og/тексты.

## Карта ресурсов
| Ресурс | Назначение |
|--------|-----------|
| `references/pipeline.md` | Контракты: site.json, манифест картинок, каталог секций, v2-дополнения |
| `references/anti-fingerprint.md` | Как добиваемся непохожести сайтов (источники энтропии) |
| `references/prop-site.md` | Правила витрины: чистый URL, формы, запрещённые слова |
| `references/art-direction.md` | Промпты gpt-image по секциям (Slavic/Москва, размеры) |
| `references/brand-system.md` | Название, слоган, SVG-логотип |
| `references/copywriting.md` | Живой РУ-копирайт без слопа |
| `references/sections.md` | Каталог секций и их вариантов (контракт для site.json) |
| `references/industries.md` | Пресеты ниш (data/industries.json) |
| `references/nextjs-build.md` | Сборка site.json, токены, SEO/JSON-LD, картинки, частые фиксы |
| `references/animations.md` | Анимационный плейбук (Emil), лоадеры, View Transitions |
| `references/qa-checklist.md` | Самопроверка в браузере (chrome-devtools) |
| `data/industries.json` | Машиночитаемые пресеты ниш |
| `scripts/variation_engine.py` | Движок вариативности (design+variation+order по seed) |
| `scripts/ru_data.py` | RU-реквизиты и контент (валидные контрольные суммы; `--selftest`) |
| `scripts/gen_images.py` | Батч gpt-image-1.5 + SVG-fallback |
| `scripts/gen_logo.py` | Рукописный SVG-логотип (стили по seed) |
| `scripts/credentials.py` | Ключ вне репозитория |
| `scripts/scaffold.sh` | Детерминированный скаффолд Next.js |
| `scripts/publish.sh` | Исходники → GitHub-репо + статический билд → GitHub Releases (через gh) |
| `scripts/gen_mascot.py` | Контекстный маскот (детские/семейные ниши) через gpt-image |
| `templates/` | Фундамент проекта + библиотека секций (data-driven) |
| `vendor/ui-ux-pro-max/` | Дизайн-движок: палитры, типографика, стили, стек-гайды |
