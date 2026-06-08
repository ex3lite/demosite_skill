#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
variation_engine.py — движок ВАРИАТИВНОСТИ (анти-фингерпринт).

Главная задача: чтобы сгенерированные сайты НЕ имели общего детектируемого
паттерна. По домену/описанию/seed детерминированно подбирает целую дизайн-систему
и набор СТРУКТУРНЫХ вариантов так, что два сайта различаются:
  • палитрой и режимом (light/dark)            • парой шрифтов
  • радиусом скругления и тенью                 • вертикальным ритмом и шириной контейнера
  • вариантом hero и вариантами каждой секции   • пресетом анимаций и лоадера
  • порядком/составом секций

Разные палитра+радиус+шрифты+spacing → разный КОМПИЛИРУЕМЫЙ CSS.
Разные варианты секций → разный DOM. Плюс разный контент и картинки.
В сумме — уникальный «отпечаток» на каждый сайт.

CLI:
  python3 variation_engine.py --domain dental-lux.ru \
      --description "стоматология премиум" --industry dental \
      --name "Дентал-Люкс" [--seed N] [--mode light|dark] \
      [--primary '#0B3D2E' --accent '#C8A24B'] --out design.json

Выводит JSON c блоками design + variation + brand(slug/domain) + sections_order.
Этот вывод сливается в site.json (см. references/pipeline.md).
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys

# ─────────────────────────────────────────────────────────────────────────────
#  ПУЛЫ (курируемые, контраст text/bg ≥ 4.5:1 заложен в выбор)
# ─────────────────────────────────────────────────────────────────────────────

# Палитры: (mode, tags, dict). Подбираются по vibe-тегам индустрии + seed.
PALETTES = [
    ("light", ["clinic","trust","tech","calm"], dict(bg="#F7F9FB", surface="#FFFFFF", text="#0E1B2A", muted="#516072", primary="#0E5C8A", primaryFg="#FFFFFF", accent="#19B5A8", accentFg="#06241F", border="#E2E9F0", ring="#0E5C8A")),
    ("light", ["clinic","calm","beauty"], dict(bg="#FBFAF8", surface="#FFFFFF", text="#152019", muted="#54635A", primary="#0B6E4F", primaryFg="#FFFFFF", accent="#D9A441", accentFg="#241B06", border="#E6EAE3", ring="#0B6E4F")),
    ("light", ["luxury","law","editorial","premium"], dict(bg="#FBFAF7", surface="#FFFFFF", text="#171411", muted="#5C534A", primary="#10243F", primaryFg="#FFFFFF", accent="#B68A3E", accentFg="#1E1605", border="#E8E2D7", ring="#10243F")),
    ("light", ["luxury","law","trust"], dict(bg="#F8F6F4", surface="#FFFFFF", text="#1A1414", muted="#5E5550", primary="#5A1F2A", primaryFg="#FFFFFF", accent="#C2A14C", accentFg="#231A06", border="#EBE4DD", ring="#5A1F2A")),
    ("light", ["food","warm","craft"], dict(bg="#FBF7F2", surface="#FFFFFF", text="#231712", muted="#6A5A50", primary="#9C3B1B", primaryFg="#FFFFFF", accent="#E0A458", accentFg="#2A1A07", border="#EEE4D8", ring="#9C3B1B")),
    ("light", ["beauty","soft","wellness"], dict(bg="#FCF8F8", surface="#FFFFFF", text="#241A20", muted="#6B5A63", primary="#A14A6E", primaryFg="#FFFFFF", accent="#D7A86E", accentFg="#2A1C0C", border="#F0E6EA", ring="#A14A6E")),
    ("light", ["tech","saas","trust","b2b"], dict(bg="#F6F7FB", surface="#FFFFFF", text="#10131C", muted="#4D566B", primary="#3A4DD8", primaryFg="#FFFFFF", accent="#13B07C", accentFg="#04221A", border="#E4E7F0", ring="#3A4DD8")),
    ("light", ["build","industrial","auto","strong"], dict(bg="#F6F6F4", surface="#FFFFFF", text="#16181A", muted="#565B61", primary="#1F2A37", primaryFg="#FFFFFF", accent="#E8782B", accentFg="#2A1405", border="#E5E5E1", ring="#E8782B")),
    ("light", ["eco","wellness","calm","food"], dict(bg="#F7FAF5", surface="#FFFFFF", text="#16201A", muted="#52615A", primary="#2F6B3A", primaryFg="#FFFFFF", accent="#C9A24A", accentFg="#241B06", border="#E4EBDF", ring="#2F6B3A")),
    ("light", ["fitness","energy","sport"], dict(bg="#F6F7F8", surface="#FFFFFF", text="#121417", muted="#4E555E", primary="#16181B", primaryFg="#FFFFFF", accent="#E5532E", accentFg="#FFFFFF", border="#E5E7E9", ring="#E5532E")),
    ("dark",  ["tech","saas","premium","auto"], dict(bg="#0C0E12", surface="#15181F", text="#F2F4F8", muted="#9AA3B2", primary="#5B8CFF", primaryFg="#06122E", accent="#36E0B0", accentFg="#04231A", border="#242A33", ring="#5B8CFF")),
    ("dark",  ["luxury","editorial","premium","beauty"], dict(bg="#0F0D0C", surface="#1A1715", text="#F4EFE9", muted="#A89E94", primary="#E9C77E", primaryFg="#1A1305", accent="#C9603F", accentFg="#FFFFFF", border="#2A2521", ring="#E9C77E")),
    ("dark",  ["build","industrial","strong","auto"], dict(bg="#0E0F10", surface="#181A1C", text="#F0F2F3", muted="#9BA1A7", primary="#F2F2F0", primaryFg="#121314", accent="#FF7A33", accentFg="#1F0F03", border="#262A2D", ring="#FF7A33")),
    ("dark",  ["food","warm","craft","premium"], dict(bg="#12100D", surface="#1D1915", text="#F3ECE2", muted="#AC9F8E", primary="#D98E3A", primaryFg="#1B1106", accent="#E7C26B", accentFg="#241A06", border="#2C261F", ring="#D98E3A")),
    ("light", ["trust","b2b","logistics","tech"], dict(bg="#F5F7F9", surface="#FFFFFF", text="#111922", muted="#4C5965", primary="#15466B", primaryFg="#FFFFFF", accent="#F0A92B", accentFg="#2A1B04", border="#E1E7EC", ring="#15466B")),
    ("light", ["realestate","premium","calm"], dict(bg="#F8F8F6", surface="#FFFFFF", text="#191A18", muted="#5A5E59", primary="#2A3D34", primaryFg="#FFFFFF", accent="#B98E54", accentFg="#241906", border="#E8E8E2", ring="#2A3D34")),
    ("light", ["education","trust","calm","tech"], dict(bg="#F6F8FC", surface="#FFFFFF", text="#121826", muted="#4F596B", primary="#2D4ED8", primaryFg="#FFFFFF", accent="#F2994A", accentFg="#2A1705", border="#E3E8F2", ring="#2D4ED8")),
    ("dark",  ["fitness","sport","energy"], dict(bg="#0B0C0E", surface="#16181C", text="#F1F3F5", muted="#9AA1AA", primary="#D7FF3E", primaryFg="#16180A", accent="#FF4D4D", accentFg="#FFFFFF", border="#23262B", ring="#D7FF3E")),
]

