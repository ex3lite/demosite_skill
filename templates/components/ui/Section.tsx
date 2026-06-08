import type { ReactNode } from "react";
import { Container } from "./Container";

type Tone = "default" | "surface" | "primary" | "dark";

const TONE: Record<Tone, string> = {
  default: "bg-bg text-text",
  surface: "bg-surface text-text",
  primary: "bg-primary text-primary-fg",
  dark: "bg-[#0b0b0c] text-white",
};

export function Section({
  id, eyebrow, title, subtitle, tone = "default", align = "left",
  className = "", containerClassName = "", children,
}: {
  id?: string; eyebrow?: string; title?: string; subtitle?: string;
  tone?: Tone; align?: "left" | "center"; className?: string;
  containerClassName?: string; children?: ReactNode;
}) {
  const hasHeader = eyebrow || title || subtitle;
  return (
    <section id={id} style={{ paddingBlock: "var(--section-y)" }}
      className={`scroll-mt-24 ${TONE[tone]} ${className}`}>
      <Container className={containerClassName}>
        {hasHeader && (
          <div className={`ds-reveal mb-12 sm:mb-16 max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
            {eyebrow && (
              <div className={`mb-3 flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-accent ${align === "center" ? "justify-center" : ""}`}>
                <span className="inline-block h-px w-8 bg-accent/60" />{eyebrow}
              </div>
            )}
            {title && <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] font-semibold">{title}</h2>}
            {subtitle && <p className="mt-4 text-lg text-muted leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
