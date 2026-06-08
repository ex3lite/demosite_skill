# nextjs-build.md — сборка Next.js-проекта из data/site.json

Этот документ описывает, **как из выводов скриптов собирается готовый Next.js-сайт**: какова
архитектура проекта, как формируется единственный источник правды `data/site.json`, как палитра,
шрифты и ритм инъектируются через `layout.tsx`, как устроены SEO/JSON-LD/robots/sitemap, чистый URL,
формы-витрины, карта, картинки и логотип, какие команды запускают сборку и какие ошибки чаще всего
ломают `npm run build`.

Опирается на: `templates/app/{layout.tsx,page.tsx,globals.css,sitemap.ts,robots.ts}`,
`templates/lib/site.ts`, `templates/components/ui/SiteClient.tsx`, `scripts/scaffold.sh`,
а также контракты из `references/pipeline.md` (разделы 0–4, 7).

Стек (пинится в `scaffold.sh` / `package.json`): **Next.js 15 (App Router) + React 19 +
Tailwind CSS v4 + TypeScript**. Шрифты — Google Fonts (`<link>` в `<head>`). Иконки — инлайновые
SVG в `ui/Icon`.

---

## 1. Data-driven архитектура: код не трогаем, меняем только данные

Главный принцип: **весь сайт описывается одним файлом `data/site.json`**. Шаблоны компонентов
(`templates/`) выверены и **неизменны** от сайта к сайту. От проекта к проекту меняются ровно две
вещи:

1. `data/site.json` — контент, дизайн-токены, порядок и пропсы секций;
2. `public/images/*` — арт-дирекшн-картинки и SVG-логотип.

Как это работает в коде:

- `lib/site.ts` импортирует JSON статически: `import data from "@/data/site.json"` и кастит его в
  тип `Site`. Все компоненты читают данные через `site`, хелперы `img()`, `rub()`, `ruDate()`,
  `tel()`, `variantOf()`, `initials()`.
- `app/page.tsx` держит **REGISTRY** — карту `type → компонент секции` — и рендерит
  `site.sections` строго **по порядку массива**:
  ```tsx
  const REGISTRY: Record<string, React.ComponentType<{ data: Section }>> = {
    header: Header, hero: Hero, trustbar: Trustbar, services: Services,
    features: Features, about: About, process: Process, portfolio: Portfolio,
    pricing: Pricing, team: Team, reviews: Reviews, faq: Faq, cta: Cta,
    contacts: Contacts, footer: Footer,
  };
  // …
  site.sections.map((section) => {
    const Cmp = REGISTRY[section.type];
    return <Cmp key={section.id} data={section} />;
  });
  ```
  Если `type` отсутствует в REGISTRY: в dev рендерится красная плашка «Неизвестный тип секции»,
  в production секция молча пропускается (`return null`). **Поэтому новый тип секции должен быть
  и в REGISTRY, и импортирован сверху**, иначе он не отрисуется.
- Каждый компонент секции читает свои варианты через `variantOf('<type>','<default>')` →
  `site.variation.sectionVariants[type]`. Неизвестный вариант → fallback на первый.

Вывод: чтобы сделать сайт «другим», достаточно подменить `site.json` + картинки. Код пересобирать
не нужно.

---

## 2. Как собрать `site.json` из выводов скриптов

`site.json` — это **слияние** четырёх источников. Шаги (см. также `references/pipeline.md` §1, §5):

| Блок `site.json` | Источник | Скрипт |
|---|---|---|
| `design`, `variation`, `sections_order` | дизайн+вариативность | `variation_engine.py` |
| `brand` | инференс из домена/имени | `variation_engine.py` (+ `brand-system.md`) |
| `company`, `contacts`, `schedule`, `stats` | РФ-реквизиты и контент | `ru_data.py` (→ `data/ru.json`) |
| тексты секций (`title`/`subtitle`/`body`/`items`…) | копирайтинг | по `references/copywriting.md` |
| `images` (slug → путь) | картинки и лого | `gen_images.py`, `gen_logo.py` |
| `seo`, `nav`, `cta`, `legal` | собираются вручную | — |

Порядок:

1. **`variation_engine.py`** даёт `design` (mode/palette/fonts/radius/shadow/containerMax/sectionY),
   `variation` (preloader/animation/spacing/container/heroVariant/sectionVariants) и
   `sections_order`. Это основа файла.
2. **`ru_data.py`** даёт `company/contacts/schedule/stats` — **копируются как есть** (без правок;
   `ru.json` хранится рядом для трассируемости).
