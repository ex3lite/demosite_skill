import { site, img } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

export default function Hero({ data }: { data: Section }) {
  const variant: string = data.variant ?? "split-left";
  const image = img(data.image) ?? img("hero");
  const cta = data.cta ?? site.cta?.primary ?? { label: "Оставить заявку", href: "#contacts" };
  const secondary = data.secondaryCta;
  const bullets: string[] = data.bullets ?? [];
  const stats: { value: string; label: string }[] = data.stats ?? [];

  // ── Вариант с фоновым изображением во всю ширину ──────────────────────────
  if (variant === "bg-image" && image) {
    return (
      <section id={data.id} className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
        <Container className="relative z-10 pb-20 pt-32 text-white">
          <Reveal className="max-w-2xl">
            {data.eyebrow && <p className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-wide text-white/80">
              <span className="h-px w-8 bg-accent" />{data.eyebrow}</p>}
            <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05]">{data.title}</h1>
            {data.subtitle && <p className="mt-5 max-w-xl text-lg text-white/85 leading-relaxed">{data.subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={cta.href} variant="accent" size="lg" iconRight="arrowRight">{cta.label}</Button>
              {secondary && <Button href={secondary.href} variant="outline" size="lg"
                className="border-white/40 text-white hover:bg-white/10">{secondary.label}</Button>}
            </div>
          </Reveal>
        </Container>
      </section>
    );
  }

  // ── Вариант по центру ─────────────────────────────────────────────────────
  if (variant === "centered") {
    return (
      <section id={data.id} className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 text-center overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-primary/8 to-transparent" />
        <Container>
          <Reveal className="mx-auto max-w-3xl">
            {data.eyebrow && <p className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-wide text-accent">
              <span className="h-px w-8 bg-accent" />{data.eyebrow}<span className="h-px w-8 bg-accent" /></p>}
            <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05]">{data.title}</h1>
            {data.subtitle && <p className="mx-auto mt-5 max-w-xl text-lg text-muted leading-relaxed">{data.subtitle}</p>}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href={cta.href} variant="primary" size="lg" iconRight="arrowRight">{cta.label}</Button>
              {secondary && <Button href={secondary.href} variant="outline" size="lg">{secondary.label}</Button>}
            </div>
          </Reveal>
          {image && (
            <Reveal delay={120} className="mt-14">
              <img src={image} alt="" className="mx-auto w-full max-w-4xl rounded-[var(--radius)] shadow-[var(--shadow-card)]" />
            </Reveal>
          )}
        </Container>
      </section>
    );
  }

  // ── Вариант по умолчанию: текст + визуал-карточка (split-left / split-right) ─
  const right = variant === "split-right";
  return (
    <section id={data.id} className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24">
      <div className={`absolute -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl ${right ? "-left-40" : "-right-40"}`} />
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className={right ? "lg:order-2" : ""}>
          {data.eyebrow && <p className="mb-4 inline-flex items-center gap-2 text-sm uppercase tracking-wide text-accent">
            <span className="h-px w-8 bg-accent" />{data.eyebrow}</p>}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.05]">{data.title}</h1>
          {data.subtitle && <p className="mt-5 max-w-lg text-lg text-muted leading-relaxed">{data.subtitle}</p>}

          {bullets.length > 0 && (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </span>{b}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={cta.href} variant="primary" size="lg" iconRight="arrowRight">{cta.label}</Button>
            {secondary && <Button href={secondary.href} variant="outline" size="lg">{secondary.label}</Button>}
          </div>

          {stats.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-8 border-t border-border pt-7">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="font-display text-3xl font-semibold text-primary">{s.value}</div>
                  <div className="text-sm text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={120} className="relative">
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow-card)] aspect-[4/3]" />
              <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 rounded-[var(--radius)] border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent"><Icon name="award" /></span>
                <div className="text-sm leading-tight">
                  <div className="font-semibold text-text">{site.stats?.rating ?? "4.9"} / 5</div>
                  <div className="text-muted">{site.stats?.reviews_count ?? 240}+ отзывов</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-[var(--radius)] bg-gradient-to-br from-primary/15 to-accent/15" />
          )}
        </Reveal>
      </Container>
    </section>
  );
}
