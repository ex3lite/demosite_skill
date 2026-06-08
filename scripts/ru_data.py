#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ru_data.py — генератор правдоподобных РОССИЙСКИХ демо-данных для демо-сайтов.

Главная ценность: все реквизиты проходят НАСТОЯЩИЕ контрольные суммы
(ИНН 10/12, ОГРН 13, ОГРНИП 15, СНИЛС, расчётный/корреспондентский счёт по
алгоритму ЦБ РФ). Это значит, что демо-сайт выглядит как реальный бизнес,
а не как заглушка с "00000000".

Данные ВЫМЫШЛЕННЫЕ (детерминированно генерируемые по seed), но валидные по форме.
Не используйте для обмана — это демонстрационный контент.

CLI:
  python3 ru_data.py --industry dental --city "Казань" --name "Дентал-Люкс" \\
        --seed 42 --reviews 8 --team 5 --services 6 --out dataset.json

  python3 ru_data.py --selftest      # проверка всех алгоритмов контрольных сумм

Без --out печатает JSON в stdout (UTF-8, не-ASCII сохраняется как есть).
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import date, timedelta

# ─────────────────────────────────────────────────────────────────────────────
#  КОНТРОЛЬНЫЕ СУММЫ (официальные алгоритмы)
# ─────────────────────────────────────────────────────────────────────────────

_INN10_W = [2, 4, 10, 3, 5, 9, 4, 6, 8]
_INN12_W1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
_INN12_W2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]


def _inn_csum(digits, weights):
    return (sum(d * w for d, w in zip(digits, weights)) % 11) % 10


def inn10_valid(s: str) -> bool:
    if len(s) != 10 or not s.isdigit():
        return False
    d = [int(c) for c in s]
    return _inn_csum(d[:9], _INN10_W) == d[9]


def inn12_valid(s: str) -> bool:
    if len(s) != 12 or not s.isdigit():
        return False
    d = [int(c) for c in s]
    return _inn_csum(d[:10], _INN12_W1) == d[10] and _inn_csum(d[:11], _INN12_W2) == d[11]


def ogrn_valid(s: str) -> bool:
    if len(s) != 13 or not s.isdigit():
        return False
    return int(s[:12]) % 11 % 10 == int(s[12])


def ogrnip_valid(s: str) -> bool:
    if len(s) != 15 or not s.isdigit():
        return False
    return int(s[:14]) % 13 % 10 == int(s[14])


def snils_valid(s: str) -> bool:
    digits = "".join(c for c in s if c.isdigit())
    if len(digits) != 11:
        return False
    nums = [int(c) for c in digits[:9]]
    ctrl = int(digits[9:])
    total = sum(n * (9 - i) for i, n in enumerate(nums))
    check = total % 101
    if check == 100 or check == 101:
        check = 0
    return check == ctrl


_ACC_W = [7, 1, 3] * 8  # 24+, обрезается до нужной длины (23)


def account_valid(prefix3: str, acc20: str) -> bool:
    s = prefix3 + acc20
    if len(s) != 23 or not s.isdigit():
        return False
    return sum(int(c) * w for c, w in zip(s, _ACC_W[:23])) % 10 == 0


def _solve_account_control(prefix3: str, acc_chars: list[str], ctrl_index: int) -> str:
    """Подбирает контрольный разряд счёта (позиция 9, индекс 8) так, чтобы
    взвешенная сумма по алгоритму ЦБ делилась на 10. Решение всегда существует
    и единственно (вес позиции взаимно прост с 10)."""
    for d in range(10):
        acc_chars[ctrl_index] = str(d)
        if account_valid(prefix3, "".join(acc_chars)):
            return "".join(acc_chars)
    raise RuntimeError("control digit not found")  # недостижимо


# ─────────────────────────────────────────────────────────────────────────────
#  ГЕНЕРАТОРЫ РЕКВИЗИТОВ
# ─────────────────────────────────────────────────────────────────────────────

