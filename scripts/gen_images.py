#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_images.py — батч-генерация изображений для демо-сайтов.

Основной режим: OpenAI gpt-image-1.5 (по одному арт-дирекшн-промпту на секцию).
Graceful fallback: если нет OPENAI_API_KEY — рисует ПРЕМИАЛЬНЫЕ SVG-плейсхолдеры
(брендовый градиент + зерно + лейбл секции), чтобы сайт всё равно собрался и
выглядел осмысленно. Скилл остаётся автономным при любом раскладе.

Манифест (JSON): {"palette": ["#0B0B0C","#F4F1EA","#C8A24B"], "jobs": [
  {"slug":"hero","prompt":"...","size":"1536x1024","quality":"high",
   "background":"opaque","format":"webp"},
  {"slug":"logo","prompt":"...","size":"1024x1024","background":"transparent",
   "format":"png"}
]}

Запуск:
  python3 gen_images.py --manifest images.json --out-dir public/images
  python3 gen_images.py --manifest images.json --out-dir public/images --dry-run
  python3 gen_images.py --edit --image base.png --prompt "..." --out out.png

Размеры gpt-image: 1024x1024 | 1536x1024 (альбом) | 1024x1536 (портрет).
"""
from __future__ import annotations

import argparse
import base64
import concurrent.futures as cf
import hashlib
import json
import os
import sys
import time
from pathlib import Path

ALLOWED_SIZES = {"1024x1024", "1536x1024", "1024x1536", "auto"}
ALLOWED_QUALITY = {"low", "medium", "high", "auto"}
DEFAULT_MODEL = os.environ.get("DEMOSITE_IMAGE_MODEL", "gpt-image-1.5")

# Ключ НЕ хранится в скилле. Порядок поиска: переменная окружения →
# ~/.config/demosite/.env (chmod 600, вне репозитория). Скилл предлагает
# записать ключ туда через scripts/credentials.py.
CRED_FILE = Path(os.environ.get("DEMOSITE_ENV_FILE",
                                Path.home() / ".config" / "demosite" / ".env"))


def load_local_env():
    """Подхватывает KEY=VALUE из ~/.config/demosite/.env, не переопределяя
    уже заданные переменные окружения."""
    try:
        if CRED_FILE.is_file():
            for line in CRED_FILE.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass


load_local_env()


# ─────────────────────────────────────────────────────────────────────────────
#  PLACEHOLDER (SVG) — премиальная заглушка без сети
# ─────────────────────────────────────────────────────────────────────────────

def _dims(size: str):
    if size == "auto" or "x" not in size:
        return 1536, 1024
    w, h = size.split("x")
    return int(w), int(h)


def _hex(s: str, default: str) -> str:
    s = (s or "").strip()
    return s if s.startswith("#") and len(s) in (4, 7) else default


def build_placeholder_svg(slug: str, label: str, size: str, palette, transparent=False) -> str:
    w, h = _dims(size)
    p = list(palette or [])
    bg = _hex(p[0] if len(p) > 0 else "", "#0B0B0C")
    fg = _hex(p[1] if len(p) > 1 else "", "#F4F1EA")
    acc = _hex(p[2] if len(p) > 2 else "", "#C8A24B")
    # детерминированный угол/смещение по slug — чтобы секции отличались
    hsh = int(hashlib.md5(slug.encode("utf-8")).hexdigest(), 16)
    angle = hsh % 360
    cx = 20 + (hsh >> 3) % 60
    cy = 20 + (hsh >> 7) % 60
    base_rect = "" if transparent else (
        f'<rect width="{w}" height="{h}" fill="url(#g)"/>'
        f'<rect width="{w}" height="{h}" fill="url(#grain)" opacity="0.06"/>'
    )
    label_esc = (label or slug).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    fs = max(22, min(w, h) // 22)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate({angle} 0.5 0.5)">
      <stop offset="0" stop-color="{bg}"/>
      <stop offset="0.55" stop-color="{bg}"/>
      <stop offset="1" stop-color="{acc}" stop-opacity="0.35"/>
    </linearGradient>
    <radialGradient id="spot" cx="{cx}%" cy="{cy}%" r="75%">
      <stop offset="0" stop-color="{fg}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="{fg}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  {base_rect}
  <rect width="{w}" height="{h}" fill="url(#spot)"/>
  <g opacity="0.16" stroke="{fg}" stroke-width="1" fill="none">
    <circle cx="{int(w*0.82)}" cy="{int(h*0.28)}" r="{int(min(w,h)*0.16)}"/>
    <circle cx="{int(w*0.82)}" cy="{int(h*0.28)}" r="{int(min(w,h)*0.10)}"/>
    <rect x="{int(w*0.08)}" y="{int(h*0.60)}" width="{int(w*0.22)}" height="{int(h*0.22)}"/>
    <line x1="0" y1="{int(h*0.5)}" x2="{w}" y2="{int(h*0.34)}"/>
  </g>
  <g opacity="0.10" fill="{acc}"><circle cx="{int(w*0.2)}" cy="{int(h*0.3)}" r="{int(min(w,h)*0.06)}"/></g>
</svg>'''
    # ВНИМАНИЕ: плейсхолдер НЕ содержит текста (никаких слов-маркеров) — это
    # абстрактный брендовый фон, чтобы витрина оставалась правдоподобной.


def write_placeholder(job, out_dir: Path, palette) -> dict:
    slug = job["slug"]
    size = job.get("size", "1536x1024")
    transparent = job.get("background") == "transparent"
    svg = build_placeholder_svg(slug, job.get("label", slug), size, job.get("palette") or palette, transparent)
    svg_path = out_dir / f"{slug}.svg"
    svg_path.write_text(svg, encoding="utf-8")
    result = {"slug": slug, "mode": "placeholder", "path": str(svg_path), "size": size}
    # по возможности растеризуем в webp/png, чтобы <img src> работал единообразно
    fmt = job.get("format", "webp")
    if fmt in ("webp", "png", "jpeg"):
        try:
            import cairosvg  # type: ignore
            raster = out_dir / f"{slug}.{fmt if fmt != 'jpeg' else 'jpg'}"
            cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(raster.with_suffix('.png')))
            if fmt != "png":
                from PIL import Image  # type: ignore
                im = Image.open(raster.with_suffix('.png')).convert("RGBA" if transparent else "RGB")
                im.save(raster if fmt != "jpeg" else raster.with_suffix(".jpg"))
                if fmt != "png":
                    raster.with_suffix('.png').unlink(missing_ok=True)
            result["raster"] = str(raster)
        except Exception:
            pass  # cairosvg не обязателен — SVG самодостаточен
    return result


# ─────────────────────────────────────────────────────────────────────────────
#  OPENAI gpt-image
# ─────────────────────────────────────────────────────────────────────────────

def _client():
    try:
        from openai import OpenAI  # type: ignore
    except ImportError:
        print("Error: пакет 'openai' не установлен. Установите: uv pip install openai", file=sys.stderr)
        raise SystemExit(3)
    return OpenAI()


def _save_b64(b64: str, path: Path):
    path.write_bytes(base64.b64decode(b64))


def generate_one(client, job: dict, out_dir: Path, model: str, retries: int = 3) -> dict:
    slug = job["slug"]
    size = job.get("size", "1536x1024")
    if size not in ALLOWED_SIZES:
        size = "1536x1024"
    fmt = job.get("format", "png")
    payload = {
        "model": model,
        "prompt": job["prompt"],
        "size": size,
        "n": 1,
    }
    if job.get("quality") in ALLOWED_QUALITY:
        payload["quality"] = job["quality"]
    if job.get("background") in ("transparent", "opaque", "auto"):
        payload["background"] = job["background"]
        if job["background"] == "transparent" and fmt == "jpeg":
            fmt = "png"
    if fmt in ("png", "jpeg", "webp"):
        payload["output_format"] = fmt
    ext = "jpg" if fmt == "jpeg" else fmt
    out_path = out_dir / f"{slug}.{ext}"

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            res = client.images.generate(**payload)
            _save_b64(res.data[0].b64_json, out_path)
            return {"slug": slug, "mode": "ai", "path": str(out_path), "size": size, "model": model}
        except Exception as e:  # noqa
            last_err = e
            msg = str(e)
            # деградация неподдерживаемых параметров
            if "output_format" in payload and ("output_format" in msg or "unsupported" in msg.lower()):
                payload.pop("output_format", None); out_path = out_dir / f"{slug}.png"
            elif "quality" in payload and "quality" in msg:
                payload.pop("quality", None)
            elif "background" in payload and "background" in msg:
                payload.pop("background", None)
            time.sleep(min(2 ** attempt, 8))
    print(f"  ! {slug}: ошибка генерации после {retries} попыток: {last_err}", file=sys.stderr)
    return {"slug": slug, "mode": "error", "error": str(last_err)}


def edit_image(image_path: str, prompt: str, out: str, model: str, fidelity: str = "high"):
    client = _client()
    with open(image_path, "rb") as f:
        res = client.images.edit(model=model, image=f, prompt=prompt, input_fidelity=fidelity, n=1)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    _save_b64(res.data[0].b64_json, Path(out))
    print(f"Записано: {out}")


# ─────────────────────────────────────────────────────────────────────────────
#  RUNNER
# ─────────────────────────────────────────────────────────────────────────────

def run_manifest(manifest_path: str, out_dir: str, model: str, concurrency: int,
                 dry_run: bool, force_placeholder: bool):
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)
    jobs = manifest.get("jobs", [])
    palette = manifest.get("palette", [])
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print(f"DRY-RUN: {len(jobs)} задач → {out_dir} (model={model})")
        for j in jobs:
            print(f"  · {j['slug']:<22} {j.get('size','1536x1024'):<10} "
                  f"{j.get('background','opaque'):<11} {j.get('format','webp'):<5} "
                  f"| {j['prompt'][:80]}…")
        return 0

    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    use_ai = has_key and not force_placeholder

    results = []
    if use_ai:
        print(f"Генерация {len(jobs)} изображений через {model} (OPENAI_API_KEY найден)…")
        client = _client()
        with cf.ThreadPoolExecutor(max_workers=max(1, concurrency)) as ex:
            futs = {ex.submit(generate_one, client, j, out, model): j for j in jobs}
            for fut in cf.as_completed(futs):
                r = fut.result()
                results.append(r)
                tag = {"ai": "✓", "placeholder": "▢", "error": "✗"}.get(r["mode"], "?")
                print(f"  {tag} {r['slug']} → {r.get('path', r.get('error',''))}")
        # для упавших — плейсхолдер, чтобы сайт не сломался
        for r in results:
            if r["mode"] == "error":
                job = next(j for j in jobs if j["slug"] == r["slug"])
                ph = write_placeholder(job, out, palette)
                r.update(ph)
                print(f"  ▢ {r['slug']} → fallback placeholder")
    else:
        reason = "force --placeholder" if force_placeholder else "OPENAI_API_KEY не задан"
        print(f"⚠ AI-генерация пропущена ({reason}). Рисую премиальные SVG-плейсхолдеры.")
        print("  Для реальных изображений: export OPENAI_API_KEY=... && повторите запуск.")
        for j in jobs:
            r = write_placeholder(j, out, palette)
            results.append(r)
            print(f"  ▢ {r['slug']} → {r['path']}")

    lock = {"model": model if use_ai else None,
            "mode": "ai" if use_ai else "placeholder",
            "out_dir": str(out), "results": results}
    (out / "images.lock.json").write_text(json.dumps(lock, ensure_ascii=False, indent=2), encoding="utf-8")
    n_ai = sum(1 for r in results if r["mode"] == "ai")
    n_ph = sum(1 for r in results if r["mode"] == "placeholder")
    print(f"\nГотово: AI={n_ai}, плейсхолдеры={n_ph}. Манифест результата: {out/'images.lock.json'}")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Батч-генерация изображений (gpt-image-1.5 + SVG fallback)")
    ap.add_argument("--manifest")
    ap.add_argument("--out-dir", default="public/images")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--placeholder", action="store_true", help="принудительно SVG-плейсхолдеры, без API")
    # edit-режим
    ap.add_argument("--edit", action="store_true")
    ap.add_argument("--image")
    ap.add_argument("--prompt")
    ap.add_argument("--out")
    args = ap.parse_args(argv)

    if args.edit:
        if not (args.image and args.prompt and args.out):
            ap.error("--edit требует --image --prompt --out")
        edit_image(args.image, args.prompt, args.out, args.model)
        return 0

    if not args.manifest:
        ap.error("нужен --manifest (или --edit)")
    return run_manifest(args.manifest, args.out_dir, args.model, args.concurrency,
                        args.dry_run, args.placeholder)


if __name__ == "__main__":
    sys.exit(main())
