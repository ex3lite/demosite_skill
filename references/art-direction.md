# art-direction.md — арт-дирекшн картинок для demosite

Этот док — правила генерации изображений для **demosite** (автономный генератор премиальных
РУ сайтов-витрин). Движок: **OpenAI `gpt-image-1.5`** через `scripts/gen_images.py`.
Базовый принцип: **одна арт-дирекшн-картинка на секцию, один визуал = одна job** в
`images.json`. Никаких коллажей «вся страница одним изображением». Адаптация под РФ/Москву и
жёсткий анти-AI-слоп — обязательны.

> Контракт манифеста (см. `references/pipeline.md` §4 и `scripts/gen_images.py`):
> верхний `palette: [bg, light, accent]` (для fallback-SVG) + массив `jobs`, где каждая job —
> `{slug, label?, size, quality, background, format, prompt}`. Модель — `gpt-image-1.5`.

---

## 1. Жёсткие правила (НЕ нарушать)

### 1.1 Размеры — ТОЛЬКО три
`gpt-image-1.5` принимает ровно три размера. Других не использовать.

| size | ориентация | когда |
|------|-----------|-------|
| `1536x1024` | альбом (дефолт) | **hero, about, services, portfolio, og** — почти всё |
| `1024x1024` | квадрат | иконочный/предметный кадр, мелкий акцент, лого-плейсхолдер |
| `1024x1536` | портрет | **фото команды (team headshots)**, вертикальный человек/интерьер |

`quality` — обычно `high` (допустимо `low|medium|high|auto`). `background` — `opaque` для фото,
`transparent` только для лого/иконок (PNG). `format` — `webp` для фото, `png` для прозрачных.

### 1.2 Один визуал = одна job
На каждую секцию — отдельная job со своим `slug` и своим промптом. Hero никогда не содержит
«всю страницу». Не склеивать несколько секций в один кадр. Не возвращать одну «лучшую» картинку
вместо набора.

### 1.3 Единая палитра на ВСЕ картинки
Палитра берётся из `site.design.palette` (вывод `variation_engine.py`). В КАЖДЫЙ промпт
явно передавай три HEX: **bg** (фон), **light/surface** (светлая поверхность), **accent**
(акцент). Формулировка-шаблон, вставляемая в конец каждого промпта:

> `strictly limited color palette: background <bg_hex>, light surfaces <light_hex>, single
> accent <accent_hex>; consistent color grade across all images; no other saturated colors`

Акцент — точечно (один-два предмета/деталь), не заливать им кадр. Сайт, пролистанный целиком,
должен читаться как один бренд: один грейд, один свет, одна тональность.

### 1.4 Никакого текста и брендинга на фото
В каждый промпт — `no text overlay, no typography, no captions, no logo, no watermark,
no signage with readable letters, no UI text`. Картинки — чистая фотооснова; заголовки и
кнопки накладывает фронтенд поверх.

### 1.5 Композиция и негативное пространство
- Варьируй композицию между секциями (не «текст слева / фото справа» каждый раз): центр,
  низ-лево, низ-право, оф-грид, image-as-canvas.
- В **hero** ОБЯЗАТЕЛЬНО оставляй спокойную зону под заголовок и CTA (негативное пространство
  слева/снизу или равномерный приглушённый участок). Формулировка:
  `composition leaves generous clean negative space on the left third (and lower area) for a
  headline and button to be overlaid later; keep that area calm and low-detail`.

---

## 2. РФ / Москва контекст (CRITICAL)

Картинки должны выглядеть как реальный московский бизнес, а не как западный сток.

- **Среда**: реалистичные московские/российские интерьеры, улицы, бизнес-центры, дворы.
  Архитектура, отделка, оборудование — узнаваемо российские/европейские, без латиноамериканских
  или азиатских уличных мотивов, без американских пригородов.
- **ЛЮДИ — славянская внешность.** Всегда писать ЯВНО, иначе генератор даёт «глобальный микс»:
  > `Slavic / Eastern European appearance, light brown or dark blonde hair (occasionally
  > auburn or light blonde), light or mixed eyes (blue, grey, green, hazel), light skin tone,
  > natural look, no heavy retouching`
