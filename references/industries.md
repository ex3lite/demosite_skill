# industries.md — пресеты ниш

Человекочитаемый гайд к `data/industries.json` — каталогу пресетов ниш для скилла demosite
(автономный генератор РУ сайтов-витрин). Сам JSON генерируется отдельным шагом; здесь объясняется
**схема пресета**, **как матчить бриф к нише**, **как пресет втекает в `ru_data.py --preset`** и
**как `industry` влияет на `variation_engine.py`**. Это слой смысла поверх анти-фингерпринта:
`variation_engine` отвечает за «как сайт выглядит и из чего собран», пресет ниши — за «о чём он».

Связанные доки: `references/pipeline.md` (контракт `site.json`, каталог секций, разделы 2 и 7),
`references/copywriting.md` (тексты), `references/art-direction.md` (картинки).

---

## 1. Что такое пресет ниши

Пресет — это **смысловой шаблон отрасли**: словарь для матчинга, тон, отобранный набор секций,
подсказка по палитре/шрифтам и заготовки контента (услуги, роли в команде, отзывы, арт-сиды).
Он НЕ задаёт жёсткий дизайн — конкретные палитру/шрифты/радиус/варианты секций детерминированно
выбирает `variation_engine.py` по домену. Пресет даёт ему **vibe-направление** (через `industry`)
и кормит `ru_data.py` правдоподобным РУ-контентом (через `--preset`).

Слаги ниш (13): `dental`, `clinic`, `restaurant`, `law`, `construction`, `beauty`, `autoservice`,
`logistics`, `realestate`, `fitness`, `education`, `b2b`, `ecommerce`. Эти же слаги — допустимые
значения `--industry` в `variation_engine.py` и `ru_data.py` (всё прочее падает на `generic`).

---

## 2. Схема пресета

```jsonc
{
  "label": "Стоматология",                 // РУ-название ниши (для объявления вслух / логов)
  "ru_keywords": ["стоматология","зубной", // словарь для матчинга брифа → пресет
                  "имплантация","виниры"],
  "tone": "забота + клиническая экспертиза, без давления",  // 1 фраза tone of voice
  "sections": [                            // упорядоченный ПОДНАБОР каталога секций
    "header","hero","trustbar","services","features",
    "about","process","team","reviews","faq","cta","contacts","footer"
  ],
  "palette_hint": {                        // ПОДСКАЗКА (не приказ) движку вариативности
    "mode": "light", "primary": "#0E5C8A", "accent": "#19B5A8", "bg": "#F7F9FB"
  },
  "fonts_hint": { "display": "Cormorant Garamond", "body": "Inter" },  // пара с кириллицей
  "service_items": [                       // ровно 6 — уходят в ru_data.py
    { "title": "Имплантация под ключ", "desc": "Импланты с гарантией, КТ-планирование.",
      "price_range": [25000, 60000], "icon": "tooth" }
  ],
  "roles": [                               // ровно 6 — должности для секции team
    "Главный врач","Стоматолог-ортопед","Хирург-имплантолог",
    "Стоматолог-терапевт","Гигиенист","Администратор"
  ],
  "review_snippets": [                     // ровно 6 — живые РУ-отзывы для секции reviews
    "Поставили имплант без боли, всё объяснили заранее. Прихожу теперь всей семьёй."
  ],
  "image_prompts": {                       // короткие EN арт-сиды (Slavic people, Moscow, no text)
    "hero": "modern dental clinic interior, soft daylight, Slavic dentist, no text",
    "about": "...", "service": "...", "portfolio": "..."
  }
}
```

Поля по назначению:

| Поле | Назначение | Куда уходит |
|------|-----------|-------------|
| `label` | человекочитаемое имя ниши | объявление вслух, `_meta` |
| `ru_keywords` | словарь матчинга брифа → пресет | шаг инференса (см. §3) |
| `tone` | tone of voice одной фразой | вход для копирайтинга |
| `sections` | упорядоченный поднабор секций под нишу | приоритет середины (см. §4) |
| `palette_hint{mode,primary,accent,bg}` | пожелание по цвету | `variation_engine --mode/--primary/--accent` |
| `fonts_hint{display,body}` | пара шрифтов с кириллицей | подсказка/референс |
| `service_items[6]{title,desc,price_range,icon}` | заготовки услуг | `ru_data.py --preset` |
| `roles[6]` | должности команды | `ru_data.py --preset` |
| `review_snippets[6]` | тексты отзывов | `ru_data.py --preset` |
| `image_prompts{hero,about,service,portfolio}` | арт-сиды | вход для `images.json` |

**Контракты схемы:** `sections` — `header` первый, `footer` последний, 10-13 секций; не у всех
ниш есть `portfolio`/`pricing`/`team`. `service_items`, `roles`, `review_snippets` — ровно по 6.
Иконки — только из набора `Icon` (Lucide-сабсет): `check, shield, award, star, clock, phone, mail,
mapPin, users, briefcase, heart, sparkle, zap, truck, leaf, scissors, wrench, home, tooth,
graduation, dumbbell, camera, building`. `price_range` — реалистичный диапазон в ₽ под нишу.
Никакого слопа в РУ-текстах и никаких слов демо/тест/заглушка (см. §6 pipeline.md).

> `price_range` — это границы, а не финальная цена. `ru_data.py` (`make_services`) детерминированно
> по seed выбирает значение внутри `[lo, hi]`, округляет до сотен и форматирует как `от 25 000 ₽`.

---

## 3. Как матчить бриф к пресету (по `ru_keywords`)

Вход скилла — **домен + описание** (раздел 7.1 pipeline.md). На шаге инференса (шаг 1 SKILL.md):

1. Нормализуй описание + домен в нижний регистр.
2. Для каждого пресета посчитай число совпадений `ru_keywords` в тексте.
3. Победитель — пресет с максимумом совпадений; его слаг = `--industry`.
4. Тай-брейк / пусто → `generic` (движок и `ru_data.py` корректно его принимают).
5. Если описание явно называет нишу («стоматология премиум») — матч тривиален; если намёк
   косвенный («ставим импланты в Москве») — вытягивает именно словарь `ru_keywords`.

Примеры: `dental-lux.ru — премиальная стоматология` → `dental`; `mebel-na-zakaz.ru — корпусная
мебель` → ближе к `construction`/`ecommerce` по ключам; `legal-partners.ru — арбитраж и налоги`
→ `law`. Слаг ниши затем един для всего пайплайна (одно решение, без переспросов).

---

## 4. Как пресет влияет на `variation_engine.py`

`industry` — единственный смысловой вход движка; всё остальное он берёт из домена/seed.

**(а) vibe-теги палитры.** Слаг ниши → набор vibe-тегов (`vibe_map` в `variation_engine.py`):

| industry | vibe-теги |
|----------|-----------|
| dental | clinic, calm, trust |
| clinic | clinic, trust, calm |
| restaurant | food, warm, craft |
| law | law, luxury, trust |
| construction | build, industrial, strong |
| beauty | beauty, soft, wellness |
| autoservice | auto, industrial, strong |
| logistics | logistics, trust, b2b |
| realestate | realestate, premium, calm |
| fitness | fitness, sport, energy |
| education | education, trust, calm |
| b2b | b2b, tech, trust |
| ecommerce | tech, trust, premium |
| generic | trust, tech, calm |

Движок фильтрует пул `PALETTES` по этим тегам и из подходящих кандидатов детерминированно по seed
выбирает одну палитру. Поэтому `dental` всегда тяготеет к светлому clinical + teal/navy, `law` —
к navy/burgundy + gold, `restaurant` — к тёплому тёмному + терракота. `palette_hint` из пресета —
это пожелание: при необходимости передавай его как `--mode/--primary/--accent`, и движок жёстко
перезапишет `primary`/`accent`/`ring`; без флагов он выбирает сам в рамках vibe-фильтра.

