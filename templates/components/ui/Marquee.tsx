import type { ReactNode } from "react";

/** Бесконечная бегущая лента (CSS-анимация, off-main-thread). Дублирует контент
 *  для бесшовного цикла; пауза по hover. duration — секунды на проход. */
export function Marquee({ children, duration = 32, className = "" }: {
  children: ReactNode; duration?: number; className?: string;
}) {
  return (
    <div className={`ds-marquee-track relative overflow-hidden ${className}`}
      style={{ maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
      <div className="ds-marquee flex w-max items-center gap-12 pr-12"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