- **Стиль**: одежда и груминг московских профессионалов под нишу (деловой, медицинский,
  ресторанный, спортивный). Опрятно, дорого-сдержанно, без карикатурного «русского» колорита.
- **Реализм фото**: `commercial / editorial photography, 35mm or 50mm lens, natural daylight or
  controlled studio light, shallow depth of field where appropriate, high realism`.
- **Избегать**: стоковых клише (рукопожатия в костюмах, «команда смотрит в ноутбук и смеётся»,
  большой палец вверх, гарнитуры колл-центра), пластиковой кожи, лишних пальцев, невозможной
  геометрии, оверсатурации, fantasy/surrealism.

---

## 3. Промпт-шаблоны по типам секций

Каждый шаблон собирается как: **сцена + свет/линза + люди (если есть, со славянским блоком) +
негативное пространство + палитра + `no text/logo/watermark` + анти-слоп**. Подставляй нишу и
конкретику из брифа и пресета (`data/industries.json`, поле `image_prompts`).

### hero — `1536x1024`, `high`, `opaque`, `webp`
Первый экран. Атмосферный кадр среды или человека-в-контексте с местом под заголовок.
> `Wide editorial photograph of a <ниша> environment in Moscow, Russia — <конкретика: интерьер/
> процесс/специалист за работой>. <если есть человек: Slavic appearance block>. Soft natural
> daylight, 35mm, shallow depth of field, calm premium mood. Composition leaves clean low-detail
> negative space on the left third and lower area for an overlaid headline and button. <palette
> block>. No text overlay, no logo, no watermark, no readable signage. No purple/blue AI glow,
> no floating blobs, no fake dashboards.`

Варианты hero под `heroVariant`: `bg-image` (full-bleed, тёмный/светлый тональный участок под
текст), `image-right`/`split-left` (человек/предмет смещён в одну треть, вторая треть пустая),
`centered` (симметричный кадр с воздухом сверху/снизу).

### about — `1536x1024`, `high`, `opaque`, `webp`
Офис / процесс / команда за работой (не постановочный «корпоратив»).
> `Documentary-style interior photograph of a <ниша> office/workspace in Moscow — real working
> moment, <деталь процесса>. Russian professionals, Slavic appearance, light brown / dark blonde
> hair, light eyes, Moscow business grooming, natural posture (not posing at camera). Window
> daylight, 35mm, candid editorial feel. <palette block>. No text, no logo, no watermark.
> No stock cliches, no thumbs-up, no staged handshake.`

### services — `1536x1024` (или `1024x1024` для предметного кадра), `high`, `opaque`, `webp`
Релевантный нише предмет/инструмент/результат крупно, без человека или с руками.
> `Clean close-up commercial photograph of <релевантный предмет ниши: e.g. dental instruments
> tray / legal documents and pen / chef plating a dish / construction tools on site / gym
> equipment>, on <light_hex> surface, single accent <accent_hex> detail, controlled studio
> light, 50mm macro, tactile premium materials. Generous negative space around the subject.
> <palette block>. No text, no logo, no watermark. No clutter, no AI gloss, no neon.`

### portfolio — `1536x1024`, `high`, `opaque`, `webp`
Результат работы / кейс / до-после.
> `Editorial photograph showing the result of <ниша> work in Moscow — <готовый объект/интерьер/
> результат>. Clean realistic framing, daylight or warm interior light, 35mm. If people present:
> Slavic appearance, natural look. <palette block>. No text, no logo, no watermark, no before/
> after labels baked in. No fake UI, no blobs.`
Для «до/после»: генерируй ДВА job-слага (`portfolio-before`, `portfolio-after`) с одинаковым
светом/ракурсом; подписи «До»/«После» рисует фронтенд.

### team — `1024x1536` (ПОРТРЕТ), `high`, `opaque`, `webp`
Нейтральный studio headshot. Главное — **единый свет и фон у всех членов команды**, чтобы
сетка выглядела как один съёмочный день.
> `Studio headshot portrait of a Russian <профессия> in their <возраст>s, Slavic appearance,
> light brown / dark blonde hair, light eyes, professional Moscow business attire for <ниша>.
> Neutral seamless background in <light_hex> (или приглушённый <bg_hex>), identical soft studio
> key light and framing as the rest of the team, calm confident expression, 85mm portrait lens,
> shallow depth of field. <palette block>. No text, no logo, no watermark.`
Повторяй ОДИН и тот же фон/свет/линзу/кадрирование для каждого участника, меняя только человека
и профессию. Один член команды = одна job (`team-1`, `team-2`, …).

