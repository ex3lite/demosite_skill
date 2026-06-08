#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_image_imports.py — генерирует <project>/lib/images.ts, импортируя ВСЕ картинки
из <project>/assets/images/ как модули. Тогда бандлер (webpack/turbopack) кладёт их в
/_next/static/media/* — и вся статика сайта (картинки, логотип, маскот) едет из одного
места _next/static, без отдельного public/images.

  python3 gen_image_imports.py <project-dir>

Слаг картинки = имя файла без расширения (hero.webp → "hero"). Запускать ПОСЛЕ генерации
картинок/логотипа/маскота в assets/images/ и перед npm build.
"""
from __future__ import annotations
import sys
from pathlib import Path

EXT = {".webp", ".png", ".jpg", ".jpeg", ".avif", ".svg"}


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print("usage: gen_image_imports.py <project-dir>", file=sys.stderr)
        return 2
    proj = Path(argv[0])
    imgdir = proj / "assets" / "images"
    out = proj / "lib" / "images.ts"
    out.parent.mkdir(parents=True, exist_ok=True)

    files = []
    if imgdir.is_dir():
        files = sorted(f for f in imgdir.iterdir() if f.is_file() and f.suffix.lower() in EXT)

    head = [
        "// АВТОГЕНЕРАЦИЯ (scripts/gen_image_imports.py). Не редактировать вручную.",
        "// Картинки импортируются как модули → бандл /_next/static/media/* (НЕ public).",
    ]
    imports, entries = [], []
    for i, f in enumerate(files):
        slug = f.stem
        var = f"i{i}"
        imports.append(f'import {var} from "@/assets/images/{f.name}";')
        # StaticImageData имеет .src; svg может прийти строкой — берём .src ?? сам объект
        entries.append(f'  {slug!r}: (({var} as unknown) as {{ src?: string }}).src ?? ({var} as unknown as string),')

    body = "\n".join(head + [""] + imports + ["", "export const IMAGES: Record<string, string> = {"] + entries + ["};", ""])
    out.write_text(body, encoding="utf-8")
    print(f"lib/images.ts: {len(files)} картинок импортировано в бандл ({', '.join(f.stem for f in files) or 'пусто'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