def gen_inn10(rnd: random.Random, region: str) -> str:
    body = [int(region[0]), int(region[1])] + [rnd.randint(0, 9) for _ in range(7)]
    body.append(_inn_csum(body, _INN10_W))
    return "".join(map(str, body))


def gen_inn12(rnd: random.Random, region: str) -> str:
    body = [int(region[0]), int(region[1])] + [rnd.randint(0, 9) for _ in range(8)]
    body.append(_inn_csum(body, _INN12_W1))
    body.append(_inn_csum(body, _INN12_W2))
    return "".join(map(str, body))


def gen_ogrn(rnd: random.Random, region: str) -> str:
    # 1 (признак ЮЛ) + 2 (год) + 2 (регион) + 2 (ИФНС) + 5 (номер записи) + ctrl
    year = rnd.randint(5, 24)
    body = "1{:02d}{}{:02d}{:05d}".format(year, region, rnd.randint(1, 99), rnd.randint(1, 99999))
    ctrl = int(body) % 11 % 10
    return body + str(ctrl)


def gen_ogrnip(rnd: random.Random, region: str) -> str:
    year = rnd.randint(5, 24)
    body = "3{:02d}{}{:02d}{:07d}".format(year, region, rnd.randint(1, 99), rnd.randint(1, 9999999))
    ctrl = int(body) % 13 % 10
    return body + str(ctrl)


def gen_kpp(rnd: random.Random, region: str) -> str:
    # регион(2) + ИФНС(2) + причина постановки(2, 01=по месту нахождения) + порядковый(3)
    return "{}{:02d}01{:03d}".format(region, rnd.randint(1, 99), rnd.randint(1, 999))


def gen_snils(rnd: random.Random) -> str:
    nums = [rnd.randint(0, 9) for _ in range(9)]
    # избегаем последовательности < 001-001-998 крайних случаев — не критично для демо
    total = sum(n * (9 - i) for i, n in enumerate(nums))
    check = total % 101
    if check >= 100:
        check = 0
    s = "".join(map(str, nums))
    return "{}-{}-{} {:02d}".format(s[0:3], s[3:6], s[6:9], check)


def gen_bik(rnd: random.Random, region: str) -> str:
    # 04(РФ) + регион(2) + подразделение(2) + РКЦ(3)
    return "04{}{:02d}{:03d}".format(region, rnd.randint(0, 99), rnd.randint(1, 999))


def gen_corr_account(rnd: random.Random, bik: str) -> str:
    prefix3 = "0" + bik[4:6]                       # для к/с: '0' + 5-6 разряды БИК
    acc = list("30101810" + "0" + "00000000000")  # 20 знаков, баланс.счёт 30101, RUB(810)
    for i in range(9, 17):
        acc[i] = str(rnd.randint(0, 9))
    acc[17], acc[18], acc[19] = bik[6], bik[7], bik[8]  # последние 3 = последние 3 БИК
    return _solve_account_control(prefix3, acc, 8)


def gen_checking_account(rnd: random.Random, bik: str, kind: str = "ooo") -> str:
    prefix3 = bik[6:9]                             # для р/с: последние 3 разряда БИК
    balance = "40702" if kind == "ooo" else "40802"  # 40702 ЮЛ-коммерч., 40802 ИП
    acc = list(balance + "810" + "0" + "00000000000")
    for i in range(9, 20):
        acc[i] = str(rnd.randint(0, 9))
    return _solve_account_control(prefix3, acc, 8)


# ─────────────────────────────────────────────────────────────────────────────
#  СПРАВОЧНЫЕ ДАННЫЕ (вшиты для автономности)
# ─────────────────────────────────────────────────────────────────────────────

