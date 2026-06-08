#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_mascot.py — генератор МАСКОТА (персонажа) для сайтов, которым он уместен:
детская стоматология/клиника, образование/детский центр, зоо, семейные кафе,
развлечения и т.п. Контекст учитывается через --industry и свободный --theme.

Маскот = дружелюбный персонаж в фирменных цветах, прозрачный фон, без текста.
Используется в hero/секциях как иллюстрация. По умолчанию — gpt-image-1.5
(качество персонажа важнее), модель можно переопределить.

  python3 gen_mascot.py --name "Дентал Кидс" --industry dental \
      --theme "детская стоматология, дружелюбный зуб-супергерой" \
      --primary '#19B5A8' --accent '#FF7A33' --out public/images/mascot.png

Нужен OPENAI_API_KEY (env или ~/.config/demosite/.env). Без ключа — выходит с сообщением.
"""
from __future__ import annotations
import argparse, base64, os, sys
from pathlib import Path

MODEL = os.environ.get("DEMOSITE_MASCOT_MODEL", "gpt-image-1.5")
CRED_FILE = Path(os.environ.get("DEMOSITE_ENV_FILE", Path.home() / ".config" / "demosite" / ".env"))

# базовые идеи маскота по нишам (если не задан свой --theme)
THEME_BY_INDUSTRY = {
    "dental": "a friendly cute tooth character with a big smile, kids dentistry mascot",
    "clinic": "a friendly cartoon doctor or caring helper character",
    "education": "a cheerful owl or smart friendly character with a book, kids learning mascot",
    "fitness": "an energetic friendly sporty character",
    "restaurant": "a cheerful chef character or a cute food character",
    "beauty": "a graceful friendly character with a soft elegant vibe",
    "ecommerce": "a friendly delivery helper character",
    "realestate": "a friendly character holding a small house",
}


def _load_local_env():
    try:
        if CRED_FILE.is_file():
            for line in CRED_FILE.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass


def main(argv=None):
    ap = argparse.ArgumentParser(description="Генератор маскота (gpt-image)")
    ap.add_argument("--name", default="")
    ap.add_argument("--industry", default="")
    ap.add_argument("--theme", default="", help="свободное описание персонажа/контекста")
    ap.add_argument("--primary", default="#0B3D2E")
    ap.add_argument("--accent", default="#C8A24B")
    ap.add_argument("--size", default="1024x1536", choices=["1024x1024", "1024x1536", "1536x1024"])
    ap.add_argument("--quality", default="medium", choices=["low", "medium", "high", "auto"])
    ap.add_argument("--model", default=MODEL)
    ap.add_argument("--out", required=True)
    a = ap.parse_args(argv)

    _load_local_env()
    if not os.environ.get("OPENAI_API_KEY"):
        print("Маскот пропущен: нет OPENAI_API_KEY. Установите ключ и повторите.", file=sys.stderr)
        return 2
    try:
        from openai import OpenAI
    except ImportError:
        print("Error: пакет openai не установлен (uv pip install openai)", file=sys.stderr)
        return 3

    theme = a.theme or THEME_BY_INDUSTRY.get((a.industry or "").lower(), "a friendly approachable brand mascot character")
    prompt = (
        f"A friendly, cute brand MASCOT character: {theme}. "
        f"Modern flat vector illustration, clean lines, soft shapes, expressive friendly face, full body, "
        f"brand colors {a.primary} and {a.accent}, fully transparent background, centered, "
        f"appealing and trustworthy, suitable for a Russian business website. "
        f"No text, no letters, no watermark, no realistic photo, no harsh shadows."
    )
    out = Path(a.out).with_suffix(".png")
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        client = OpenAI()
        res = client.images.generate(model=a.model, prompt=prompt, size=a.size,
                                      background="transparent", output_format="png", quality=a.quality, n=1)
        out.write_bytes(base64.b64decode(res.data[0].b64_json))
        print(f"Маскот ({a.model}): {out}")
        return 0
    except Exception as e:  # noqa
        print(f"Error: маскот не сгенерирован: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