# Пары шрифтов (Google Fonts). Все с поддержкой кириллицы (важно для RU).
FONT_PAIRS = [
    dict(display="Playfair Display", body="Inter",        dW=[500,600,700], bW=[400,500,600], serif=True),
    dict(display="Prata",            body="Manrope",      dW=[400],         bW=[400,500,600,700], serif=True),
    dict(display="Cormorant Garamond", body="Manrope",    dW=[500,600,700], bW=[400,500,600], serif=True),
    dict(display="Lora",             body="Inter",        dW=[500,600,700], bW=[400,500,600], serif=True),
    dict(display="PT Serif",         body="PT Sans",      dW=[700],         bW=[400,700],     serif=True),
    dict(display="Manrope",          body="Manrope",      dW=[600,700,800], bW=[400,500,600], serif=False),
    dict(display="Montserrat",       body="Inter",        dW=[600,700,800], bW=[400,500,600], serif=False),
    dict(display="Unbounded",        body="Golos Text",   dW=[500,600,700], bW=[400,500,600], serif=False),
    dict(display="Oswald",           body="PT Sans",      dW=[500,600,700], bW=[400,700],     serif=False),
    dict(display="Rubik",            body="Rubik",        dW=[600,700],     bW=[400,500],     serif=False),
    dict(display="Raleway",          body="Nunito Sans",  dW=[600,700,800], bW=[400,600],     serif=False),
    dict(display="Bitter",           body="PT Sans",      dW=[600,700],     bW=[400,700],     serif=True),
    dict(display="Golos Text",       body="Golos Text",   dW=[600,700,800], bW=[400,500,600], serif=False),
    dict(display="Onest",            body="Onest",        dW=[600,700,800], bW=[400,500],     serif=False),
    dict(display="Comfortaa",        body="Nunito Sans",  dW=[600,700],     bW=[400,600],     serif=False),
    dict(display="Spectral",         body="Inter",        dW=[500,600,700], bW=[400,500],     serif=True),
]