# регион: (название, код_региона, телефонный_код, индекс_префикс)
CITIES = [
    ("Москва", "77", "495", "101"), ("Санкт-Петербург", "78", "812", "190"),
    ("Новосибирск", "54", "383", "630"), ("Екатеринбург", "66", "343", "620"),
    ("Казань", "16", "843", "420"), ("Нижний Новгород", "52", "831", "603"),
    ("Челябинск", "74", "351", "454"), ("Самара", "63", "846", "443"),
    ("Омск", "55", "381", "644"), ("Ростов-на-Дону", "61", "863", "344"),
    ("Уфа", "02", "347", "450"), ("Красноярск", "24", "391", "660"),
    ("Воронеж", "36", "473", "394"), ("Пермь", "59", "342", "614"),
    ("Волгоград", "34", "844", "400"), ("Краснодар", "23", "861", "350"),
    ("Саратов", "64", "845", "410"), ("Тюмень", "72", "345", "625"),
    ("Тольятти", "63", "848", "445"), ("Ижевск", "18", "341", "426"),
    ("Барнаул", "22", "385", "656"), ("Иркутск", "38", "395", "664"),
    ("Хабаровск", "27", "421", "680"), ("Владивосток", "25", "423", "690"),
    ("Ярославль", "76", "485", "150"), ("Махачкала", "05", "872", "367"),
    ("Томск", "70", "382", "634"), ("Оренбург", "56", "353", "460"),
    ("Кемерово", "42", "384", "650"), ("Калининград", "39", "401", "236"),
]

# приблизительные координаты центра города (для карты в контактах)
CITY_COORDS = {
    "Москва": (55.7558, 37.6173), "Санкт-Петербург": (59.9311, 30.3609),
    "Новосибирск": (55.0084, 82.9357), "Екатеринбург": (56.8389, 60.6057),
    "Казань": (55.7963, 49.1088), "Нижний Новгород": (56.2965, 43.9361),
    "Челябинск": (55.1644, 61.4368), "Самара": (53.1959, 50.1002),
    "Омск": (54.9885, 73.3242), "Ростов-на-Дону": (47.2357, 39.7015),
    "Уфа": (54.7388, 55.9721), "Красноярск": (56.0153, 92.8932),
    "Воронеж": (51.6608, 39.2003), "Пермь": (58.0105, 56.2502),
    "Волгоград": (48.7080, 44.5133), "Краснодар": (45.0355, 38.9753),
    "Саратов": (51.5336, 46.0343), "Тюмень": (57.1530, 65.5343),
    "Тольятти": (53.5078, 49.4204), "Ижевск": (56.8527, 53.2115),
    "Барнаул": (53.3481, 83.7798), "Иркутск": (52.2870, 104.3050),
    "Хабаровск": (48.4827, 135.0840), "Владивосток": (43.1155, 131.8855),
    "Ярославль": (57.6261, 39.8845), "Махачкала": (42.9831, 47.5047),
    "Томск": (56.4846, 84.9476), "Оренбург": (51.7682, 55.0969),
    "Кемерово": (55.3550, 86.0833), "Калининград": (54.7104, 20.4522),
}

STREETS = [
    "Ленина", "Советская", "Мира", "Гагарина", "Победы", "Молодёжная",
    "Центральная", "Школьная", "Набережная", "Садовая", "Лесная", "Пушкина",
    "Кирова", "Чехова", "Горького", "Октябрьская", "Первомайская", "Заводская",
    "Комсомольская", "Пролетарская", "Космонавтов", "Строителей", "Дружбы",
    "Свободы", "Революции", "Маяковского", "Толстого", "Тургенева", "Энгельса",
    "Карла Маркса", "Баумана", "Профсоюзная", "Багратиона", "Жукова", "Суворова",
]
STREET_TYPE = ["ул.", "ул.", "ул.", "пр-т", "пер.", "б-р", "ш."]

M_NAMES = ["Александр", "Дмитрий", "Максим", "Сергей", "Андрей", "Алексей",
           "Артём", "Илья", "Кирилл", "Михаил", "Никита", "Иван", "Роман",
           "Егор", "Владимир", "Павел", "Антон", "Денис", "Евгений", "Игорь",
           "Олег", "Виктор", "Константин", "Тимур", "Рустам", "Марат"]
