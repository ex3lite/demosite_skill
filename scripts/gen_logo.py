#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_logo.py — генератор чистого ВЕКТОРНОГО логотипа (рукописный SVG-монограмм).

Почему SVG, а не gpt-image: вектор крупно-чёткий на любом размере, лёгкий,
без AI-артефактов, выглядит как настоящий лого студии. Стиль выбирается по seed
(6+ вариантов) → ещё один слой непохожести сайтов.

CLI:
  python3 gen_logo.py --name "Дентал-Люкс" --primary '#0B3D2E' --accent '#C8A24B' \
      --bg '#FFFFFF' --seed 7 --out public/images/logo.svg [--style auto] [--favicon public/favicon.svg]

viewBox 0 0 64 64, без width/height (размер задаёт CSS). Использует initials бренда.
"""
from __future__ import annotations
import argparse, base64, hashlib, os, sys
from pathlib import Path

STYLES = ["circle", "rounded", "outline", "split", "hexagon", "ring", "bars", "shield"]

# слабая (дешёвая) модель для простого логотипа — по просьбе: «слабая модель chatgpt»
AI_LOGO_MODEL = os.environ.get("DEMOSITE_LOGO_MODEL", "gpt-image-1-mini")
CRED_FILE = Path(os.environ.get("DEMOSITE_ENV_FILE", Path.home() / ".config" / "demosite" / ".env"))


def _load_local_env():
    try:
        if CRED_FILE.is_file():
            for line in CRED_FILE.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, val = line.split("=", 1)
                    os.environ.setdefault(k.strip(), val.strip())
    except Exception:
        pass


_INDUSTRY_SYMBOL = {
    "dental": "a single tooth or a gentle smile arc", "clinic": "a medical cross or pulse line",
    "restaurant": "a fork and spoon or a flame", "law": "scales of justice or a column",
    "construction": "a building block, crane or roof shape", "beauty": "a petal, leaf or drop",
    "autoservice": "a gear or wrench", "logistics": "an arrow, truck or route line",
    "realestate": "a house or key", "fitness": "a dumbbell or dynamic stroke",
    "education": "an open book or graduation cap", "b2b": "an abstract geometric mark",
    "ecommerce": "a shopping bag or tag",
}


def gen_ai_logo(name, industry, primary, accent, out: Path, favicon: Path | None) -> bool:
    """Генерирует простой логотип-символ через gpt-image-1-mini (прозрачный PNG).
    Возвращает True при успехе, иначе False (нужен фолбэк на SVG)."""
    _load_local_env()
    if not os.environ.get("OPENAI_API_KEY"):
        return False
    try:
        from openai import OpenAI
    except ImportError:
        print("Warning: пакет openai не установлен — фолбэк на SVG-логотип", file=sys.stderr)
        return False
    sym = _INDUSTRY_SYMBOL.get((industry or "").lower(), "a clean abstract geometric mark")
    prompt = (
        f"A simple minimalist flat vector LOGO ICON (symbol only, NO text, NO letters, NO words) "
        f"for a {industry or 'service'} business. The icon is {sym}. "
        f"Single clean geometric symbol, two solid colors {primary} and {accent}, fully transparent background, "
        f"centered, app-icon style, bold and legible at small size, high contrast, "
        f"no gradient mesh, no 3D, no realistic detail, no photo, no shadow, no watermark, no text."
    )
    # OpenAI — ТОЛЬКО для картинок: запрещаем не-image модель
    if not str(AI_LOGO_MODEL).startswith(("gpt-image", "dall-e")):
        print(f"Warning: '{AI_LOGO_MODEL}' не image-модель — фолбэк на SVG", file=sys.stderr)
        return False
    try:
        client = OpenAI()
        res = client.images.generate(model=AI_LOGO_MODEL, prompt=prompt, size="1024x1024",
                                      background="transparent", output_format="png", quality="low", n=1)
        out = out.with_suffix(".png")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(base64.b64decode(res.data[0].b64_json))
        print(f"Логотип (AI {AI_LOGO_MODEL}): {out}")
        if favicon:
            fav = favicon.with_suffix(".png")
            fav.parent.mkdir(parents=True, exist_ok=True)
            fav.write_bytes(out.read_bytes())
            print(f"Favicon: {fav}")
        return True
    except Exception as e:  # noqa
        print(f"Warning: AI-логотип не сгенерирован ({e}) — фолбэк на SVG", file=sys.stderr)
        return False


def _seed(name: str, seed) -> int:
    if seed is not None:
        return int(seed)
    return int(hashlib.sha256(name.encode("utf-8")).hexdigest()[:8], 16)


def initials(name: str) -> str:
    parts = [p for p in name.replace("«", "").replace("»", "").split() if p[:1].isalnum()]
    if not parts:
        return (name[:1] or "A").upper()
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][:1] + parts[1][:1]).upper()


def _txt(s, fill, size=28, weight=700, serif=False, y=39):
    fam = "Georgia, 'Times New Roman', serif" if serif else "-apple-system, 'Segoe UI', Arial, sans-serif"
    return (f'<text x="32" y="{y}" text-anchor="middle" font-family="{fam}" '
            f'font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'letter-spacing="0.5">{s}</text>')


def build(name, primary, accent, bg, seed, style, serif=False) -> str:
    s = _seed(name, seed)
    if style in (None, "auto"):
        style = STYLES[s % len(STYLES)]
    ini = initials(name)
    one = ini[:1]
    open_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="' + name.replace('"', "") + '">'

    if style == "circle":
        body = f'<circle cx="32" cy="32" r="30" fill="{primary}"/>' + _txt(ini, "#FFFFFF", 26, 700, serif)
    elif style == "rounded":
        body = (f'<rect x="2" y="2" width="60" height="60" rx="16" fill="{primary}"/>'
                + f'<rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="{accent}" stroke-width="0"/>'
                + _txt(ini, "#FFFFFF", 26, 700, serif))
    elif style == "outline":
        body = (f'<rect x="3" y="3" width="58" height="58" rx="14" fill="{bg}" stroke="{primary}" stroke-width="3"/>'
                + _txt(ini, primary, 26, 700, serif)
                + f'<circle cx="50" cy="14" r="4" fill="{accent}"/>')
    elif style == "split":
        body = (f'<defs><clipPath id="r"><rect x="2" y="2" width="60" height="60" rx="16"/></clipPath></defs>'
                f'<g clip-path="url(#r)"><rect x="2" y="2" width="60" height="60" fill="{primary}"/>'
                f'<path d="M2 62 L62 2 L62 62 Z" fill="{accent}"/></g>'
                + _txt(one, "#FFFFFF", 30, 800, serif))
    elif style == "hexagon":
        body = (f'<path d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z" fill="{primary}"/>'
                + _txt(ini, "#FFFFFF", 24, 700, serif)
                + f'<path d="M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z" fill="none" stroke="{accent}" stroke-width="2" opacity="0.5"/>')
    elif style == "ring":
        body = (f'<circle cx="32" cy="32" r="29" fill="none" stroke="{primary}" stroke-width="4"/>'
                f'<circle cx="32" cy="6" r="4" fill="{accent}"/>'
                + _txt(ini, primary, 24, 700, serif))
    elif style == "bars":
        body = (f'<rect x="2" y="2" width="60" height="60" rx="14" fill="{bg}" stroke="{primary}" stroke-width="2.5"/>'
                f'<rect x="16" y="34" width="7" height="16" rx="2" fill="{primary}"/>'
                f'<rect x="28.5" y="22" width="7" height="28" rx="2" fill="{accent}"/>'
                f'<rect x="41" y="28" width="7" height="22" rx="2" fill="{primary}"/>')
    elif style == "shield":
        body = (f'<path d="M32 3 L57 11 V31 C57 47 45 56 32 61 C19 56 7 47 7 31 V11 Z" fill="{primary}"/>'
                + _txt(one, "#FFFFFF", 28, 800, serif)
                + f'<path d="M32 3 L57 11 V31 C57 47 45 56 32 61 C19 56 7 47 7 31 V11 Z" fill="none" stroke="{accent}" stroke-width="1.5" opacity="0.55"/>')
    else:
        body = f'<circle cx="32" cy="32" r="30" fill="{primary}"/>' + _txt(ini, "#FFFFFF", 26, 700, serif)

    return open_svg + body + "</svg>"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Генератор SVG-логотипа (монограмм, варианты по seed)")
    ap.add_argument("--name", required=True)
    ap.add_argument("--primary", default="#0B3D2E")
    ap.add_argument("--accent", default="#C8A24B")
    ap.add_argument("--bg", default="#FFFFFF")
    ap.add_argument("--seed", default=None)
    ap.add_argument("--style", default="auto", choices=["auto"] + STYLES)
    ap.add_argument("--serif", action="store_true")
    ap.add_argument("--ai", action="store_true", help="сгенерировать простой логотип через gpt-image-1-mini")
    ap.add_argument("--industry", default="", help="ниша — для символа AI-логотипа")
    ap.add_argument("--out", required=True)
    ap.add_argument("--favicon", default=None)
    a = ap.parse_args(argv)

    if a.ai:
        out_p = Path(a.out); fav_p = Path(a.favicon) if a.favicon else None
        if gen_ai_logo(a.name, a.industry, a.primary, a.accent, out_p, fav_p):
            return 0
        # иначе — падаем в SVG-фолбэк ниже

    svg = build(a.name, a.primary, a.accent, a.bg, a.seed, a.style, a.serif)
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg, encoding="utf-8")
    print(f"Логотип: {out}  ({len(svg)} байт, стиль {a.style})")

    if a.favicon:
        fav = Path(a.favicon); fav.parent.mkdir(parents=True, exist_ok=True)
        fav.write_text(svg, encoding="utf-8")
        print(f"Favicon: {fav}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
