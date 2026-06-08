# pipeline.md — контракты и порядок сборки

Это backbone скилла. Здесь зафиксированы единые контракты: **`site.json`** (единственный
источник правды для проекта), **манифест картинок**, **каталог секций** и **TS-типы**.
Все шаблоны компонентов и все генераторы данных обязаны им соответствовать.

---

## 0. Структура выходного проекта

```
<output>/<brand-slug>/
├── package.json  next.config.mjs  tsconfig.json  postcss.config.mjs
├── app/
│   ├── layout.tsx        # шрифты next/font, <head>, JSON-LD, base SEO
│   ├── page.tsx          # читает site.json, рендерит секции по порядку
│   ├── globals.css       # Tailwind v4 @import + дизайн-токены (CSS vars из site.design)
│   ├── sitemap.ts  robots.ts  opengraph-image.tsx (или public/og.png)
│   └── icon.png  apple-icon.png  manifest.webmanifest
├── components/
│   ├── sections/         # по компоненту на тип секции (см. каталог ниже)
│   └── ui/               # примитивы: Button, Section, Container, Icon, Reveal, Rating…
├── lib/
│   ├── types.ts          # ТИПЫ из этого файла (копируются 1:1)
│   ├── site.ts           # import site + img() (резолв через bundle)
│   └── images.ts         # АВТОГЕН: импорты картинок → /_next/static/media
├── data/
│   ├── site.json         # ← главный контракт (ниже)
│   └── ru.json           # сырой вывод ru_data.py (для трассируемости)
├── assets/
│   └── images/           # картинки/логотип/маскот → бандлятся в /_next/static/media
└── (public/ не используется для картинок)
```

Стек (пинить версии в scaffold.sh): **Next.js 15 (App Router) + React 19 + Tailwind CSS v4 +
TypeScript**. Шрифты — `next/font/google`. Иконки — инлайновые SVG (Lucide-набор) в `ui/Icon`.

---

## 1. Контракт `site.json`

```jsonc
{
  "brand": {
    "name": "Дентал-Люкс",            // отображаемое имя
    "legalName": "ООО «Дентал-Люкс»",
    "tagline": "Стоматология, в которую возвращаются",
    "slug": "dental-lyuks",            // latin-kebab (для путей/домена)
    "domain": "dental-lyuks.ru"
  },
  "design": {
    "mode": "light",                   // light | dark
    "palette": {                       // ВСЕ значения — HEX. Контраст text/bg ≥ 4.5:1
      "bg": "#FBFAF7", "surface": "#FFFFFF", "text": "#0F172A", "muted": "#475569",
      "primary": "#0B3D2E", "primaryFg": "#FFFFFF", "accent": "#C8A24B",
      "border": "#E7E2D8", "ring": "#0B3D2E"
    },
    "fonts": {
      "display": { "family": "Cormorant Garamond", "weights": [500,600,700] },
      "body":    { "family": "Inter", "weights": [400,500,600] }
    },
    "radius": "1rem",                  // базовый радиус
    "style": "editorial-premium",      // ярлык стиля из ui-ux-pro-max
    "shadow": "0 12px 40px -12px rgba(15,23,42,.18)"
  },
  "seo": {
    "title": "Дентал-Люкс — премиальная стоматология в Казани",
    "description": "…120–160 символов, без слопа…",
    "keywords": ["стоматология казань","имплантация","виниры"],
    "ogImageSlug": "og",
    "locale": "ru_RU"
  },
  "company":  { /* ← объект company из ru_data.py, без изменений */ },
  "contacts": { /* ← объект contacts из ru_data.py */ },
  "schedule": { /* ← из ru_data.py */ },
  "stats":    { /* ← из ru_data.py: years_on_market, clients, rating, … */ },
  "nav": [ { "label": "Услуги", "href": "#services" }, { "label": "Цены", "href": "#pricing" } ],
  "cta": {
    "primary": { "label": "Записаться", "href": "#contacts" },
    "phoneLabel": "Перезвоните мне"
  },
  "images": {                          // slug → публичный путь (заполняется после gen_images)
    "hero": "/images/hero.webp",
    "logo": "/images/logo.png",
    "about": "/images/about.webp",
    "og":   "/images/og.webp"
  },
  "legal": {
    "disclaimer": "Сайт демонстрационный. Реквизиты сгенерированы и валидны по форме, но не принадлежат реальной организации."
  },
  "sections": [ /* упорядоченный список; каждая запись — из каталога ниже */ ]
}
```