**(б) порядок и состав середины.** Слаг ниши → `INDUSTRY_MIDDLE[industry]` — дефолтный приоритет
средних секций. Каркас фиксирован: `CORE_OPENING = [header, hero, trustbar]`,
`CORE_CLOSING = [faq, cta, contacts, footer]`; середина берётся из `INDUSTRY_MIDDLE` и затем:

- с шансом ~0.5 меняются местами две соседние средние секции (логика сохраняется);
- с шансом ~0.4 выбрасывается один опциональный блок из `{portfolio, pricing, team, process}`;
- итог дедуплицируется с сохранением порядка → `sections_order`.

Дефолтные середины (из `INDUSTRY_MIDDLE`):

| industry | середина по умолчанию |
|----------|----------------------|
| dental | services, features, about, process, team, reviews, pricing |
| clinic | services, features, about, team, process, reviews |
| restaurant | services, about, portfolio, features, reviews |
| law | services, about, process, features, team, reviews |
| construction | services, portfolio, process, about, features, reviews |
| beauty | services, portfolio, about, team, pricing, reviews |
| autoservice | services, features, process, about, pricing, reviews |
| logistics | services, features, process, about, reviews |
| realestate | services, portfolio, about, process, reviews |
| fitness | services, features, about, pricing, team, reviews |
| education | services, features, process, about, reviews, pricing |
| b2b | services, features, about, process, reviews |
| ecommerce | services, portfolio, features, about, reviews |
| generic | services, features, about, process, reviews |

Поле `sections` в пресете и `INDUSTRY_MIDDLE` должны быть согласованы по духу (одни и те же блоки
включены/выключены). Сейчас приоритет середины «зашит» в движок по слагу; `sections` из пресета —
это человекочитаемая декларация того же набора. Если расширяешь пресет новой нишей — добавь её и в
`INDUSTRY_MIDDLE` (см. §6).

> `variation_engine` дополнительно выбирает по seed `heroVariant` и `sectionVariants` для КАЖДОГО
> типа из раздела 7.7 pipeline.md (hero: split-left|split-right|bg-image|centered и т.д.). Ниша на
> это не влияет — это чистый анти-фингерпринт. Детали — `references/anti-fingerprint.md`.

---

## 5. Как пресет передаётся в `ru_data.py` (через `--preset`)

`variation_engine` отвечает за форму, `ru_data.py` — за содержание (валидные реквизиты + контент).
Из пресета берутся ровно три поля: `roles`, `service_items`, `review_snippets`. Сохрани их в
отдельный JSON и передай флагом `--preset`:

```bash
# preset.json — подмножество пресета ниши
{ "roles": [...6...], "service_items": [...6...], "review_snippets": [...6...] }

python3 scripts/ru_data.py --industry dental --city "Москва" --name "Дентал-Люкс" \
   --seed <seed> --team 6 --reviews 9 --services 6 --preset preset.json --out <proj>/data/ru.json
```

Что делает `ru_data.py` с этими полями (по факту кода):

- **`service_items`** → `make_services`: для каждого пункта берёт `price_range [lo, hi]`,
  детерминированно по seed выбирает цену внутри диапазона, округляет до сотен и форматирует
  `price_label` (`"от 25 000 ₽"`); переносит `title`, `desc`, `icon`. Обрезается до `--services`
  (передавай 6, чтобы совпадало). Без пресета — генерит безликие «Услуга N».
- **`roles`** → `make_team`: роли распределяются по членам команды по кругу (`roles[i % len]`).
  Без ролей — берёт generic-должности (`POSITIONS_GENERIC`).
- **`review_snippets`** → `make_reviews`: тексты идут по кругу (`pool[i % len]`), к ним
  пришиваются вымышленные автор, рейтинг (с перевесом на 5), дата, аватар-слаг. Без сниппетов —
  встроенный generic-пул отзывов.

Остальной контент (`company` с валидными ИНН/ОГРН/счетами, `contacts`, `schedule`, `stats`) от
пресета не зависит — он привязан к городу и seed. Город по умолчанию — **Москва** (раздел 7.4
pipeline.md). Проверка генератора: `python3 scripts/ru_data.py --selftest`.