F_NAMES = ["Анна", "Мария", "Елена", "Екатерина", "Ольга", "Наталья", "Татьяна",
           "Ирина", "Светлана", "Юлия", "Виктория", "Дарья", "Анастасия",
           "Алина", "Ксения", "Полина", "Марина", "Людмила", "Галина", "Вера",
           "Оксана", "Диана", "Алла", "Лилия", "Гузель", "Регина"]
M_SUR = ["Иванов", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев",
         "Козлов", "Новиков", "Морозов", "Петров", "Волков", "Соловьёв",
         "Васильев", "Зайцев", "Павлов", "Семёнов", "Голубев", "Виноградов",
         "Богданов", "Воробьёв", "Фёдоров", "Михайлов", "Беляев", "Тарасов",
         "Белов", "Комаров", "Орлов", "Киселёв", "Макаров", "Андреев"]
M_PAT = ["Александрович", "Дмитриевич", "Сергеевич", "Андреевич", "Алексеевич",
         "Иванович", "Михайлович", "Владимирович", "Николаевич", "Викторович",
         "Павлович", "Евгеньевич", "Олегович", "Игоревич", "Романович"]

POSITIONS_GENERIC = ["Генеральный директор", "Коммерческий директор",
                     "Руководитель отдела", "Главный специалист",
                     "Ведущий менеджер", "Старший администратор"]

BANKS = [
    "ПАО Сбербанк", "Банк ВТБ (ПАО)", "АО «Альфа-Банк»", "АО «Тинькофф Банк»",
    "ПАО «Промсвязьбанк»", "АО «Райффайзенбанк»", "ПАО «Совкомбанк»",
    "АО «Газпромбанк»", "ПАО Банк «ФК Открытие»", "ПАО «Росбанк»",
    "АО «ЮниКредит Банк»", "ПАО «АК БАРС» БАНК",
]


# ─────────────────────────────────────────────────────────────────────────────
#  СБОРКА СУЩНОСТЕЙ
# ─────────────────────────────────────────────────────────────────────────────

LEGAL_FORMS = ["ООО", "ООО", "ООО", "АО", "ИП"]


def make_company(rnd: random.Random, name: str, industry: str, city_row) -> dict:
    city, region, phone_code, idx = city_row
    form = rnd.choice(LEGAL_FORMS)
    is_ip = form == "ИП"
    bik = gen_bik(rnd, region)
    bank = rnd.choice(BANKS)

    if is_ip:
        director = make_person(rnd, gender="m")
        legal_name = "ИП {} {}.{}.".format(
            director["last"], director["first"][0], director["patronymic"][0])
        brand = name
        inn = gen_inn12(rnd, region)
        ogrn = gen_ogrnip(rnd, region)
        kpp = None
        acc = gen_checking_account(rnd, bik, kind="ip")
    else:
        legal_name = '{} «{}»'.format(form, name)
        brand = name
        inn = gen_inn10(rnd, region)
        ogrn = gen_ogrn(rnd, region)
        kpp = gen_kpp(rnd, region)
        acc = gen_checking_account(rnd, bik, kind="ooo")
        director = make_person(rnd)

    return {
        "brand": brand,
        "legal_name": legal_name,
        "legal_form": form,
        "industry": industry,
        "inn": inn,
        "ogrn": ogrn,
        "ogrn_kind": "ОГРНИП" if is_ip else "ОГРН",
        "kpp": kpp,
        "okpo": "{:08d}".format(rnd.randint(10000000, 99999999)),
        "address_legal": make_address(rnd, city_row),
        "address_actual": make_address(rnd, city_row),
        "bank": {
            "name": bank,
            "bik": bik,
            "corr_account": gen_corr_account(rnd, bik),
            "checking_account": acc,
        },
        "director": {
            "full": director["full"],
            "position": "Индивидуальный предприниматель" if is_ip else "Генеральный директор",
        },
        "founded_year": rnd.randint(2005, 2021),
    }


def _city_map(rnd: random.Random, city: str) -> dict:
    base = CITY_COORDS.get(city, (55.7558, 37.6173))
    lat = round(base[0] + rnd.uniform(-0.04, 0.04), 6)
    lon = round(base[1] + rnd.uniform(-0.06, 0.06), 6)
    return {"lat": lat, "lon": lon, "zoom": 15}