**Правило:** `page.tsx` рендерит `sections` строго по порядку массива. Каждая секция —
объект с обязательным `type` (имя компонента) и `id` (для якоря). Остальные поля — пропсы.

---

## 2. Каталог секций (контракт компонентов)

Каждый `type` ↔ файл `components/sections/<Type>.tsx`, принимающий `props` + `site`.
`image` в пропсах — это **slug** из `site.images`. Поля помечены: `?` = опционально.

| type | назначение | ключевые пропсы |
|------|-----------|-----------------|
| `header` | липкая шапка с логотипом, навигацией, CTA, телефоном | `nav[]`, `cta`, `phone` (из site) |
| `hero` | первый экран | `variant` (`image-right`\|`bg-image`\|`centered`\|`split-left`), `eyebrow?`, `title`, `subtitle`, `bullets?[]`, `cta`, `secondaryCta?`, `image`, `stats?[]` |
| `trustbar` | полоса доверия: лицензии/гарантии/года/документы | `items[]: {icon,label,value?}` |
| `services` | карточки услуг с ценами | `title`, `subtitle?`, `items[]: {title,desc,price_label,icon,image?,popular?}`, `layout?` (`grid`\|`bento`) |
| `features` | «почему мы» / преимущества | `title`, `items[]: {icon,title,desc}`, `image?` |
| `about` | о компании: текст + цифры + врезка реквизитов | `title`, `body[]` (абзацы), `stats[]: {value,label}`, `image`, `showRequisites?` |
| `process` | этапы работы 1→N | `title`, `steps[]: {n,title,desc}` |
| `portfolio` | кейсы/работы (галерея/слайдер) | `title`, `items[]: {title,tag?,image,result?}` |
| `pricing` | тарифы/пакеты | `title`, `plans[]: {name,price_label,period?,features[],popular?,cta}` |
| `team` | команда | `title`, `members[]: {name,position,experience_years,image}` |
| `reviews` | отзывы | `title`, `items[]: {author,rating,date,text,avatar?}`, `aggregate?: {rating,count}` |
| `faq` | аккордеон вопросов | `title`, `items[]: {q,a}` |
| `cta` | финальный призыв + мини-форма заявки | `title`, `subtitle?`, `cta`, `image?`, `variant?` (`band`\|`split`\|`card`) |
| `contacts` | адрес, телефоны, график, карта, реквизиты | `title`, `map` (lat/lon/zoom), `requisites` (из company), `schedule`, `contacts` |
| `footer` | подвал: меню, реквизиты кратко, дисклеймер | из site |

Минимальный обязательный каркас лендинга: `header → hero → … → contacts → footer`.
Состав середины — из пресета ниши. Между `hero` и `footer` варьируй ритм (плотные/воздушные).

---

## 3. TS-типы (`lib/types.ts`) — копировать 1:1

```ts
export type Img = string; // публичный путь, напр. "/images/hero.webp"
export interface Palette { bg:string; surface:string; text:string; muted:string;
  primary:string; primaryFg:string; accent:string; border:string; ring:string; }
export interface FontDef { family:string; weights:number[]; }
export interface Design { mode:"light"|"dark"; palette:Palette;
  fonts:{display:FontDef; body:FontDef}; radius:string; style:string; shadow:string; }
export interface CTA { label:string; href:string; }
export interface Section { type:string; id:string; [k:string]:any; }
export interface Site {
  brand:{name:string;legalName:string;tagline:string;slug:string;domain:string};
  design:Design;
  seo:{title:string;description:string;keywords:string[];ogImageSlug:string;locale:string};
  company:any; contacts:any; schedule:any; stats:any;
  nav:{label:string;href:string}[]; cta:{primary:CTA;phoneLabel?:string};
  images:Record<string,Img>; legal:{disclaimer:string}; sections:Section[];
}
```

