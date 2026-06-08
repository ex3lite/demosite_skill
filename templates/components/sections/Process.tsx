import { variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export default function Process({ data }: { data: Section }) {
  const v = variantOf("process", "stepper");
  const steps: { n?: number; title: string; desc: string }[] = data.steps ?? [];

  const eyebrow = data.eyebrow ?? "Как мы работаем";
  const title = data.title ?? "Этапы работы";
  const subtitle = data.subtitle;

  // ── Вариант: vertical — таймлайн-лента слева ──────────────────────────────
  if (v === "vertical") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <ol className="ds-stagger relative mx-auto max-w-3xl space-y-10 border-l border-border pl-8 sm:pl-10">
          {steps.map((step, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[2.45rem] sm:-left-[3.05rem] top-0 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface font-display text-sm font-semibold text-primary tabular-nums shadow-[var(--shadow-card)]">
                {step.n ?? i + 1}
              </span>
              <h3 className="font-display text-xl font-semibold text-text">{step.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>
      </SectionWrap>
    );
  }

  // ── Вариант: cards — карточки-шаги с крупным номером в углу ────────────────
  if (v === "cards") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <div className="ds-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="ds-hover-lift relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-7"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-3 select-none font-display text-7xl font-semibold leading-none text-primary/8 tabular-nums"
              >
                {step.n ?? i + 1}
              </span>
              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 font-display text-base font-semibold text-accent tabular-nums">
                  {step.n ?? i + 1}
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionWrap>
    );
  }

  // ── Вариант по умолчанию: stepper — горизонтальный на lg ───────────────────
  return (
    <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-border lg:block"
        />
        <ol className="ds-stagger relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, i) => (
            <li key={i} className="relative">
              <div className="flex items-center gap-4 lg:block">
                <span className="relative z-10 inline-grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface font-display text-3xl font-semibold leading-none text-accent/50 tabular-nums lg:h-auto lg:w-auto lg:place-items-start lg:bg-transparent lg:text-5xl">
                  {step.n ?? i + 1}
                </span>
                <h3 className="font-display text-lg font-semibold text-text lg:mt-5">{step.title}</h3>
              </div>
              <p className="mt-3 text-muted leading-relaxed lg:mt-2">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </SectionWrap>
  );
}