RADII = ["0.25rem", "0.4rem", "0.6rem", "0.85rem", "1.1rem", "1.4rem", "1.75rem"]
SECTION_Y = ["clamp(3.5rem,8vw,6rem)", "clamp(4rem,9vw,7rem)", "clamp(4.5rem,10vw,8.5rem)", "clamp(5rem,11vw,9.5rem)"]
CONTAINER = ["64rem", "68rem", "72rem", "76rem", "80rem"]
ANIM = ["subtle", "editorial", "energetic"]
PRELOADER = ["spinner", "bar", "dots"]
HERO = ["split-left", "split-right", "bg-image", "centered", "editorial"]
HEADER = ["classic", "centered", "split", "minimal", "floating", "topbar"]

# Ключи вариантов СОВПАДАЮТ с тем, что реализовано в компонентах (templates/components/sections).
SECTION_VARIANTS = {
    "header":    HEADER,
    "hero":      HERO,
    "trustbar":  ["row", "marquee", "stat-strip"],
    "services":  ["cards", "list", "bento"],
    "features":  ["grid", "split-image", "rows"],
    "about":     ["split", "stacked", "side-stats"],
    "process":   ["stepper", "vertical", "cards"],
    "portfolio": ["grid", "masonry", "overlay"],
    "pricing":   ["cards", "table", "highlight"],
    "team":      ["grid", "cards", "row"],
    "reviews":   ["grid", "slider", "feature"],
    "faq":       ["accordion", "two-col", "bordered"],
    "cta":       ["band", "split", "card"],
    "contacts":  ["split-map", "map-top", "cards"],
}

SHADOWS = [
    "0 12px 40px -12px rgba(15,23,42,.18)",
    "0 18px 50px -20px rgba(15,23,42,.28)",
    "0 8px 30px -10px rgba(15,23,42,.14)",
    "0 24px 60px -24px rgba(0,0,0,.30)",
    "0 2px 0 0 var(--c-border), 0 14px 40px -18px rgba(15,23,42,.20)",
]

# Базовый рекомендуемый каркас (середина варьируется по seed).
CORE_OPENING = ["header", "hero", "trustbar"]
CORE_CLOSING = ["faq", "cta", "contacts", "footer"]
MIDDLE_POOL  = ["services", "features", "about", "process", "portfolio", "pricing", "team", "reviews"]
# дефолтный приоритет середины по индустрии (если в пресете не задан свой порядок)
INDUSTRY_MIDDLE = {
    "dental":      ["services","features","about","process","team","reviews","pricing"],
    "clinic":      ["services","features","about","team","process","reviews"],
    "restaurant":  ["services","about","portfolio","features","reviews"],
    "law":         ["services","about","process","features","team","reviews"],
    "construction":["services","portfolio","process","about","features","reviews"],
    "beauty":      ["services","portfolio","about","team","pricing","reviews"],
    "autoservice": ["services","features","process","about","pricing","reviews"],
    "logistics":   ["services","features","process","about","reviews"],
    "realestate":  ["services","portfolio","about","process","reviews"],
    "fitness":     ["services","features","about","pricing","team","reviews"],
    "education":   ["services","features","process","about","reviews","pricing"],
    "b2b":         ["services","features","about","process","reviews"],
    "ecommerce":   ["services","portfolio","features","about","reviews"],
    "generic":     ["services","features","about","process","reviews"],
}


# ─────────────────────────────────────────────────────────────────────────────
def seeded(domain: str, seed: int | None) -> int:
    if seed is not None:
        return seed
    h = hashlib.sha256(domain.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


class R:
    """Маленький детерминированный ГПСЧ (LCG) — без глобального random, чтобы
    разные прогоны с одним seed давали идентичный результат."""
    def __init__(self, s: int): self.s = s & 0xFFFFFFFF
    def next(self) -> int:
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s
    def pick(self, seq): return seq[self.next() % len(seq)]
    def chance(self, p: float) -> bool: return (self.next() % 1000) / 1000.0 < p
    def shuffle(self, seq):
        a = list(seq)
        for i in range(len(a) - 1, 0, -1):
            j = self.next() % (i + 1)
            a[i], a[j] = a[j], a[i]
        return a


TRANSLIT = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i",
 "й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u",
 "ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"}

def slugify(s: str) -> str:
    out = []
    for ch in s.lower():
        out.append(TRANSLIT.get(ch, ch))
    s = re.sub(r"[^a-z0-9]+", "-", "".join(out)).strip("-")
    return s or "site"