`globals.css` пробрасывает `design.palette` и `radius` в CSS-переменные
(`--color-bg`, `--color-primary`, `--radius`, …), Tailwind v4 `@theme` мапит их в утилиты
(`bg-bg`, `text-primary`, `rounded-[--radius]`). Шрифты — через `next/font` в `layout.tsx`,
семейства берутся из `design.fonts`.

---

## 4. Манифест картинок (`images.json` для gen_images.py)

```jsonc
{
  "palette": ["#0F172A", "#FBFAF7", "#C8A24B"],   // bg, surface/light, accent — для fallback-SVG
  "jobs": [
    { "slug":"hero",  "label":"Hero", "size":"1536x1024", "quality":"high",
      "background":"opaque", "format":"webp", "prompt":"…см. art-direction.md…" },
    { "slug":"about", "label":"About","size":"1536x1024", "quality":"high",
      "background":"opaque", "format":"webp", "prompt":"…" },
    { "slug":"logo",  "label":"Logo", "size":"1024x1024", "quality":"high",
      "background":"transparent", "format":"png", "prompt":"…см. brand-system.md…" },
    { "slug":"og",    "label":"OG",   "size":"1536x1024", "quality":"high",
      "background":"opaque", "format":"webp", "prompt":"…соцпревью…" }
  ]
}
```

Правила: размеры только `1024x1024 | 1536x1024 | 1024x1536`. Один визуал = одна job. Команда/
отзывы — портреты `1024x1536` или квадрат, нейтральные «studio headshot», без текста. Услуги/
интерьеры/кейсы — `1536x1024`. После генерации проставь реальные пути в `site.images`
(расширение зависит от `format`; при fallback это `.svg`).

---

## 5. Точная последовательность команд

```bash
SK=<path-to-skill>                       # корень demosite
PROJ=<output>/<brand-slug>
PYIMG=~/.config/demosite/venv/bin/python

# 0. ключ
python3 $SK/scripts/credentials.py --check --name OPENAI_API_KEY   # при отсутствии — спросить/--placeholder

# 3. дизайн-система
python3 $SK/vendor/ui-ux-pro-max/scripts/search.py "<ниша> <тон>" --design-system -f markdown

# 4. данные
python3 $SK/scripts/ru_data.py --industry <slug> --city "<Город>" --name "<Бренд>" \
   --seed <N> --team 6 --reviews 9 --services 6 --preset <preset.json> --out $PROJ/data/ru.json
#   → собрать site.json (design + seo + nav + sections + slить company/contacts/...)

# 6. картинки
$PYIMG $SK/scripts/gen_images.py --manifest images.json --out-dir $PROJ/public/images --concurrency 4

# 7. скаффолд
bash $SK/scripts/scaffold.sh $PROJ "<Бренд>"
#   → скопировать lib/types.ts, components/*, app/* из templates; вмонтировать site.json

# 8. сборка/превью
cd $PROJ && npm install && npm run build && npm run dev   # затем chrome-devtools screenshot
```

`seed` фиксируй (напр. из хеша бренда), чтобы данные были воспроизводимыми.

---

## 6. Анти-слоп чек (перед сдачей)
- Нет «революционный/инновационный/бесшовный/next-gen/под ключ ради галочки».
- Нет фейковых брендов Acme/Nexus/Quantum; название звучит по-русски и по нише.
- Реквизиты проходят `ru_data.py` (валидны); на сайте есть дисклеймер о демо-характере.
- На картинках нет встроенного текста/логотипов; палитра единая; композиция варьируется.
- Контраст ≥ 4.5:1; адаптив 375/768/1280; иконки — SVG; hover без сдвига; alt у картинок.

