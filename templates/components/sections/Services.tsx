import { img, rub, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type ServiceItem = {
  title: string;
  desc?: string;
  price_label?: string;
  icon?: string;
  image?: string;
  popular?: boolean;
  priceFrom?: number;
};

export default function Services({ data }: { data: Section }) {
  const v = variantOf("services", "cards");
  const items: ServiceItem[] = data.items ?? [];
  const ctaHref: string = data.cta?.href ?? "#contacts";

  const eyebrow = data.eyebrow ?? "Услуги";
  const title = data.title ?? "Наши услуги";

  const priceText = (item: ServiceItem): string | undefined =>
    item.price_label ?? (typeof item.priceFrom === "number" ? `от ${rub(item.priceFrom)}` : undefined);

  // ── Вариант: список строк ──────────────────────────────────────────────────
  if (v === "list") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={data.subtitle}>
        <div className="divide-y divide-border border-y border-border">
          {items.map((item, i) => {
            const price = priceText(item);
            return (
              <div
                key={i}
                className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={item.icon ?? "sparkle"} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-text">{item.title}</h3>
                    {item.desc && <p className="mt-1 text-muted leading-relaxed">{item.desc}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-5 pl-16 sm:pl-0">
                  {price && (
                    <span className="font-display text-lg font-semibold tabular-nums text-primary">{price}</span>
                  )}
                  <Button href={ctaHref} variant="outline" size="md">
                    Записаться
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionWrap>
    );
  }

  // ── Вариант: bento-сетка ────────────────────────────────────────────────────
  if (v === "bento") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={data.subtitle}>
        <div className="ds-stagger grid auto-rows-[minmax(180px,1fr)] grid-cols-2 gap-5 lg:grid-cols-3">
          {items.map((item, i) => {
            const price = priceText(item);
            const featured = i === 0;
            const image = img(item.image);

            if (featured) {
              return (
                <a
                  key={i}
                  href={ctaHref}
                  className="group relative col-span-2 row-span-2 flex flex-col justify-end overflow-hidden rounded-[var(--radius)] border border-border p-7 cursor-pointer"
                >
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt={item.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
                  )}
                  <div className="relative">
                    <span className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
                      <Icon name={item.icon ?? "sparkle"} />
                    </span>
                    <h3 className="font-display text-2xl font-semibold text-white">{item.title}</h3>
                    {item.desc && <p className="mt-2 max-w-md text-white/85 leading-relaxed">{item.desc}</p>}
                    {price && (
                      <div className="mt-4 font-display text-lg font-semibold tabular-nums text-white">{price}</div>
                    )}
                  </div>
                </a>
              );
            }

            return (
              <a
                key={i}
                href={ctaHref}
                className="ds-hover-lift group flex flex-col justify-between overflow-hidden rounded-[var(--radius)] border border-border bg-surface p-6 cursor-pointer"
              >
                <div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={item.icon ?? "sparkle"} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-text">{item.title}</h3>
                  {item.desc && <p className="mt-2 text-sm text-muted leading-relaxed">{item.desc}</p>}
                </div>
                {price && (
                  <div className="mt-5 font-display text-base font-semibold tabular-nums text-primary">{price}</div>
                )}
              </a>
            );
          })}
        </div>
      </SectionWrap>
    );
  }

  // ── Вариант по умолчанию: карточки ──────────────────────────────────────────
  return (
    <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={data.subtitle}>
      <div className="ds-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const price = priceText(item);
          const image = img(item.image);
          return (
            <div
              key={i}
              className="ds-hover-lift relative flex flex-col rounded-[var(--radius)] border border-border bg-surface p-6"
            >
              {item.popular && (
                <span className="absolute right-5 top-5 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">
                  Хит
                </span>
              )}

              {item.image && (
                <div className="mb-5 overflow-hidden rounded">
                  {image ? (
                    <img
                      src={image}
                      alt={item.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/15 to-accent/15" />
                  )}
                </div>
              )}

              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={item.icon ?? "sparkle"} />
              </span>

              <h3 className="mt-4 font-display text-xl font-semibold text-text">{item.title}</h3>
              {item.desc && <p className="mt-2 flex-1 text-muted leading-relaxed">{item.desc}</p>}

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
                {price ? (
                  <span className="font-display text-lg font-semibold tabular-nums text-primary">{price}</span>
                ) : (
                  <span />
                )}
                <a
                  href={ctaHref}
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-text transition-colors hover:text-accent cursor-pointer"
                >
                  Подробнее
                  <Icon
                    name="arrowRight"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrap>
  );
}
