import { site, img, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export default function Features({ data }: { data: Section }) {
  const v = variantOf("features", "grid");
  const items: { icon?: string; title: string; desc: string }[] = data.items ?? [];

  // ── split-image: визуал слева + список фич справа ──────────────────────────
  if (v === "split-image") {
    const image = img(data.image) ?? img("about");
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Почему мы"}
        title={data.title ?? "Почему выбирают нас"}
        subtitle={data.subtitle}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="ds-reveal">
            {image ? (
              <img
                src={image}
                alt="Команда за работой"
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow-card)]"
              />
            ) : (
              <div className="flex aspect-[4/5] flex-col justify-center rounded-[var(--radius)] bg-primary/5 p-10 shadow-[var(--shadow-card)]">
                <span className="text-accent">
                  <Icon name="quote" className="h-10 w-10" />
                </span>
                <p className="mt-6 font-display text-2xl leading-snug text-text sm:text-3xl">
                  {site.brand?.tagline ?? "Делаем работу так, как сделали бы для себя."}
                </p>
                <p className="mt-4 text-muted">{site.brand?.name}</p>
              </div>
            )}
          </div>

          <ul className="ds-stagger divide-y divide-border">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-4 py-5 first:pt-0">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Icon name={it.icon ?? "check"} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold leading-snug">{it.title}</h3>
                  <p className="mt-1.5 text-muted leading-relaxed">{it.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SectionWrap>
    );
  }

  // ── rows: широкие строки во всю ширину с чередованием ──────────────────────
  if (v === "rows") {
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Почему мы"}
        title={data.title ?? "Почему выбирают нас"}
        subtitle={data.subtitle}
      >
        <div className="flex flex-col gap-6">
          {items.map((it, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={i}
                className={`ds-reveal flex flex-col gap-6 rounded-[var(--radius)] border border-border bg-surface p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-8 ${
                  flip ? "sm:flex-row-reverse sm:text-right" : ""
                }`}
              >
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-display text-5xl font-semibold tabular-nums text-accent/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                    <Icon name={it.icon ?? "check"} />
                  </span>
                </div>
                <div className={flip ? "sm:ml-auto" : ""}>
                  <h3 className="font-display text-xl font-semibold leading-snug">{it.title}</h3>
                  <p className="mt-2 max-w-2xl text-muted leading-relaxed">{it.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionWrap>
    );
  }

  // ── grid (по умолчанию): сетка иконок-преимуществ ─────────────────────────
  return (
    <SectionWrap
      id={data.id}
      eyebrow={data.eyebrow ?? "Почему мы"}
      title={data.title ?? "Почему выбирают нас"}
      subtitle={data.subtitle}
    >
      <div className="ds-stagger grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <div key={i}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent">
              <Icon name={it.icon ?? "check"} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{it.title}</h3>
            <p className="mt-2 text-muted leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </SectionWrap>
  );
}