---

## 7. v2 — ВАРИАТИВНОСТЬ, PROP-SITE, CLEAN-URL, АНИМАЦИИ

### 7.1 Вход скилла
Скилл получает **домен + текстовое описание** ("dental-lux.ru — премиальная стоматология в Казани").
Из них выводится бренд, ниша, город (по умолчанию **Москва**), тон. Лишних вопросов не задаём.

### 7.2 Анти-фингерпринт (КРИТИЧНО)
Сайты не должны иметь общий детектируемый паттерн. За это отвечает `scripts/variation_engine.py`:
по домену/seed он детерминированно выдаёт `design` (палитра/режим/шрифты/радиус/тень/ширина/ритм) +
`variation` (preloader, animation, heroVariant, sectionVariants, порядок секций). Этот вывод —
основа `site.json`. Разные палитра+радиус+шрифты+spacing → разный компилируемый CSS;
разные `sectionVariants` → разный DOM; плюс разный контент/картинки. Каждая секция-компонент
ОБЯЗАНА реализовать свои варианты и читать `variantOf('<type>', '<default>')`.

```bash
python3 scripts/variation_engine.py --domain <dom> --description "<text>" --industry <slug> \
   --name "<Бренд>" [--seed N] [--mode light|dark] --out design.json
```

### 7.3 Контракт `site.json` — дополнения
- `design.containerMax` (напр. "72rem") и `design.sectionY` (напр. "clamp(4rem,9vw,7rem)") —
  пробрасываются в `--container-max` / `--section-y` (ширина и вертикальный ритм).
- `design.palette.accentFg` — контрастный цвет текста на accent.
- `seo.noindex` (default true) — сайт-витрина перед бэкендом, не индексируем (meta robots).
- `variation` (см. lib/types.ts Variation): `{seed, preloader, animation, spacing, container,
  heroVariant, sectionVariants}`. Компоненты читают `site.variation.sectionVariants[type]`.
- `legal` опционально `{copyright?, privacyLabel?}` — НИКАКОГО дисклеймера «демо» на сайте.

### 7.4 Prop-site (бутафория) — ОБЯЗАТЕЛЬНЫЕ правила вывода
Сайт — витрина перед реальным FastAPI-бэкендом; должен читаться как настоящий бизнес.
- **Запрещённые слова НИГДЕ** (в тексте, alt, meta, комментариях, именах): демо, demo, placeholder,
  пример, example, тест, тестовый, заглушка, фейк, fake, mock, dummy, sample, lorem ipsum, todo.