3. **Копирайт** заполняет тексты каждой секции (живой РУ-текст, без слопа, **без слов
   демо/тест/placeholder** — см. `prop-site.md`).
4. **После** `gen_images`/`gen_logo` проставляются реальные пути в `images`.
5. Руками добавляются `seo`, `nav`, `cta.primary`, опц. `legal` (без дисклеймера «демо» на самом
   сайте).

### Сборка `sections[]` из `sections_order`

`sections_order` — это массив `type`-строк (порядок секций от движка). Каждый `type` нужно
развернуть в объект с обязательными `type` + `id` (якорь) и пропсами секции. Пример:

```jsonc
// sections_order: ["header","hero","trustbar","services","about","reviews","faq","contacts","footer"]
"sections": [
  { "type":"header", "id":"top" },                       // пропсы тянет из site (nav/cta/phone)
  {
    "type":"hero", "id":"hero",
    "variant": "split-left",                              // = variation.heroVariant
    "eyebrow":"Стоматология в Москве",
    "title":"Лечим так, чтобы вы возвращались только на осмотр",
    "subtitle":"Имплантация и виниры под ключевыми гарантиями…",
    "bullets":["Гарантия 3 года","Рассрочка 0%","Приём в день обращения"],
    "cta": { "label":"Записаться", "href":"#contacts" },
    "image":"hero",                                       // slug из site.images
    "stats":[{"value":"12 лет","label":"на рынке"},{"value":"8 000+","label":"пациентов"}]
  },
  { "type":"services", "id":"services", "title":"Услуги и цены",
    "items":[ { "title":"Имплантация", "desc":"…", "price_label":"от 35 000 ₽", "icon":"tooth" } ] },
  { "type":"about", "id":"about", "title":"О клинике", "image":"about",
    "body":["Абзац 1…","Абзац 2…"], "stats":[{"value":"4.9","label":"рейтинг"}], "showRequisites":true },
  { "type":"reviews", "id":"reviews", "title":"Отзывы",
    "items":[ { "author":"Анна, Москва", "rating":5, "date":"2025-03-12", "text":"…" } ],
    "aggregate":{ "rating": 4.9, "count": 240 } },
  { "type":"faq", "id":"faq", "title":"Вопросы", "items":[{"q":"…","a":"…"}] },
  { "type":"contacts", "id":"contacts", "title":"Контакты",
    "map":{ "lat":55.751, "lon":37.618, "zoom":15 } },
  { "type":"footer", "id":"footer" }
]
```

Правила: `header` — всегда первый, `footer` — последний; `id` нужен для якорной навигации
(`href="#services"` ↔ `id:"services"`); поле `image` в пропсах — это **slug** из `site.images`,
а не путь. Перечень пропсов по типам — `references/pipeline.md` §2 и `references/sections.md`.

---

## 3. Tailwind v4 токены: как палитра, шрифты и ритм попадают в CSS

Tailwind v4 настроен **без `tailwind.config.js`** — токены задаются прямо в `app/globals.css`
через `@import "tailwindcss"` и блок `@theme inline`, который мапит CSS-переменные в утилиты:

```css
@import "tailwindcss";
@theme inline {
  --color-bg: var(--c-bg);
  --color-primary: var(--c-primary);
  --color-accent: var(--c-accent);
  --font-display: var(--c-font-display);
  --font-body: var(--c-font-body);
  /* easing-кривые Emil Kowalski */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-spring: cubic-bezier(0.32, 0.72, 0, 1);
}
```

Это даёт утилиты `bg-bg`, `bg-surface`, `text-text`, `text-muted`, `bg-primary`, `text-primary-fg`,
`text-accent`, `border-border`, `font-display`, `font-body`. Радиус/тень/ритм используются как
arbitrary-значения: `rounded-[var(--radius)]`, `shadow-[var(--shadow-card)]`, `paddingBlock:
var(--section-y)`, `max-w-[var(--container-max)]`.

`globals.css` содержит и **дефолтные значения** в `:root` (на случай отсутствующих переменных),
но реальные значения **инъектирует `layout.tsx`** из `site.design`.

### Инъекция темы — `layout.tsx → themeVars()`

`themeVars()` строит строку `:root{…}` из `site.design.palette` и кладёт её в `<head>` через
`<style dangerouslySetInnerHTML>` **до** содержимого. Так из палитры рождается уникальный
компилируемый CSS на каждый сайт:

```tsx
function themeVars(): string {
  const p = site.design.palette;
  // serif-эвристика по имени шрифта дисплея
  const isSerifDisplay = /serif|garamond|playfair|cormorant|lora|merriweather/i
    .test(site.design.fonts.display.family);
  return `:root{
    --c-bg:${p.bg};--c-surface:${p.surface};--c-text:${p.text};--c-muted:${p.muted};
    --c-primary:${p.primary};--c-primary-fg:${p.primaryFg};--c-accent:${p.accent};
    --c-accent-fg:${p.accentFg || "#0B0B0C"};
    --c-border:${p.border};--c-ring:${p.ring || p.primary};
    --c-font-display:${stack(...)};--c-font-body:${stack(...)};
    --radius:${site.design.radius};--shadow-card:${site.design.shadow};
    --container-max:${d.containerMax || "72rem"};--section-y:${d.sectionY || "clamp(4rem,9vw,7rem)"};
  }`.replace(/\s+/g, " ");
}
```

Заметки: `accentFg`/`ring` имеют фолбэки; `--container-max` и `--section-y` (ширина и вертикальный
ритм) приходят из `design.containerMax`/`design.sectionY` — это часть анти-фингерпринта. Шрифтовый
`stack()` добавляет системный фолбэк (`ui-serif, Georgia, serif` или `ui-sans-serif, system-ui,
sans-serif`).

### Шрифты — `fontsHref()`

Шрифты подключаются обычным Google Fonts `<link>` (не `next/font`), семейства и веса берутся из
`site.design.fonts`:

```tsx
function fontsHref(): string {
  const fams = [site.design.fonts.display, site.design.fonts.body].map((f) => {
    const fam = f.family.trim().replace(/\s+/g, "+");           // "Cormorant Garamond" → "Cormorant+Garamond"
    const w = [...new Set(f.weights)].sort((a,b)=>a-b).join(";");
    return `family=${fam}:wght@${w}`;
  });
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`;
}
```

В `<head>` идут `preconnect` к `fonts.googleapis.com`/`fonts.gstatic.com` и стиль-линк.
**Важно:** пробелы в имени семейства должны стать `+` (это уже делает `replace(/\s+/g,"+")`),
иначе шрифт не загрузится.

### Контейнер и ритм в компонентах

- `ui/Container` → `max-w-[var(--container-max)]` + горизонтальные паддинги.
- `ui/Section` → `style={{ paddingBlock: "var(--section-y)" }}` + `scroll-mt-24` (чтобы якорь не
  заезжал под липкий header).

---

## 4. SEO / metadata / JSON-LD / robots / sitemap / noindex

Вся SEO-логика статична (вычисляется на этапе сборки) и тоже берётся из `site.json`.

**`metadata` (layout.tsx):** `metadataBase = https://<domain>`, `title`/`description`/`keywords`/
`applicationName`, OpenGraph (включая `images` из OG-картинки, `1536×1024`) и Twitter card
(`summary_large_image`). OG-картинка резолвится как
`site.images[site.seo.ogImageSlug] ?? site.images.og`.

**`robots` в metadata:** по умолчанию **noindex** — это сайт-витрина перед бэкендом:
```tsx
robots: site.seo.noindex === false ? undefined : { index: false, follow: false },
```
Индексация включается только явным `seo.noindex:false`.

**JSON-LD `LocalBusiness`** (`jsonLd()` → `<script type="application/ld+json">` в `<body>`):
собирается из `company` + `contacts` + `stats`:
- `name` = `company.legal_name || brand.name`, `url`, `telephone`, `email`, `image`;
- `address` (`PostalAddress`: street+house, city, postalCode, `addressCountry:"RU"`) из
  `company.address_actual`;
- `geo` (`GeoCoordinates`) из `contacts.map`;
- `aggregateRating` из `stats.rating`/`stats.reviews_count` (если есть).

**`app/sitemap.ts`** — одна запись (одностраничник): `url: https://<domain>`, `priority:1`.

**`app/robots.ts`** — отдаёт **обычный** `robots.txt` (`User-agent:* Allow:/`, `host`), чтобы сайт
выглядел как настоящий. Сам запрет индексации управляется **meta-тегом** (`seo.noindex`), а не
`robots.txt`.

`<html lang="ru">`, `<meta name="theme-color" content={palette.primary}>`.

---

## 5. Чистый URL (`SiteClient`) и формы без сети

**`components/ui/SiteClient.tsx`** — единственный клиентский слой (`"use client"`), монтируется
один раз в `layout` после `{children}`. Делает три вещи:

1. **Чистая навигация.** Глобальный listener перехватывает клики по `a[href^="#"]`, вызывает
   `el.scrollIntoView({behavior:"smooth"})` и **не трогает адресную строку** (никаких `#hash`,
   `pushState`). Исключения: `[data-no-scroll]`, пустой `#`, внешние/`tel:`/`mailto:` — работают
   штатно. Так внутренняя навигация скроллит, а URL остаётся чистым доменом — ключевое prop-site
   правило.
2. **Reveal-on-scroll.** `IntersectionObserver` навешивает класс `is-in` элементам
   `.ds-reveal/.ds-reveal-blur/.ds-stagger/.ds-scale` (threshold `0.12`). Благодаря этому **секции
   остаются серверными компонентами** (без хуков) — анимации включает клиентский слой.
3. **Scroll-spy.** Элементы `[data-spy="<id>"]` получают `data-active` по текущей секции
   (подсветка активного пункта меню).

**Формы** реализуются по prop-site: `preventDefault` + локальная валидация + инлайн-success
(«Заявка принята, перезвоним в течение 15 минут»). **Никаких `fetch`/`axios`/`XMLHttpRequest`/
`action`.** CTA-кнопки — это просто `href="#contacts"`, их перехватывает `SiteClient`. Подробно —
`references/prop-site.md`.

---

## 6. Карта — OpenStreetMap embed без ключа

Карта в секции `contacts` (`map: {lat, lon, zoom}`) рендерится **бесключевым iframe**
OpenStreetMap, без сторонних SDK/скриптов и без GA/Метрики:

```tsx
const { lat, lon } = data.map;
const d = 0.01; // полу-сторона bbox; меньше = ближе зум
const src =
  `https://www.openstreetmap.org/export/embed.html` +
  `?bbox=${lon-d}%2C${lat-d}%2C${lon+d}%2C${lat+d}` +
  `&layer=mapnik&marker=${lat}%2C${lon}`;
<iframe src={src} loading="lazy" className="w-full h-[360px] rounded-[var(--radius)] border-0" />
```

Координаты приходят из `contacts.map`/`ru_data.py` и должны указывать на **правильный город**
(по умолчанию Москва) — это проверяется в QA.

---

## 7. Картинки и логотип

- **Нативный `<img>`**, не `next/image` — простой статический сайт, без оптимизатора и серверных
  зависимостей (`<img src={img(...)} alt="" />`). В `globals.css`: `img { display:block;
  max-width:100% }`.
- **slug → путь** через хелпер `img(slug)` из `lib/site.ts`: возвращает `site.images[slug]`, а если
  передан уже готовый путь со `/` — отдаёт его как есть.
- **`gen_images.py`** кладёт файлы в `public/images/<slug>.<ext>` (`webp` для фото, `png` для лого
  с прозрачностью), при отсутствии ключа — **premium SVG-fallback** `<slug>.svg`. Расширение в
  `site.images` должно совпадать с реальным форматом (`.webp`/`.png`/`.svg`).
- **`images.lock.json`** — манифест результата генерации (`out-dir/images.lock.json`): модель,
  список slug→path/mode. Используется для трассируемости и повторной сборки.
- **Логотип** — рукописный **SVG** (`gen_logo.py` → `public/images/logo.svg` + `public/icon.svg`),
  не AI-картинка. В `site.images.logo` — путь к SVG.
- Размеры картинок строго `1024x1024 | 1536x1024 | 1024x1536`, один визуал = одна job
  (`references/art-direction.md`, `pipeline.md` §4).

---

## 8. Команды: полный пайплайн сборки

```bash
SK=<path-to-skill>                       # корень demosite
PROJ=<output>/<brand-slug>
PYIMG=~/.config/demosite/venv/bin/python

# 2. вариативность → design + variation + sections_order (основа site.json)
python3 $SK/scripts/variation_engine.py --domain <dom> --description "<text>" \
   --industry <slug> --name "<Бренд>" --out /tmp/<slug>.design.json

# 4. РФ-данные → company/contacts/schedule/stats
python3 $SK/scripts/ru_data.py --industry <slug> --city "Москва" --name "<Бренд>" \
   --seed <N> --team 6 --reviews 9 --services 6 --preset <preset.json> --out $PROJ/data/ru.json

