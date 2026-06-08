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
import argparse, hashlib, sys
from pathlib import Path

STYLES = ["circle", "rounded", "outline", "split", "hexagon", "ring", "bars", "shield"]


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
    ap.add_argument("--out", required=True)
    ap.add_argument("--favicon", default=None)
    a = ap.parse_args(argv)

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