def make_address(rnd: random.Random, city_row) -> dict:
    city, region, phone_code, idx = city_row
    street = rnd.choice(STREETS)
    st_type = rnd.choice(STREET_TYPE)
    house = rnd.randint(1, 180)
    korp = rnd.choice(["", "", "", "к1", "к2", "стр. 1"])
    office = rnd.choice(["", "оф. {}".format(rnd.randint(1, 60)), "пом. {}".format(rnd.randint(1, 40))])
    postal = "{}{:03d}".format(idx, rnd.randint(0, 999))
    parts = ["{}, ".format(postal), "г. {}".format(city), ", {} {} {}".format(st_type, street, house)]
    if korp:
        parts.append(", {}".format(korp))
    if office:
        parts.append(", {}".format(office))
    full = "".join(parts)
    return {"full": full, "postal_code": postal, "city": city, "street": "{} {}".format(st_type, street), "house": str(house)}


def make_phone(rnd: random.Random, city_row, mobile=False) -> str:
    if mobile:
        codes = ["901", "903", "905", "906", "909", "910", "915", "917", "919",
                 "920", "925", "926", "927", "929", "931", "950", "960", "965",
                 "977", "980", "987", "999"]
        c = rnd.choice(codes)
        return "+7 ({}) {:03d}-{:02d}-{:02d}".format(c, rnd.randint(100, 999), rnd.randint(0, 99), rnd.randint(0, 99))
    code = city_row[2]
    return "+7 ({}) {:03d}-{:02d}-{:02d}".format(code, rnd.randint(200, 999), rnd.randint(0, 99), rnd.randint(0, 99))


_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def translit(s: str) -> str:
    out = []
    for ch in s.lower():
        out.append(_TRANSLIT.get(ch, ch if ch.isalnum() else ""))
    return "".join(out)


def make_person(rnd: random.Random, gender=None) -> dict:
    g = gender or rnd.choice(["m", "f"])
    if g == "m":
        first, sur, pat = rnd.choice(M_NAMES), rnd.choice(M_SUR), rnd.choice(M_PAT)
    else:
        first = rnd.choice(F_NAMES)
        sur = rnd.choice(M_SUR) + "а"
        pat = rnd.choice(M_PAT)[:-2] + "на"
    return {
        "first": first, "last": sur, "patronymic": pat, "gender": g,
        "full": "{} {} {}".format(sur, first, pat),
        "short": "{} {}.{}.".format(sur, first[0], pat[0]),
    }


def make_team(rnd: random.Random, n: int, roles: list[str]) -> list[dict]:
    out = []
    for i in range(n):
        p = make_person(rnd)
        role = roles[i % len(roles)] if roles else rnd.choice(POSITIONS_GENERIC)
        out.append({
            "name": "{} {}".format(p["first"], p["last"]),
            "full": p["full"],
            "position": role,
            "experience_years": rnd.randint(3, 28),
            "photo_slug": "team-{}".format(i + 1),
            "gender": p["gender"],
        })
    return out


def make_reviews(rnd: random.Random, n: int, snippets: list[str]) -> list[dict]:
    pool = snippets or [
        "Обратились впервые — остались довольны. Всё чётко по срокам, без навязывания.",
        "Профессиональный подход и адекватные цены. Рекомендую.",
        "Спасибо за работу! Сделали аккуратно и объяснили каждый шаг.",
        "Приятный персонал, современное оборудование, никаких очередей.",
        "Решили мой вопрос за один визит. Буду обращаться ещё.",
        "Долго искал, где сделают качественно — нашёл здесь. Доволен результатом.",
    ]
    out = []
    today = date(2025, 11, 1)
    for i in range(n):
        p = make_person(rnd)
        d = today - timedelta(days=rnd.randint(5, 400))
        out.append({
            "author": "{} {}.".format(p["first"], p["last"][0]),
            "rating": rnd.choice([5, 5, 5, 4, 5]),
            "date": d.isoformat(),
            "text": pool[i % len(pool)],
            "avatar_slug": "avatar-{}".format(i + 1),
        })
    return out