# 5. картинки (А‑дир.) и логотип
$PYIMG $SK/scripts/gen_images.py --manifest images.json --out-dir $PROJ/public/images --concurrency 4
python3  $SK/scripts/gen_logo.py --name "<Бренд>" --primary <hex> --accent <hex> --seed <N> \
   --out $PROJ/public/images/logo.svg --favicon $PROJ/public/icon.svg

# 6. скаффолд проекта из templates/  → потом собрать data/site.json
bash $SK/scripts/scaffold.sh $PROJ "<Бренд>" <slug>

# 8. установка, сборка, превью
cd $PROJ && npm install && npm run build && npm run dev   # затем chrome-devtools screenshot
```

### Что делает `scaffold.sh`

Никакого `create-next-app` (интерактив/сеть) — просто **копирует выверенный каркас** из
`templates/`:
- `cp -R templates/{app,components,lib} $PROJ/` + `package.json`, `next.config.mjs`,
  `tsconfig.json`, `postcss.config.mjs`;
- создаёт `data/`, `public/images/`;
- проставляет `package.json.name = <slug>` (через `node`);
- **safety net:** если `data/site.json` ещё не положили — копирует `templates/data/site.sample.json`,
  чтобы `npm run build` не падал (свой `site.json` нужно положить поверх);
- пишет `.gitignore` и заглушку `next-env.d.ts`.

Порядок важен: сначала генераторы (картинки/лого/данные), потом `scaffold.sh`, потом собрать
`site.json`, и только затем `npm install && npm run build`. `seed` фиксируем (например из хеша
бренда) ради воспроизводимости.

---

## 9. Частые ошибки сборки и фиксы

| Симптом | Причина | Фикс |
|---|---|---|
| Секция не рендерится / красная плашка «Неизвестный тип секции» | `type` есть в `site.json`, но нет в **REGISTRY** `page.tsx` или не импортирован | Добавить импорт + запись в `REGISTRY`; в production такая секция молча пропадает |
| Шрифт не грузится / падает на пробел в имени | Имя семейства с пробелом не закодировано | Использовать точное Google-имя; `fontsHref()` кодирует пробел в `+` — не подставлять имя в обход |
| Картинка не видна / 404 | В `site.images` неверный slug или расширение не совпало с реальным файлом | Сверить путь в `public/images/<slug>.<ext>` против `images.lock.json`; помнить о `.svg`-фолбэке |
| TS-ошибка на build (strict) | Поле читается, которого нет в типе `Site`/`Section`; неверная форма пропсов | Привести `site.json` к контракту `pipeline.md` §2–3; `Section` — `[k:string]:any`, но `design/company/...` типизированы |
| `useEffect/useState is not allowed in Server Component` | Хуки в серверном компоненте секции | Анимации делать через классы `ds-*` (их включает `SiteClient`), а не локальные хуки; компоненты с хуками (`Preloader`, `Counter`, `SiteClient`) помечать `"use client"` |
| `#hash` появляется в URL при клике по меню | Якорь обходит `SiteClient` (например `target="_blank"` или внешняя ссылка трактуется как внутренняя) | Внутренние ссылки — строго `href="#id"`; внешние/служебные помечать `data-no-scroll` |
| `npm run build` падает «cannot find data/site.json» | Файл не положен и нет sample | `scaffold.sh` копирует `site.sample.json`; либо положить свой `data/site.json` до build |
| Якорь заезжает под липкий header | Нет компенсации высоты шапки | `scroll-mt-24` на `ui/Section`/секции |
| Запрещённое слово в проекте (демо/test/placeholder/…) | Слоп в тексте/alt/комментарии | `grep -rinE 'демо|demo|placeholder|пример|example|тест|заглушк|fake|mock|dummy|sample|lorem|todo' app components lib data` → 0 совпадений (см. `prop-site.md`) |
| Картинки/формы делают сетевой запрос | Остался `fetch`/`action` в форме или реальный аналитик-скрипт | Формы — `preventDefault` + инлайн-success; убрать сторонние скрипты |

---

### Кратко

`site.json` — единственный источник правды; `page.tsx`+REGISTRY рендерят секции по порядку;
`layout.tsx` инъектирует палитру/шрифты/ритм в CSS-переменные, которые Tailwind v4 (`@theme inline`)
превращает в утилиты; SEO/JSON-LD/robots статичны и по умолчанию `noindex`; `SiteClient` даёт
чистый URL и reveal-анимации; формы без сети, карта — бесключевой OSM-iframe; картинки — нативный
`<img>` по slug с `.svg`-фолбэком, лого — рукописный SVG. Менять — только данные и картинки, код
компонентов остаётся неизменным.
