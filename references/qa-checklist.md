# qa-checklist.md — самопроверка сайта через chrome-devtools MCP

Финальный гейт пайплайна (ШАГ 8 в `SKILL.md`). Сайт уже собран и запущен
(`cd <project> && npm install && npm run build && npm run dev`). Цель проверки — убедиться, что
сайт **выглядит как живой бизнес**, технически чист и **не палится как бутафория/шаблон**.
Проверяем в реальном браузере через `chrome-devtools` MCP, а не «на глаз по коду».

Шесть блоков + fix-loop:
1. Запуск и скриншоты (desktop/mobile) · 2. Консоль и Lighthouse ·
3. Визуальный чек · 4. **PROP-SITE чек (критично)** · 5. Контент/реквизиты ·
6. Анти-фингерпринт · 7. FIX-LOOP.

> Запрещённые слова (банлист prop-site) — единый источник для grep ниже:
> `демо|demo|placeholder|пример|example|тест|тестовый|заглушка|fake|mock|dummy|sample|lorem|todo|fixme`

---

## 0. Предусловия

- Dev-сервер поднят. `npm run dev` (скрипт `next dev`) слушает по умолчанию **http://localhost:3000**.
  Если порт занят — Next возьмёт `:3001` и т.д.; зафиксируй фактический URL из вывода.
- Браузер с `chrome-devtools` MCP доступен.
- Под рукой путь проекта `$PROJ` и его `data/site.json` (единственный источник правды — правки сюда).

---

## 1. Запуск, открытие, скриншоты desktop + mobile

Базовая последовательность вызовов chrome-devtools:

```
# открыть вкладку и перейти на сайт
new_page                       url="http://localhost:3000"
# (если уже есть вкладка) navigate_page url="http://localhost:3000"

# дать прелоадеру скрыться и reveal-анимациям отработать
wait_for                       text="<видимый H1 hero, напр. часть заголовка>"

# DESKTOP 1280
resize_page                    width=1280 height=900
take_screenshot                format="png" fullPage=true   # → desktop-full.png

# MOBILE 390 (iPhone-класс)
resize_page                    width=390  height=844
take_screenshot                format="png" fullPage=true   # → mobile-full.png
```

Дополнительно сделай **скриншот только первого экрана** на desktop (`fullPage=false`) — на нём
визуально проверяется, что hero + CTA попадают в первый вьюпорт без скролла.

Прелоадер: компонент `ui/Preloader` скрывается через ~**350 мс** после загрузки (fallback 2600 мс),
выставляя на `.ds-preloader` атрибут `data-hidden="true"`. Поэтому перед скриншотом всегда `wait_for`
по тексту hero — иначе поймаешь экран загрузки. Можно проверить факт скрытия скриптом:

```
evaluate_script  function="() => document.querySelector('.ds-preloader')?.getAttribute('data-hidden')"
# ожидаем "true"
```

---

## 2. Консоль без ошибок (+ опциональный Lighthouse)

```
list_console_messages          # ожидаем 0 error/warning от нашего кода
```

Допустимо игнорировать чисто внешний шум (расширения браузера). **Не должно быть**: ошибок
гидратации React, 404 по картинкам (`/images/...`), `Failed to load resource`, исключений в `SiteClient`.

Опционально — аудит качества:

```
lighthouse_audit  categories=["performance","accessibility","best-practices","seo"]
```

Ориентиры: a11y ≥ 90, best-practices ≥ 90. Низкий a11y обычно = плохой контраст, нет `alt` у
смысловых картинок, нет фокус-колец — это пересекается с блоком 3.

> Сайт-витрина по умолчанию **noindex** (`layout.tsx`: `robots: { index:false, follow:false }`,
> переопределяется `site.seo.noindex=false`). Поэтому низкий SEO-скор из-за «not indexable» —
> ожидаемое поведение, не баг.

---

## 3. Визуальный чек (по скриншотам desktop/mobile)

Пройди по списку, глядя на скриншоты из блока 1:

- [ ] **Hero читаем, CTA в первом экране.** H1 не обрезан, контрастен; основная CTA-кнопка
      («Записаться»/«Оставить заявку») видна без скролла на desktop и mobile.
- [ ] **Единая палитра.** Один акцент, согласованные `bg/surface/text/primary/accent`; нет
      инородных цветов вне токенов из `site.design.palette`.
- [ ] **Картинки загрузились.** Hero/about/services/portfolio/team — реальные изображения или
      premium-SVG-fallback; нет битых рамок и «alt-текста вместо картинки».
- [ ] **Ритм и воздух.** Секции имеют дыхание (`--section-y`), не слипаются; контейнер по центру
      (`--container-max`); чередование плотных/воздушных секций.
- [ ] **Иконки — SVG, не эмодзи.** Все иконки из `ui/Icon` (Lucide-набор). Эмодзи в UI = провал.
- [ ] **Preloader скрылся** и не висит поверх контента.
- [ ] **Анимации появления** отработали (reveal/stagger): после `wait_for` контент видим, не
      «застрял» с `opacity:0`.

### Горизонтальный скролл — отдельно и строго (375/768/1280)