### og — `1536x1024`, `high`, `opaque`, `webp`
Соц-превью (Open Graph). Атмосферный брендовый кадр ниши без текста — текст добавит OG-рендер.
> `Premium brand cover photograph for a <ниша> business in Moscow, atmospheric and recognizable
> at small size, strong focal subject in the center-right, calm space top-left. <palette block>.
> No text, no logo, no watermark. No AI glow, no blobs.`

---

## 4. Готовые РУ-бизнес примеры (5 ниш)

### 4.1 Стоматология (`dental`) — палитра bg `#FBFAF7`, light `#FFFFFF`, accent `#C8A24B`
- **hero**: `Wide interior photo of a modern premium dental clinic in Moscow, Russian female
  dentist with light brown hair and Slavic features focused on her work, soft daylight through
  large windows, white and warm-beige tones, real dental equipment in soft background. Clean
  negative space on the left for an overlaid headline. Palette: bg #FBFAF7, light #FFFFFF,
  accent #C8A24B. No text, no logo, no watermark, no purple glow.`
- **services**: `Close-up of a sterile dental instrument tray on a white surface, single warm
  gold accent, soft studio light, 50mm macro, lots of negative space. Palette ... No text/logo.`
- **team** (`1024x1536`): `Studio headshot of a Russian dentist in his 40s, Slavic appearance,
  dark blonde hair, light eyes, white medical coat, neutral light-grey seamless background,
  identical soft key light for whole team, 85mm. No text/logo.`

### 4.2 Юридическая фирма (`law`) — bg `#0F1115`, light `#F4F1EA`, accent `#B08D4C` (dark mode)
- **hero**: `Editorial photo of a calm premium law office in a Moscow business center, floor-to-
  ceiling windows with city view, a Russian lawyer (Slavic appearance, dark blonde hair, light
  eyes, tailored suit) standing thoughtfully. Low-key cinematic daylight, deep negative space
  on the lower-left for headline. Palette: bg #0F1115, light #F4F1EA, accent #B08D4C. No text/
  logo/watermark, no stock handshake.`
- **about**: `Documentary shot of two Russian legal professionals, Slavic appearance, reviewing
  documents at a wooden table in a Moscow office, candid working moment, window light. Palette ...`

### 4.3 Ресторан — блюдо (`restaurant`) — bg `#15110D`, light `#EFE7DA`, accent `#C2562F`
- **portfolio/services (блюдо)**: `Top-down food photograph of a refined plated dish at a Moscow
  restaurant, natural window light, dark textured table, single warm accent garnish, 50mm, rich
  appetizing color grade. Generous negative space. Palette: bg #15110D, light #EFE7DA, accent
  #C2562F. No text/logo/watermark.`
- **hero**: `Atmospheric interior of a premium Moscow restaurant at golden hour, warm low light,
  set table in focus on the right, calm dark space on the left for an overlaid headline. Palette ...`

### 4.4 Строительство / ремонт (`construction`) — bg `#101417`, light `#E9ECEF`, accent `#E0A21A`
- **hero**: `Documentary photo of a residential building site in Moscow, Russian workers with
  Slavic appearance in safety vests and helmets, crane and scaffolding, clear daylight, realistic
  construction photography. Open sky as negative space for headline. Palette: bg #101417, light
  #E9ECEF, accent #E0A21A. No text/logo/watermark.`
- **portfolio (до/после)**: два job — `before`: `unfinished apartment interior, bare walls,
  neutral light`; `after`: `same room renovated, finished premium interior, identical camera
  angle and light`. Подписи рисует фронтенд.

### 4.5 Фитнес-студия (`fitness`) — bg `#0E0F12`, light `#EDEFF2`, accent `#7DD957`
- **about**: `Russian female fitness trainer, Slavic features, light eyes, athletic build,
  guiding a client through an exercise in a modern Moscow gym, natural side light, motivational
  but calm mood, 35mm. Palette: bg #0E0F12, light #EDEFF2, accent #7DD957. No text/logo.`
