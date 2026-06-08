import { variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export default function Faq({ data }: { data: Section }) {
  const v = variantOf("faq", "accordion");
  const items: { q: string; a: string }[] = data.items ?? [];

  if (items.length === 0) return null;

  const AccItem = ({ q, a }: { q: string; a: string }) => (
    <details className="group border-b border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
        {q}
        <span className="shrink-0 text-accent transition-transform group-open:rotate-45">
          <Icon name="plus" />
        </span>
      </summary>
      <div className="pb-5 text-muted leading-relaxed">{a}</div>
    </details>
  );

  if (v === "two-col") {
    const mid = Math.ceil(items.length / 2);
    const left = items.slice(0, mid);
    const right = items.slice(mid);
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Вопросы и ответы"}
        title={data.title ?? "Частые вопросы"}
        subtitle={data.subtitle}
      >
        <div className="grid gap-x-10 md:grid-cols-2">
          <div>
            {left.map((it, i) => (
              <AccItem key={`l-${i}`} q={it.q} a={it.a} />
            ))}
          </div>
          <div>
            {right.map((it, i) => (
              <AccItem key={`r-${i}`} q={it.q} a={it.a} />
            ))}
          </div>
        </div>
      </SectionWrap>
    );
  }

  if (v === "bordered") {
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Вопросы и ответы"}
        title={data.title ?? "Частые вопросы"}
        subtitle={data.subtitle}
      >
        <div className="ds-reveal mx-auto max-w-3xl">
          {items.map((it, i) => (
            <details
              key={i}
              className="group mb-3 rounded-[var(--radius)] border border-border bg-surface p-1 transition-colors open:border-accent/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[var(--radius)] px-5 py-4 font-medium transition-colors group-hover:bg-primary/5 [&::-webkit-details-marker]:hidden">
                {it.q}
                <span className="shrink-0 text-accent transition-transform group-open:rotate-45">
                  <Icon name="plus" />
                </span>
              </summary>
              <div className="px-5 pb-4 pt-1 text-muted leading-relaxed">{it.a}</div>
            </details>
          ))}
        </div>
      </SectionWrap>
    );
  }

  return (
    <SectionWrap
      id={data.id}
      eyebrow={data.eyebrow ?? "Вопросы и ответы"}
      title={data.title ?? "Частые вопросы"}
      subtitle={data.subtitle}
    >
      <div className="mx-auto max-w-3xl">
        {items.map((it, i) => (
          <AccItem key={i} q={it.q} a={it.a} />
        ))}
      </div>
    </SectionWrap>
  );
}
