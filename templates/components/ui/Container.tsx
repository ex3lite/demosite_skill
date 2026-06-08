import type { ReactNode } from "react";

/** Контейнер. Ширина — из --container-max (варьируется движком вариативности). */
export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`mx-auto w-full max-w-[var(--container-max)] px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
