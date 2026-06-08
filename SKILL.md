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

**3. Бренд и логотип.** Слоган по `references/brand-system.md`. Рукописный SVG-логотип:
```bash
python3 scripts/gen_logo.py --name "<Бренд>" --primary <hex> --accent <hex> --seed <seed> \
   --out <project>/public/images/logo.svg --favicon <project>/public/icon.svg
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

**9. Сдача.** Путь проекта, локальный URL, скриншоты, кратко бренд. Деплой (Vercel/SSL) — отдельный
шаг по запросу (скиллы `deploy-to-vercel`, `ssl_setup_sert`).

---

## Жёсткие правила (prop-site)
- **Одна страница.** Никаких саб-роутов/маршрутизатора. Якорная навигация через `SiteClient`
  скроллит **без изменения URL** (адресная строка — чистый домен). Внешние/`tel:`/`mailto:` — норм.
- **Формы без бэкенда:** `preventDefault` + инлайн-success, никаких `fetch/axios/action`.
- **Запрещённые слова НИГДЕ** (вывод, alt, комментарии, имена): демо, demo, placeholder, пример,
  example, тест, заглушка, fake, mock, dummy, sample, lorem, todo.
- **Реквизиты валидны** (контрольные суммы) и **заполнены**; город по умолчанию **Москва**.
- **Картинки:** один визуал на секцию, единая палитра, без текста/логотипов на фото, люди —
  славянская внешность. Логотип — рукописный SVG, не AI-картинка.
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
| `templates/` | Фундамент проекта + библиотека секций (data-driven) |
| `vendor/ui-ux-pro-max/` | Дизайн-движок: палитры, типографика, стили, стек-гайды |