- **hero**: `Wide shot of a premium minimalist Moscow gym at morning light, single athlete
  (Slavic appearance) mid-movement on the right, lots of clean dark space on the left for
  headline. Palette ... No text/logo/watermark, no neon glow.`

---

## 5. Маппинг промпта → job для `images.json`

Каждый промпт оборачивается в job по контракту `gen_images.py` (поля:
`slug, size, quality, background, format, prompt`; `label` опционально). Верхний `palette` —
`[bg, light, accent]` для fallback-SVG. Пример полного манифеста под лендинг стоматологии:

```jsonc
{
  "palette": ["#FBFAF7", "#FFFFFF", "#C8A24B"],
  "jobs": [
    { "slug": "hero",    "label": "Hero",    "size": "1536x1024", "quality": "high",
      "background": "opaque", "format": "webp",
      "prompt": "Wide interior photo of a modern premium dental clinic in Moscow ... left negative space ... Palette: bg #FBFAF7, light #FFFFFF, accent #C8A24B. No text, no logo, no watermark." },
    { "slug": "about",   "label": "About",   "size": "1536x1024", "quality": "high",
      "background": "opaque", "format": "webp",
      "prompt": "Documentary interior of the clinic, Russian staff, Slavic appearance ..." },
    { "slug": "services","label": "Services","size": "1536x1024", "quality": "high",
      "background": "opaque", "format": "webp",
      "prompt": "Close-up sterile dental instrument tray, single gold accent ..." },
    { "slug": "team-1",  "label": "Team 1",  "size": "1024x1536", "quality": "high",
      "background": "opaque", "format": "webp",
      "prompt": "Studio headshot, Russian dentist, Slavic appearance, neutral background, identical studio light ..." },
    { "slug": "og",      "label": "OG",      "size": "1536x1024", "quality": "high",
      "background": "opaque", "format": "webp",
      "prompt": "Premium brand cover photo of a Moscow dental clinic ..." }
  ]
}
```

Правила маппинга:
- **slug** — латиница-kebab, совпадает с ключом в `site.images` (`hero → /images/hero.webp`).
- **size** — по таблице §1.1: hero/about/services/portfolio/og → `1536x1024`; team → `1024x1536`;
  предметный/иконочный кадр → `1024x1024`.
- **quality** — `high` по умолчанию.
- **background** — `opaque` для всех фото; `transparent` только для прозрачных PNG.
- **format** — `webp` для фото; `png` для прозрачных.
- **prompt** — собранный по §3 шаблон с подставленной палитрой и анти-слоп хвостом.
- Лого в `images.json` НЕ генерируем здесь — это рукописный SVG (`scripts/gen_logo.py`,
  см. `references/brand-system.md`).

После генерации `gen_images.py` кладёт файлы в `public/images/`; реальные пути проставляются в
`site.images` (расширение зависит от `format`; при отсутствии ключа — премиальный fallback-SVG
с брендовым градиентом, и путь становится `.svg`). Один визуал = одна job: количество jobs =
числу секций, которым нужна картинка.

---

## 6. Анти-AI-слоп (обязательный хвост каждого промпта)

Добавляй в конец каждого промпта блок запретов, чтобы давить типовые AI-дефолты:

> `No purple/blue AI gradient glow, no neon edges, no glowing halos. No floating spheres or
> abstract blobs. No fake dashboards, charts, or UI panels. No gradient text. No stock-photo
> cliches (thumbs-up, staged handshake, call-center headsets, team laughing at a laptop).
> No plastic skin, no extra fingers, no impossible geometry, no oversaturation. Realistic,
> editorial, implementation-friendly.`

Дополнительно проверяй на выходе:
- единая палитра и грейд на всех картинках (передан bg/light/accent);
- нет встроенного текста/логотипов/вотермарков;
- люди — славянская внешность, контекст Москвы/РФ;
- композиция варьируется, в hero есть негативное пространство под заголовок;
- размеры строго из набора `1024x1024 | 1536x1024 | 1024x1536`;
- одна секция = одна job, число jobs = числу секций с картинками.