`body` имеет `overflow-x:hidden`, но это маскирует, а не лечит переполнение. Проверь честно
шириной документа на трёх брейкпоинтах:

```
resize_page  width=375  height=812
evaluate_script function="() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })"
# ожидаем sw <= cw (+1px допуск). Повторить для 768x1024 и 1280x900.
```

Любой `scrollWidth > clientWidth` — найди виновную секцию (широкое изображение, фикс-ширина,
длинная строка без переноса) и почини в `data/site.json`/пропсах.

### Hover, фокус, контраст

- [ ] **Hover.** На устройстве с `hover:hover` карточки с `ds-hover-lift` поднимаются на −4px без
      «дёргания» layout (только `transform`). Проверка наведением:
      ```
      hover  uid=<uid карточки из take_snapshot>
      take_screenshot
      ```
- [ ] **Фокус-кольца.** Tab по интерактивам даёт видимое кольцо
      (`:focus-visible { outline: 2px solid var(--color-ring) }`):
      ```
      take_snapshot                      # получить uid первого интерактива
      click uid=<body/верх страницы>     # снять фокус
      press_key  key="Tab"
      take_screenshot                    # должно быть видно outline
      ```
- [ ] **Контраст ≥ 4.5:1** для текста (особенно `muted`-текст на `bg`, текст на `accent`).
      Подтверждается Lighthouse a11y; спорные места — проверь руками по hex из палитры.

### reduced-motion

При `prefers-reduced-motion: reduce` остаётся `opacity:1`, движения/`ds-float`/`ds-marquee`
отключаются (см. `globals.css`). Проверка эмуляцией:

```
emulate  features=[{name:"prefers-reduced-motion", value:"reduce"}]
navigate_page url="http://localhost:3000"
take_screenshot      # контент сразу видим, без анимаций появления
```

---

## 4. PROP-SITE чек (КРИТИЧНО)

Самый важный блок: тут сайт либо проходит за настоящий бизнес, либо палится. Любой провал = блокер.

### 4.1 Запрещённые слова — 0 совпадений (в проекте И в отрендеренном HTML)

В исходниках вывода (данные/тексты, без `node_modules`/`.next`):

```
grep -rniE 'демо|demo|placeholder|пример|example|тест|тестовый|заглушка|fake|mock|dummy|sample|lorem|todo|fixme' \
  "$PROJ/data" "$PROJ/app" "$PROJ/components" "$PROJ/public" \
  --include='*.json' --include='*.tsx' --include='*.ts' --include='*.css' --include='*.svg'
# ожидаем: пусто (0 строк)
```

И — обязательно — в **реально отрендеренном** DOM (ловит слова, попавшие из данных в текст):

```
evaluate_script function="() => { const re=/демо|demo|placeholder|пример|example|тест|тестов|заглушка|fake|mock|dummy|sample|lorem|todo|fixme/i; const hit=[...document.querySelectorAll('body *')].map(n=>n.textContent||'').find(t=>re.test(t)); return hit?hit.slice(0,120):'CLEAN'; }"
# ожидаем "CLEAN"
```

> Дисклеймера «сайт демонстрационный» на самой странице быть НЕ должно (см. pipeline.md 7.3:
> «НИКАКОГО дисклеймера демо на сайте»). Если он просочился в footer — удалить.

### 4.2 Чистый URL при кликах по меню (без #hash)

`SiteClient` перехватывает клики по `a[href^="#"]`, плавно скроллит и **не меняет адресную строку**
(`[data-no-scroll]`, `tel:`, `mailto:`, внешние — не трогает).

```
take_snapshot                              # найти uid пункта меню (напр. «Услуги»)
click  uid=<uid пункта меню>
evaluate_script function="() => location.href"
# ожидаем ровно "http://localhost:3000/" — БЕЗ #services
evaluate_script function="() => Math.round(window.scrollY)"
# ожидаем > 0 — скролл к секции произошёл
```

Проверь так 2–3 пункта меню. Любой `#hash` или смена пути (саб-роут) — провал.

### 4.3 Формы без сети — инлайн-success

Формы должны делать `preventDefault` + локальную валидацию + инлайн-успех («Заявка принята,
перезвоним в течение 15 минут»). **Никаких** `fetch`/`axios`/`XMLHttpRequest`/`action`.

Статически:

```
grep -rniE 'fetch\(|axios|XMLHttpRequest|<form[^>]*action=' "$PROJ/components" "$PROJ/app"
# ожидаем: пусто
```

Динамически — отправь форму и убедись, что нет сетевого запроса:

```
list_network_requests                      # снимок «до»
fill_form    elements=[{uid:<имя>,value:"Иван"},{uid:<телефон>,value:"+7 999 123-45-67"}]
click        uid=<кнопка отправки>
wait_for     text="перезвоним"             # инлайн-success появился
list_network_requests                      # «после»: НЕТ новых POST/XHR к бэкенду
```

### 4.4 Нет реальных сторонних скриптов

Ни аналитики, ни внешних чатов. Декоративный чат-бабл (без логики) допустим.