def make_services(rnd: random.Random, items: list[dict]) -> list[dict]:
    out = []
    for it in items:
        lo, hi = it.get("price_range", [1000, 5000])
        price = rnd.randint(lo // 100, hi // 100) * 100
        out.append({
            "title": it["title"],
            "desc": it.get("desc", ""),
            "price": price,
            "price_label": "от {:,} ₽".format(price).replace(",", " "),
            "unit": it.get("unit", ""),
            "icon": it.get("icon", "check"),
            "image_slug": it.get("image_slug"),
            "popular": it.get("popular", False),
        })
    return out


# ─────────────────────────────────────────────────────────────────────────────
#  ВЕРХНЕУРОВНЕВАЯ СБОРКА ДАТАСЕТА
# ─────────────────────────────────────────────────────────────────────────────

def build_dataset(industry: str, city: str | None, name: str | None,
                  seed: int, reviews: int, team: int, services: int,
                  roles=None, service_items=None, review_snippets=None) -> dict:
    rnd = random.Random(seed)
    # город по умолчанию — Москва (как в брифах для РФ-бизнеса)
    default_city = next(c for c in CITIES if c[0] == "Москва")
    city_row = next((c for c in CITIES if c[0].lower() == (city or "").lower()), None) or default_city
    brand = name or "Компания"

    company = make_company(rnd, brand, industry, city_row)

    if not service_items:
        service_items = [{"title": "Услуга {}".format(i + 1), "desc": "Описание услуги.",
                          "price_range": [1500, 9000], "popular": i == 1}
                         for i in range(services)]
    else:
        service_items = service_items[:services] if services else service_items

    schedule = {
        "weekdays": "Пн–Пт: 09:00–20:00",
        "saturday": "Сб: 10:00–18:00",
        "sunday": rnd.choice(["Вс: выходной", "Вс: 10:00–16:00"]),
    }

    dataset = {
        "_meta": {
            "generator": "ru_data.py",
            "seed": seed,
            "industry": industry,
            "note": "Synthetic business data; requisites pass official checksums. Internal file, not shipped to the client.",
        },
        "company": company,
        "contacts": {
            "phone": make_phone(rnd, city_row),
            "phone_mobile": make_phone(rnd, city_row, mobile=True),
            "email": "info@{}.ru".format(translit(brand)[:18] or "company"),
            "email_sales": "sales@{}.ru".format(translit(brand)[:18] or "company"),
            "website": "{}.ru".format(translit(brand)[:18] or "company"),
            "address": company["address_actual"]["full"],
            "map": _city_map(rnd, city_row[0]),
            "messengers": {"whatsapp": True, "telegram": "@{}".format(translit(brand)[:14] or "company")},
        },
        "schedule": schedule,
        "team": make_team(rnd, team, roles or []),
        "services": make_services(rnd, service_items),
        "reviews": make_reviews(rnd, reviews, review_snippets or []),
        "stats": {
            "years_on_market": 2025 - company["founded_year"],
            "clients": rnd.choice([1200, 2400, 3500, 5000, 8000, 12000]),
            "rating": round(rnd.uniform(4.7, 4.95), 2),
            "reviews_count": rnd.choice([124, 256, 389, 512, 740]),
            "specialists": max(team, rnd.randint(team, team + 12)),
        },
    }
    return dataset


# ─────────────────────────────────────────────────────────────────────────────
#  SELFTEST
# ─────────────────────────────────────────────────────────────────────────────

def selftest() -> int:
    ok = True

    def check(label, cond):
        nonlocal ok
        ok = ok and cond
        print(("  OK  " if cond else " FAIL ") + label)

    print("== Известные валидные реквизиты (Сбербанк) ==")
    check("ИНН 7707083893 (10)", inn10_valid("7707083893"))
    check("ОГРН 1027700132195 (13)", ogrn_valid("1027700132195"))
    check("ИНН 500100732259 (12, физлицо пример)", inn12_valid("500100732259"))
    check("СНИЛС 112-233-445 95", snils_valid("112-233-445 95"))

    print("== Заведомо НЕвалидные ==")
    check("ИНН 7707083894 невалиден", not inn10_valid("7707083894"))
    check("ОГРН 1027700132196 невалиден", not ogrn_valid("1027700132196"))

    print("== Сгенерированные значения проходят свои же проверки ==")
    rnd = random.Random(12345)
    for region in ["77", "16", "66", "23", "02"]:
        for _ in range(200):
            if not inn10_valid(gen_inn10(rnd, region)):
                check("gen_inn10 region " + region, False); break
            if not inn12_valid(gen_inn12(rnd, region)):
                check("gen_inn12 region " + region, False); break
            if not ogrn_valid(gen_ogrn(rnd, region)):
                check("gen_ogrn region " + region, False); break
            if not ogrnip_valid(gen_ogrnip(rnd, region)):
                check("gen_ogrnip region " + region, False); break
            if not snils_valid(gen_snils(rnd)):
                check("gen_snils", False); break
            bik = gen_bik(rnd, region)
            if not account_valid(bik[6:9], gen_checking_account(rnd, bik, "ooo")):
                check("gen_checking_account(ooo) region " + region, False); break
            if not account_valid(bik[6:9], gen_checking_account(rnd, bik, "ip")):
                check("gen_checking_account(ip) region " + region, False); break
            if not account_valid("0" + bik[4:6], gen_corr_account(rnd, bik)):
                check("gen_corr_account region " + region, False); break
        else:
            check("region {} 200x всех генераторов".format(region), True)
            continue
        break

    print("== Полный датасет собирается ==")
    try:
        ds = build_dataset("dental", "Казань", "Дентал-Люкс", seed=42,
                           reviews=6, team=4, services=5)
        c = ds["company"]
        check("датасет: ИНН валиден", inn10_valid(c["inn"]) or inn12_valid(c["inn"]))
        check("датасет: счёт валиден",
              account_valid(c["bank"]["bik"][6:9], c["bank"]["checking_account"]))
        check("датасет: есть контакты/команда/отзывы",
              bool(ds["contacts"]["phone"]) and len(ds["team"]) == 4 and len(ds["reviews"]) == 6)
    except Exception as e:  # noqa
        check("сборка датасета без ошибок: " + str(e), False)

    print("\n" + ("ВСЕ ТЕСТЫ ПРОЙДЕНЫ ✓" if ok else "ЕСТЬ ОШИБКИ ✗"))
    return 0 if ok else 1


# ─────────────────────────────────────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────────────────────────────────────

def main(argv=None):
    ap = argparse.ArgumentParser(description="Генератор RU demo-данных с валидными реквизитами")
    ap.add_argument("--selftest", action="store_true", help="прогнать проверки контрольных сумм")
    ap.add_argument("--industry", default="generic")
    ap.add_argument("--city", default="Москва")
    ap.add_argument("--name", default=None, help="бренд/название")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--reviews", type=int, default=8)
    ap.add_argument("--team", type=int, default=5)
    ap.add_argument("--services", type=int, default=6)
    ap.add_argument("--preset", default=None, help="путь к JSON c roles/service_items/review_snippets")
    ap.add_argument("--out", default=None)
    args = ap.parse_args(argv)

    if args.selftest:
        return selftest()

    roles = service_items = review_snippets = None
    if args.preset:
        with open(args.preset, encoding="utf-8") as f:
            preset = json.load(f)
        roles = preset.get("roles")
        service_items = preset.get("service_items")
        review_snippets = preset.get("review_snippets")

    ds = build_dataset(args.industry, args.city, args.name, args.seed,
                       args.reviews, args.team, args.services,
                       roles=roles, service_items=service_items, review_snippets=review_snippets)
    text = json.dumps(ds, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
        print("Записано: {}".format(args.out))
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