def build(domain: str, description: str, industry: str, name: str | None,
          seed: int | None, mode_force: str | None,
          primary: str | None, accent: str | None) -> dict:
    s = seeded(domain, seed)
    r = R(s)
    industry = (industry or "generic").lower()

    # vibe-теги из индустрии
    vibe_map = {
        "dental":["clinic","calm","trust"], "clinic":["clinic","trust","calm"],
        "restaurant":["food","warm","craft"], "law":["law","luxury","trust"],
        "construction":["build","industrial","strong"], "beauty":["beauty","soft","wellness"],
        "autoservice":["auto","industrial","strong"], "logistics":["logistics","trust","b2b"],
        "realestate":["realestate","premium","calm"], "fitness":["fitness","sport","energy"],
        "education":["education","trust","calm"], "b2b":["b2b","tech","trust"],
        "ecommerce":["tech","trust","premium"], "generic":["trust","tech","calm"],
    }
    vibes = vibe_map.get(industry, ["trust","tech","calm"])

    # выбор палитры: фильтр по vibe, затем по seed; режим можно форсировать
    cand = [p for p in PALETTES if any(t in p[1] for t in vibes)]
    if mode_force:
        cand2 = [p for p in cand if p[0] == mode_force]
        cand = cand2 or [p for p in PALETTES if p[0] == mode_force] or cand
    if not cand:
        cand = PALETTES
    pmode, _tags, pal = r.pick(cand)
    pal = dict(pal)
    if primary: pal["primary"] = primary; pal["ring"] = primary
    if accent:  pal["accent"] = accent

    fonts = r.pick(FONT_PAIRS)
    radius = r.pick(RADII)
    section_y = r.pick(SECTION_Y)
    container = r.pick(CONTAINER)
    shadow = r.pick(SHADOWS)
    anim = r.pick(ANIM)
    preloader = r.pick(PRELOADER)

    # варианты секций
    section_variants = {k: r.pick(v) for k, v in SECTION_VARIANTS.items()}
    hero_variant = section_variants["hero"]

    # порядок секций: ядро + перемешанная/усечённая середина
    middle = INDUSTRY_MIDDLE.get(industry, INDUSTRY_MIDDLE["generic"])[:]
    # небольшие перестановки соседних блоков (сохраняя логику), и вкл/выкл опциональных
    if r.chance(0.5) and len(middle) >= 3:
        i = r.next() % (len(middle) - 1)
        middle[i], middle[i+1] = middle[i+1], middle[i]
    # опционально убрать 0-1 необязательный блок (portfolio/pricing/team)
    optional = [x for x in ("portfolio","pricing","team","process") if x in middle]
    if optional and r.chance(0.4):
        drop = r.pick(optional)
        middle = [x for x in middle if x != drop]
    order = CORE_OPENING + middle + CORE_CLOSING
    # dedup, сохраняя порядок
    seen = set(); order = [x for x in order if not (x in seen or seen.add(x))]

    brand_name = name or domain.split(".")[0].replace("-", " ").title()
    slug = slugify(brand_name)

    return {
        "_meta": {"generator": "variation_engine.py", "seed": s, "domain": domain, "industry": industry},
        "brand": {"name": brand_name, "slug": slug, "domain": domain},
        "design": {
            "mode": pmode,
            "palette": pal,
            "fonts": {"display": {"family": fonts["display"], "weights": fonts["dW"]},
                      "body": {"family": fonts["body"], "weights": fonts["bW"]}},
            "radius": radius,
            "shadow": shadow,
            "style": f"{'-'.join(vibes[:2])}-{anim}",
            "containerMax": container,
            "sectionY": section_y,
        },
        "variation": {
            "seed": s,
            "preloader": preloader,
            "animation": anim,
            "spacing": r.pick(["compact","normal","roomy"]),
            "container": r.pick(["narrow","normal","wide"]),
            "heroVariant": hero_variant,
            "sectionVariants": section_variants,
        },
        "sections_order": order,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Движок вариативности (анти-фингерпринт) для demosite")
    ap.add_argument("--domain", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--industry", default="generic")
    ap.add_argument("--name", default=None)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--mode", choices=["light","dark"], default=None)
    ap.add_argument("--primary", default=None)
    ap.add_argument("--accent", default=None)
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    res = build(a.domain, a.description, a.industry, a.name, a.seed, a.mode, a.primary, a.accent)
    text = json.dumps(res, ensure_ascii=False, indent=2)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text); print("Записано:", a.out)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
