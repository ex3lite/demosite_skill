"use client";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";

/** Брендовый экран загрузки. Скрывается после window.load (с фоллбэком).
 *  Вариант берётся из site.variation.preloader → дополнительная непохожесть сайтов. */
export function Preloader() {
  const [hidden, setHidden] = useState(false);
  const variant: string = (site as any).variation?.preloader ?? "spinner";

  useEffect(() => {
    const hide = () => setHidden(true);
    let t: ReturnType<typeof setTimeout>;
    if (document.readyState === "complete") {
      t = setTimeout(hide, 350);
    } else {
      window.addEventListener("load", hide);
    }
    const fallback = setTimeout(hide, 2600);
    return () => { window.removeEventListener("load", hide); clearTimeout(t); clearTimeout(fallback); };
  }, []);

  return (
    <div className="ds-preloader" data-hidden={hidden} aria-hidden={hidden}>
      <div className="flex flex-col items-center gap-5">
        <span className="font-display text-2xl font-semibold tracking-tight text-text">{site.brand.name}</span>

        {variant === "bar" && (
          <span className="block h-[3px] w-40 overflow-hidden rounded-full bg-border">
            <span className="block h-full w-1/3 rounded-full bg-primary"
              style={{ animation: "ds-marquee 1s var(--ease-in-out) infinite alternate" }} />
          </span>
        )}
        {variant === "dots" && (
          <span className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-primary"
                style={{ animation: "ds-float 0.9s ease-in-out infinite", animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
        )}
        {(variant === "spinner" || (variant !== "bar" && variant !== "dots")) && (
          <span className="ds-spinner block h-7 w-7 rounded-full border-2 border-border"
            style={{ borderTopColor: "var(--color-primary)" }} />
        )}
      </div>
    </div>
  );
}