```
grep -rniE 'mc\.yandex|metrika|googletagmanager|gtag|google-analytics|jivo|tawk\.to|carrotquest|bitrix' \
  "$PROJ/app" "$PROJ/components" "$PROJ/public"
# ожидаем: пусто
list_network_requests   # в рантайме — только localhost и (опц.) OpenStreetMap-тайлы карты
```

---

## 5. Контент-чек: реквизиты, контакты, карта

- [ ] **Реквизиты валидны.** Прогнать селф-тест генератора (контрольные суммы ИНН/ОГРН/КПП/р-с):
      ```
      python3 scripts/ru_data.py --selftest
      # последняя строка: «ВСЕ ТЕСТЫ ПРОЙДЕНЫ ✓», exit 0
      ```
      Это валидирует алгоритмы; конкретные значения сайта берутся из того же генератора в `data/ru.json`.
- [ ] **Реквизиты на месте.** В секции `contacts`/`footer` присутствуют название/legalName, ИНН,
      ОГРН, адрес, телефон (`tel:`), e-mail (`mailto:`), график работы — не пустые.
- [ ] **Телефоны/адреса/цены заполнены.** Прайс в `services`/`pricing` — конкретные суммы, не «—».
- [ ] **Карта указывает на правильный город.** В `contacts` встроена OpenStreetMap-карта (без ключа)
      с координатами города из `--city` (по умолчанию **Москва**). Сверь, что центр карты и текстовый
      адрес — один город:
      ```
      take_screenshot   # секция контактов: карта показывает нужный город
      ```

---

## 6. Анти-фингерпринт: два домена → разные сайты

Сайты не должны иметь общий детектируемый паттерн. Источник энтропии — `variation_engine.py`
(детерминированно по домену/seed: палитра/режим/шрифты/радиус/тень/ширина/ритм + preloader/
animation/heroVariant/sectionVariants + порядок секций). Проверь, что разные домены реально дают
разный `design`+`variation`:

```
python3 scripts/variation_engine.py --domain dental-lux.ru   --description "стоматология"     --industry dental    --name "Дентал-Люкс" --out /tmp/a.json
python3 scripts/variation_engine.py --domain pravo-centr.ru  --description "юридические услуги" --industry law       --name "Право-Центр"  --out /tmp/b.json
diff /tmp/a.json /tmp/b.json && echo "ОДИНАКОВО — ПЛОХО" || echo "РАЗЛИЧАЮТСЯ — ОК"
```

Прогони на 3–5 доменах и убедись, что отличаются как минимум: палитра, пара шрифтов, радиус,
`heroVariant` и `sectionVariants`/порядок секций. Если совпадают слишком сильно — меняй `seed`,
не переиспользуй один favicon/og/тексты (детали — `references/anti-fingerprint.md`).

---

## 7. FIX-LOOP (правка → hot reload → пере-скриншот)

Архитектура data-driven: код компонентов не трогаем, чиним **`data/site.json`** (или, реже,
шаблон компонента). `next dev` даёт hot reload — отдельный рестарт обычно не нужен.

Цикл:

1. Нашёл дефект (горизонтальный скролл / слабый контраст / запрещённое слово / битая картинка).
2. Правка в `$PROJ/data/site.json` (палитра, тексты, пропсы секции, путь картинки) — либо в
   шаблоне `components/...` для структурных багов.
3. Hot reload отрабатывает сам; принудительно пере-загрузи вкладку:
   ```
   navigate_page url="http://localhost:3000"
   wait_for      text="<H1 hero>"
   ```
4. Пере-сделай нужный скриншот/замер (`take_screenshot`, замер `scrollWidth`, повтор grep DOM).
5. Повторяй, пока все чекбоксы блоков 3–6 не зелёные.

> Если правил `globals.css`/`layout.tsx` (токены/шрифты/SEO) — изредка нужен полный перезапуск
> dev-сервера; при изменении только `data/site.json` достаточно reload вкладки.

---

## Итоговый гейт (всё должно быть ✓)

- [ ] Консоль чистая; (опц.) Lighthouse a11y/best-practices ≥ 90.
- [ ] Скриншоты desktop 1280 / mobile 390 сняты; hero+CTA в первом экране.
- [ ] Нет горизонтального скролла на 375/768/1280 (`scrollWidth ≤ clientWidth`).
- [ ] Фокус-кольца, hover без сдвига layout, контраст ≥ 4.5, иконки SVG, reduced-motion ок.
- [ ] **0** запрещённых слов в проекте И в DOM; нет дисклеймера «демо» на странице.
- [ ] URL остаётся чистым при кликах по меню; нет `#hash`/саб-роутов.
- [ ] Формы: нет `fetch/axios/XHR/action`, есть инлайн-success, в сети — нет запросов к бэкенду.
- [ ] Нет аналитик/внешних чатов; в network только localhost (+ опц. OSM-тайлы).
- [ ] `ru_data.py --selftest` = «ВСЕ ТЕСТЫ ПРОЙДЕНЫ ✓»; реквизиты/адрес/цены заполнены; карта на нужном городе.
- [ ] Два разных домена через `variation_engine.py` дают различающийся `design`+`variation`.
