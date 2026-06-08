#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assemble_site.py — собирает ЕДИНЫЙ data/site.json из частей:
  • design.json  — вывод variation_engine.py (brand/design/variation/sections_order)
  • ru.json      — вывод ru_data.py (company/contacts/schedule/stats/team/services/reviews)
  • preset       — пресет ниши из data/industries.json (label/tone/service_items/roles/…)
  • images       — карта slug→путь (из images.lock.json gen_images, опционально)

Сам строит sections[] по sections_order с чистым РУ-копирайтом (без слопа и без слов-маркеров).
Это автономный фолбэк/ускоритель; модель может потом улучшить копию вручную.

  python3 assemble_site.py --design d.json --data ru.json [--preset p.json] \
      [--images images.lock.json] [--description "..."] [--city Москва] --out site.json
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

BANNED = ["демо","demo","placeholder","пример","example","тест","заглушк","fake","mock","dummy","sample","lorem","todo","fixme"]


def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8")) if p and Path(p).exists() else None


def rub(n):
    return f"{n:,}".replace(",", " ") + " ₽"


# предложный падеж («в Москве», «в Казани») для корректной грамматики
CITY_PREP = {
    "Москва": "Москве", "Санкт-Петербург": "Санкт-Петербурге", "Новосибирск": "Новосибирске",
    "Екатеринбург": "Екатеринбурге", "Казань": "Казани", "Нижний Новгород": "Нижнем Новгороде",
    "Челябинск": "Челябинске", "Самара": "Самаре", "Омск": "Омске", "Ростов-на-Дону": "Ростове-на-Дону",
    "Уфа": "Уфе", "Красноярск": "Красноярске", "Воронеж": "Воронеже", "Пермь": "Перми",
    "Волгоград": "Волгограде", "Краснодар": "Краснодаре", "Саратов": "Саратове", "Тюмень": "Тюмени",
    "Тольятти": "Тольятти", "Ижевск": "Ижевске", "Барнаул": "Барнауле", "Иркутск": "Иркутске",
    "Хабаровск": "Хабаровске", "Владивосток": "Владивостоке", "Ярославль": "Ярославле",
    "Махачкала": "Махачкале", "Томск": "Томске", "Оренбург": "Оренбурге", "Кемерово": "Кемерове",
    "Калининград": "Калининграде",
}


def city_prep(city):
    return CITY_PREP.get(city, f"городе {city}")


SECTION_LABEL = {
    "services": "Услуги", "features": "Преимущества", "about": "О компании",
    "process": "Как работаем", "portfolio": "Работы", "pricing": "Цены",
    "team": "Команда", "reviews": "Отзывы", "faq": "Вопросы", "contacts": "Контакты",
}


def hero_copy(label, brand, city, tone):
    return {
        "eyebrow": label,
        "title": f"{brand} — {label.lower()} в {city_prep(city)}",
        "subtitle": f"Работаем по делу: понятные условия, честные сроки и результат, за который не стыдно.",
        "bullets": ["Прозрачные цены без доплат", "Договор и гарантия на работы",
                    "Опытные специалисты", "Удобная запись онлайн"],
    }


def features_copy(label):
    return [
        {"icon": "shield", "title": "Гарантия на результат", "desc": "Фиксируем условия в договоре и отвечаем за качество выполненных работ."},
        {"icon": "clock", "title": "Соблюдаем сроки", "desc": "Называем реальные сроки на старте и держим их — без переносов и сюрпризов."},
        {"icon": "award", "title": "Опытная команда", "desc": "Профильные специалисты с подтверждённой квалификацией и практикой."},
        {"icon": "check-circle", "title": "Честные цены", "desc": "Считаем смету заранее. Итоговая сумма не меняется в процессе работы."},
        {"icon": "users", "title": "Сопровождаем до конца", "desc": "На связи на каждом этапе и после сдачи — отвечаем на вопросы."},
        {"icon": "sparkle", "title": "Внимание к деталям", "desc": "Доводим до результата, которым можно гордиться, а не просто закрываем задачу."},
    ]


def process_copy():
    return [
        {"n": 1, "title": "Заявка", "desc": "Оставляете заявку — перезваниваем в течение 15 минут, уточняем задачу."},
        {"n": 2, "title": "Консультация и смета", "desc": "Разбираемся в деталях, считаем понятную смету без скрытых доплат."},
        {"n": 3, "title": "Работа", "desc": "Выполняем по согласованному плану, держим вас в курсе на каждом этапе."},
        {"n": 4, "title": "Сдача и гарантия", "desc": "Принимаете результат, получаете договор и гарантию на выполненные работы."},
    ]