`label`, `tone`, `image_prompts` в `ru_data.py` НЕ уходят — это вход для копирайтинга и для сборки
`images.json` соответственно (см. art-direction.md). `palette_hint`/`fonts_hint` — вход для
`variation_engine` (флаги) либо референс.

---

## 6. Каталог ниш (13) — позиционирование одной строкой

- **dental** — стоматология: имплантация, виниры, гигиена; забота + клиническая экспертиза, без давления.
- **clinic** — многопрофильная клиника/медцентр: приём, диагностика, анализы; доверие и доказательность.
- **restaurant** — ресторан/кафе: кухня, атмосфера, бронь столика; вкус + атмосфера, без пафоса.
- **law** — юрфирма/адвокаты: арбитраж, налоги, сделки; надёжность и факты, навигация по риску.
- **construction** — строительство/ремонт под ключ: дома, отделка, сроки; конкретика + сроки + портфолио.
- **beauty** — салон красоты/SPA: уход, бровист, маникюр; эстетика и забота о себе.
- **autoservice** — автосервис/СТО: ремонт, ТО, диагностика; честная диагностика + гарантия на работу.
- **logistics** — логистика/грузоперевозки: доставка, склад, ВЭД; сроки, трекинг, надёжность (b2b-тон).
- **realestate** — недвижимость/агентство: продажа, аренда, новостройки; премиальный спокойный тон, сделки без рисков.
- **fitness** — фитнес/студия: тренировки, абонементы, тренер; энергия и результат, спортивный драйв.
- **education** — образование/курсы/школа: программы, преподаватели, результат; доверие + измеримый прогресс.
- **b2b** — услуги/SaaS для бизнеса: внедрение, поддержка, интеграции; выгода и цифры, технологичность.
- **ecommerce** — интернет-магазин/витрина товаров: каталог, доставка, гарантия; ассортимент и удобство покупки.

Для каждой ниши пресет несёт согласованный набор: `sections` (например, у `restaurant`/
`construction`/`beauty` есть `portfolio`; у `dental`/`fitness`/`education` есть `pricing` и `team`;
у `logistics`/`b2b` обычно нет `portfolio`/`team`), палитру и шрифты под характер ниши, шесть
услуг с реалистичными ценами, шесть профильных ролей, шесть живых отзывов и четыре арт-сида.

---

## 7. Как расширять пресеты

1. **Добавить новую нишу.** Дай слаг (latin-kebab), заполни весь блок схемы (§2) c контрактами
   (10-13 секций, по 6 в `service_items`/`roles`/`review_snippets`, иконки из набора, цены в ₽).
   Затем синхронизируй два места в `scripts/variation_engine.py`: добавь слаг в `vibe_map`
   (vibe-теги, что есть среди тегов `PALETTES`, иначе фильтр упадёт на весь пул) и в
   `INDUSTRY_MIDDLE` (порядок середины). Без этих двух правок ниша молча обработается как `generic`.
2. **Уточнить существующую.** Меняй `service_items`/`roles`/`review_snippets`/`image_prompts` —
   это сразу отражается в `ru_data.py --preset` и в `images.json`, код компонентов не трогается.
3. **Поправить вайб.** Меняй `palette_hint`/`fonts_hint` (как референс/флаги движка) и/или
   vibe-теги ниши в `variation_engine`, чтобы сместить семейство палитр.
4. **Чек после правки.** Прогони `variation_engine.py --industry <slug>` на нескольких доменах —
   убедись, что палитра берётся из нужного семейства и `sections_order` валиден; прогони
   `ru_data.py --industry <slug> --preset preset.json --selftest`-сценарий на контент.
5. **Дисциплина анти-слопа и prop-site.** Никаких штампов (революционный/инновационный/бесшовный/
   под ключ-штамп) и слов демо/тест/заглушка ни в одном поле пресета — они дословно попадают на сайт.

> Пресет — это «что говорим» (контент + вайб-направление). «Как именно выглядит и из чего собран
> DOM/CSS» решает `variation_engine` по домену. Разделение даёт и узнаваемость ниши, и
> непохожесть сайтов одной ниши друг на друга.
