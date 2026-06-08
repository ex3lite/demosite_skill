#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
credentials.py — управление ключами для demosite. Ключ НИКОГДА не хранится
в репозитории скилла. Хранилище: ~/.config/demosite/.env (chmod 600).

Порядок резолва ключа (используется и в gen_images.py):
  1) переменная окружения (например OPENAI_API_KEY)
  2) ~/.config/demosite/.env

Команды:
  python3 credentials.py --check [--name OPENAI_API_KEY]
      → печатает маскированный статус (есть/нет), код возврата 0/1
  python3 credentials.py --set --name OPENAI_API_KEY
      → читает значение из STDIN (не из argv!), сохраняет в ~/.config/demosite/.env
  python3 credentials.py --path
      → печатает путь к файлу хранилища

Запись из STDIN важна: ключ не попадёт ни в историю shell, ни в список процессов.
Пример безопасной записи:  printf '%s' "$KEY" | python3 credentials.py --set --name OPENAI_API_KEY
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

CRED_FILE = Path(os.environ.get("DEMOSITE_ENV_FILE",
                                Path.home() / ".config" / "demosite" / ".env"))


def _read() -> dict:
    data = {}
    if CRED_FILE.is_file():
        for line in CRED_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                data[k.strip()] = v.strip()
    return data


def _write(data: dict):
    CRED_FILE.parent.mkdir(parents=True, exist_ok=True)
    body = "\n".join(f"{k}={v}" for k, v in data.items()) + "\n"
    # атомарно + права 600
    tmp = CRED_FILE.with_suffix(".tmp")
    fd = os.open(str(tmp), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(body)
    os.replace(tmp, CRED_FILE)
    os.chmod(CRED_FILE, 0o600)


def resolve(name: str) -> str | None:
    if os.environ.get(name):
        return os.environ[name]
    return _read().get(name)


def mask(v: str) -> str:
    if not v:
        return "(пусто)"
    return (v[:8] + "…" + v[-4:]) if len(v) > 16 else "***"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Управление ключами demosite (вне репозитория)")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--set", action="store_true")
    ap.add_argument("--path", action="store_true")
    ap.add_argument("--name", default="OPENAI_API_KEY")
    args = ap.parse_args(argv)

    if args.path:
        print(CRED_FILE)
        return 0

    if args.check:
        v = resolve(args.name)
        src = "env" if os.environ.get(args.name) else ("file" if v else "—")
        if v:
            print(f"{args.name}: найден ({src}) {mask(v)}")
            return 0
        print(f"{args.name}: НЕ найден. Установите: "
              f"printf '%s' \"<KEY>\" | python3 {Path(__file__).name} --set --name {args.name}")
        return 1

    if args.set:
        if sys.stdin.isatty():
            print("Ошибка: значение читается из STDIN. "
                  f"Пример: printf '%s' \"<KEY>\" | python3 {Path(__file__).name} --set --name {args.name}",
                  file=sys.stderr)
            return 2
        value = sys.stdin.read().strip()
        if not value:
            print("Ошибка: пустое значение.", file=sys.stderr)
            return 2
        data = _read()
        data[args.name] = value
        _write(data)
        print(f"Сохранено {args.name} → {CRED_FILE} (chmod 600): {mask(value)}")
        return 0

    ap.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
