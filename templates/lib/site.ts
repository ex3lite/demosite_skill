import data from "@/data/site.json";
import type { Site, Img } from "./types";

export const site = data as unknown as Site;

/** Путь к картинке по slug с безопасным фолбэком. */
export function img(slug?: string): Img | undefined {
  if (!slug) return undefined;
  return site.images?.[slug] ?? (slug.startsWith("/") ? slug : undefined);
}

/** Форматирование числа в рублях: 12000 → "12 000 ₽". */
export function rub(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

/** Дата ISO → "12 марта 2025". */
const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа",
  "сентября","октября","ноября","декабря"];
export function ruDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Телефон → tel: ссылка (только цифры и +). */
export function tel(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

/** Вариант секции из профиля вариативности (анти-фингерпринт). */
export function variantOf(sectionType: string, fallback: string): string {
  return site.variation?.sectionVariants?.[sectionType] ?? fallback;
}

/** Латинская инициализация для аватаров-заглушек и т.п. */
export function initials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}
