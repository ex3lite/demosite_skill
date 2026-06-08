"use client";
import { useEffect } from "react";

/**
 * Единый клиентский слой сайта (монтируется один раз в layout):
 *  1) Чистая навигация: перехватывает клики по внутренним якорям a[href^="#"],
 *     плавно скроллит к секции и НЕ меняет адресную строку (без #hash в URL).
 *     Внешние ссылки, tel:, mailto:, [data-no-scroll] — не трогаются.
 *  2) Reveal-on-scroll: добавляет класс is-in элементам .ds-reveal/.ds-stagger/…,
 *     что позволяет секциям оставаться серверными компонентами (без хуков).
 *  3) Подсветка активного пункта меню (data-spy) по текущей секции.
 */
export function SiteClient() {
  useEffect(() => {
    // — 1. clean-URL smooth scroll —
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.hasAttribute("data-no-scroll")) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // URL намеренно не трогаем — адресная строка остаётся чистой
    };
    document.addEventListener("click", onClick);

    // — 2. reveal-on-scroll —
    const sel = ".ds-reveal, .ds-reveal-blur, .ds-stagger, .ds-scale";
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    const scan = () => document.querySelectorAll(sel).forEach((el) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    });
    scan();
    const t = setTimeout(scan, 350);

    // — 3. scroll-spy для пунктов меню с data-spy —
    const spies = Array.from(document.querySelectorAll<HTMLElement>("[data-spy]"));
    let spyIO: IntersectionObserver | null = null;
    if (spies.length) {
      const ids = spies.map((s) => s.getAttribute("data-spy")!).filter(Boolean);
      const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
      spyIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const id = en.target.id;
              spies.forEach((s) => s.toggleAttribute("data-active", s.getAttribute("data-spy") === id));
            }
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      sections.forEach((s) => spyIO!.observe(s));
    }

    return () => {
      document.removeEventListener("click", onClick);
      io.disconnect();
      spyIO?.disconnect();
      clearTimeout(t);
    };
  }, []);

  return null;
}