def faq_copy(brand, city):
    return [
        {"q": "Сколько стоит и от чего зависит цена?", "a": "Стоимость считаем по вашей задаче и фиксируем в смете до начала работ — итоговая сумма не меняется в процессе."},
        {"q": "Как быстро вы свяжетесь?", "a": "Перезваниваем в течение 15 минут в рабочее время после заявки на сайте."},
        {"q": "Вы работаете по договору?", "a": "Да, заключаем договор и предоставляем гарантию на выполненные работы."},
        {"q": f"Вы работаете только в городе {city}?", "a": f"Основной офис в городе {city}; условия по другим районам уточняйте у менеджера."},
        {"q": "Можно ли получить консультацию бесплатно?", "a": "Да, первичная консультация и расчёт сметы — бесплатно и ни к чему вас не обязывают."},
    ]


def portfolio_copy(label, n=6):
    out = []
    for i in range(n):
        out.append({"title": f"{label}: проект №{i+1}", "tag": label,
                    "image": f"portfolio-{i+1}", "result": "Сдан в срок, клиент доволен результатом."})
    return out


def pricing_copy(services):
    # 3 пакета на основе цен услуг
    base = sorted([s.get("price", 3000) for s in services]) or [3000, 6000, 12000]
    lo = base[0]; mid = base[len(base)//2]; hi = base[-1]
    feats = [s["title"] for s in services][:6] or ["Консультация", "Работа по договору", "Гарантия"]
    return [
        {"name": "Базовый", "price_label": f"от {rub(lo)}", "features": feats[:3],
         "cta": {"label": "Выбрать", "href": "#contacts"}},
        {"name": "Оптимальный", "price_label": f"от {rub(mid)}", "popular": True,
         "features": feats[:5], "cta": {"label": "Выбрать", "href": "#contacts"}},
        {"name": "Премиум", "price_label": f"от {rub(hi)}", "features": feats,
         "cta": {"label": "Выбрать", "href": "#contacts"}},
    ]


def about_copy(brand, city, stats, label):
    years = stats.get("years_on_market", 8)
    clients = stats.get("clients", 1200)
    return {
        "body": [
            f"{brand} — это {label.lower()} в городе {city}. Мы выросли из небольшой команды в компанию, "
            f"к которой возвращаются и которую рекомендуют друзьям.",
            f"За {years} лет работы нам доверились более {clients} клиентов. Мы одинаково внимательно "
            f"относимся к каждой задаче — большой или маленькой.",
        ],
        "image": "about", "showRequisites": True,
    }


def assign_images(order, images_map):
    # дефолтные slug-и под секции с визуалом
    imgs = dict(images_map or {})
    imgs.setdefault("logo", "/images/logo.svg")
    return imgs


def build_sections(order, ru, preset, brand, city, label, tone):
    services = ru.get("services", [])
    team = ru.get("team", [])
    reviews = ru.get("reviews", [])
    stats = ru.get("stats", {})
    sec = []
    for t in order:
        s = {"type": t, "id": t}
        if t == "header":
            pass
        elif t == "hero":
            s.update(hero_copy(label, brand, city, tone))
            s["image"] = "hero"
            s["cta"] = {"label": "Оставить заявку", "href": "#contacts"}
            s["secondaryCta"] = {"label": "Услуги и цены", "href": "#services"}
            s["stats"] = [
                {"value": str(stats.get("years_on_market", 8)), "label": "лет на рынке"},
                {"value": f"{stats.get('clients', 1200)}+", "label": "клиентов"},
                {"value": str(stats.get("rating", 4.9)), "label": "рейтинг"},
            ]
        elif t == "trustbar":
            s["items"] = []  # компонент сам соберёт из site.stats
        elif t == "services":
            s["title"] = "Услуги и цены"
            s["subtitle"] = "Понятный прайс без скрытых доплат — итоговая сумма фиксируется в смете."
            s["items"] = [{"title": x["title"], "desc": x.get("desc", ""),
                           "price_label": x.get("price_label", ""), "icon": x.get("icon", "check"),
                           "popular": x.get("popular", False)} for x in services]
            s["cta"] = {"label": "Записаться", "href": "#contacts"}
        elif t == "features":
            s["title"] = "Почему выбирают нас"
            s["items"] = features_copy(label)
        elif t == "about":
            s.update(about_copy(brand, city, stats, label))
            s["title"] = "О компании"
        elif t == "process":
            s["title"] = "Как мы работаем"
            s["steps"] = process_copy()
        elif t == "portfolio":
            s["title"] = "Наши работы"
            s["items"] = portfolio_copy(label)
        elif t == "pricing":
            s["title"] = "Пакеты и цены"
            s["plans"] = pricing_copy(services)
        elif t == "team":
            s["title"] = "Наша команда"
            s["members"] = [{"name": m["name"], "position": m["position"],
                             "experience_years": m.get("experience_years"),
                             "image": m.get("photo_slug")} for m in team]
        elif t == "reviews":
            s["title"] = "Отзывы клиентов"
            s["items"] = [{"author": r["author"], "rating": r["rating"], "date": r["date"],
                           "text": r["text"], "avatar": r.get("avatar_slug")} for r in reviews]
            s["aggregate"] = {"rating": stats.get("rating", 4.9), "count": stats.get("reviews_count", 240)}
        elif t == "faq":
            s["title"] = "Частые вопросы"
            s["items"] = faq_copy(brand, city)
        elif t == "cta":
            s["title"] = "Оставьте заявку"
            s["subtitle"] = "Перезвоним в течение 15 минут, ответим на вопросы и рассчитаем стоимость."
            s["cta"] = {"label": "Записаться", "href": "#contacts"}
        elif t == "contacts":
            s["title"] = "Контакты"
        elif t == "footer":
            pass
        sec.append(s)
    return sec


def build_nav(order):
    nav = []
    for t in order:
        if t in SECTION_LABEL and t != "contacts":
            nav.append({"label": SECTION_LABEL[t], "href": f"#{t}"})
    nav.append({"label": "Контакты", "href": "#contacts"})
    # максимум 6 пунктов
    return nav[:6]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--design", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--preset", default=None)
    ap.add_argument("--images", default=None)
    ap.add_argument("--description", default="")
    ap.add_argument("--city", default="Москва")
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)

    design = load(a.design); ru = load(a.data); preset = load(a.preset) or {}
    # Картинки резолвятся в рантайме через бандл (lib/images.ts → /_next/static/media),
    # поэтому карта путей здесь не нужна — секции ссылаются на слаги (hero/about/og/mascot/...).
    pass

    brand = design["brand"]["name"]
    domain = design["brand"]["domain"]
    slug = design["brand"]["slug"]
    company = ru["company"]
    city = company.get("address_actual", {}).get("city", a.city)
    label = preset.get("label") or "Услуги для бизнеса"
    tone = preset.get("tone", "")
    order = design["sections_order"]

    site = {
        "brand": {
            "name": brand, "legalName": company.get("legal_name", brand),
            "tagline": f"{label} в {city_prep(city)}", "slug": slug, "domain": domain,
        },
        "design": design["design"],
        "variation": design["variation"],
        "seo": {
            "title": f"{brand} — {label.lower()} в {city_prep(city)}",
            "description": f"{brand}: {label.lower()} в {city_prep(city)}. Честные цены, договор и гарантия, запись онлайн. Перезваниваем за 15 минут.",
            "keywords": [label.lower(), city, brand],
            "ogImageSlug": "og", "locale": "ru_RU", "noindex": True,
        },
        "company": company,
        "contacts": ru["contacts"],
        "schedule": ru["schedule"],
        "stats": ru["stats"],
        "nav": build_nav(order),
        "cta": {"primary": {"label": "Оставить заявку", "href": "#contacts"}, "phoneLabel": "Перезвоните мне"},
        "images": {},  # резолв через бандл lib/images.ts (см. gen_image_imports.py)
        "legal": {"copyright": company.get("legal_name", brand)},
        "sections": build_sections(order, ru, preset, brand, city, label, tone),
    }

    text = json.dumps(site, ensure_ascii=False, indent=2)
    # страховка: ни одного запрещённого слова в выводе
    low = text.lower()
    hits = [w for w in BANNED if w in low]
    if hits:
        print(f"ВНИМАНИЕ: в site.json найдены запрещённые слова: {hits}", file=sys.stderr)
    Path(a.out).write_text(text, encoding="utf-8")
    print(f"site.json собран: {a.out} ({len(site['sections'])} секций, бренд {brand})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