- **Формы**: на submit — `preventDefault`, локальная валидация, инлайн success ("Заявка принята,
  перезвоним в течение 15 минут"). НИКАКИХ `fetch`/`axios`/`XMLHttpRequest`/`action`.
- **Чистый URL**: внутренние ссылки — `href="#section"`, но `SiteClient` перехватывает клик,
  плавно скроллит и НЕ меняет адресную строку (никаких #hash/pushState). Внешние/`tel:`/`mailto:`
  и `[data-no-scroll]` — не трогаются. Никаких саб-роутов и Vue/Next Router-переходов.
- **Город по умолчанию — Москва**. Реквизиты заполнены и валидны (это и есть реализм).
- **Лого** — рукописный SVG (`scripts/gen_logo.py`), не AI-картинка.
- Никаких реальных сторонних скриптов (Метрика/аналитика/чаты).

### 7.5 Картинки — арт-дирекшн под РФ
- Люди на фото — **славянская внешность** (light brown/dark blonde hair, light eyes), контекст
  Москвы/РФ; всегда "no text overlay, no watermark, no logo". Детали — `references/art-direction.md`.

### 7.6 Анимации (база уже в globals.css + ui/)
- Классы для серверных компонентов: `ds-reveal`, `ds-reveal-blur`, `ds-stagger` (на контейнер
  списка), `ds-scale`, `ds-hover-lift`, `ds-float`, `ds-skeleton`. Класс `is-in` навешивает
  `SiteClient` через IntersectionObserver. Easing-переменные: `--ease-out/-in-out/-spring` (Emil).
- Готовые ui: `Preloader`, `Counter` (счётчики), `Marquee`, `Reveal`, кнопки с `active:scale`.
- Только `transform/opacity`; `prefers-reduced-motion` уважается (см. globals.css).
- Доп. полировка — `references/animations.md`. View Transitions (React `<ViewTransition>`) —
  опционально для интерактивных переключений (таб/слайдер), с graceful degradation.

### 7.7 Реализованные варианты секций (ключи = пул движка)
header: classic|centered|split|minimal|floating|topbar (КРИТИЧНО — шапки не должны совпадать) ·
hero: split-left|split-right|bg-image|centered|editorial ·  trustbar: row|marquee|stat-strip ·
services: cards|list|bento · features: grid|split-image|rows · about: split|stacked|side-stats ·
process: stepper|vertical|cards · portfolio: grid|masonry|overlay · pricing: cards|table|highlight ·
team: grid|cards|row · reviews: grid|slider|feature · faq: accordion|two-col|bordered ·
cta: band|split|card · contacts: split-map|map-top|cards. Неизвестный вариант → первый (fallback).

### 7.8 OpenAI — ТОЛЬКО генерация изображений
Ключ OpenAI применяется ИСКЛЮЧИТЕЛЬНО к эндпоинтам изображений
(`client.images.generate` / `client.images.edit`, модели `gpt-image*` / `dall-e*`):
- картинки секций (hero/about/services/portfolio/team/og) — `gen_images.py`;
- логотип — `gen_logo.py --ai` (`gpt-image-1-mini`);
- маскот — `gen_mascot.py`.

НИКАКИХ `chat.completions` / `responses.create` / текстовых вызовов через OpenAI. Весь
текст/копирайт/данные генерирует Claude и скрипты (`ru_data.py`, `assemble_site.py`). Скрипты
содержат guard `assert_image_model()` — при не-image модели падают с ошибкой/фолбэком.

Дашборд OpenAI: модели `gpt-image-1.5`/`gpt-image-1-mini` — токенные, поэтому отображаются в бакете
«Responses and Chat Completions» (input-токены = текст промпта), а бакет «Images» (легаси DALL·E)
остаётся пустым. Это нормальная картина генерации изображений, а не текстовый чат.

### 7.9 ВСЯ статика — из `/_next/static` (картинки тоже)
Изображения НЕ лежат в `public/`. Они лежат в `assets/images/` и импортируются как модули в
`lib/images.ts` (генерит `scripts/gen_image_imports.py`). Бандлер обрабатывает импорты и кладёт
файлы в `/_next/static/media/<имя>.<hash>.<ext>` — ровно туда же, где JS/CSS. Значит:
- `img(slug)` (lib/site.ts) возвращает URL вида `/_next/static/media/hero.abcd1234.webp`;
- логотип, favicon (`<link rel=icon>` = `img("logo")`), маскот — тоже из `_next/static`;
- НЕТ отдельного `/images/` пути.

Порядок: генерим картинки/логотип/маскот в `assets/images/` → `gen_image_imports.py <project>` →
`npm run build`. Слаг = имя файла без расширения (`hero.webp` → `"hero"`).

В статическом экспорте всё лежит под `out/` (`out/index.html` + `out/_next/static/...`). nginx:
```nginx
location / { root /var/www/<site>/out; try_files $uri $uri/ /index.html; }
# вся статика (включая картинки) под одним префиксом — удобно кэшировать/выносить на CDN:
location /_next/static/ { root /var/www/<site>/out; expires 365d; access_log off; immutable; }
```
Внешние ресурсы сайта: только Google Fonts и тайлы OSM-карты.
