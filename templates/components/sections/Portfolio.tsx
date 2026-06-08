import { img, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

type PortfolioItem = { title: string; tag?: string; image?: string; result?: string };

export default function Portfolio({ data }: { data: Section }) {
  const v = variantOf("portfolio", "grid");
  const items: PortfolioItem[] = data.items ?? [];

  if (items.length === 0) return null;

  return (
    <SectionWrap
      id={data.id}
      eyebrow={data.eyebrow ?? "Наши работы"}
      title={data.title ?? "Портфолио"}
      subtitle={data.subtitle}
    >
      {v === "masonry" ? (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {items.map((item, i) => {
            const src = img(item.image);
            const ratios = ["aspect-[4/3]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]"];
            const ratio = ratios[i % ratios.length];
            return (
              <figure
                key={i}
                className="group relative break-inside-avoid overflow-hidden rounded-[var(--radius)] border border-border bg-surface"
              >
                <div className="overflow-hidden">
                  {src ? (
                    <img
                      src={src}
                      alt={item.title}
                      loading="lazy"
                      className={`w-full ${ratio} object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
                    />
                  ) : (
                    <div
                      className={`w-full ${ratio} bg-gradient-to-br from-primary/15 to-accent/15`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-5">
                  {item.tag && (
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {item.tag}
                    </span>
                  )}
                  <figcaption className="mt-2 font-display text-lg font-semibold text-white">
                    {item.title}
                  </figcaption>
                  {item.result && <p className="mt-1 text-sm text-white/80">{item.result}</p>}
                </div>
              </figure>
            );
          })}
        </div>
      ) : v === "overlay" ? (
        <div className="ds-stagger grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => {
            const src = img(item.image);
            return (
              <article
                key={i}
                className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-[var(--radius)] border border-border bg-surface"
              >
                {src ? (
                  <img
                    src={src}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary/25 to-accent/25"
                    aria-hidden="true"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
                <div className="relative p-6 sm:p-7">
                  {item.tag && (
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {item.tag}
                    </span>
                  )}
                  <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.result && (
                    <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-white/85 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
                      {item.result}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Смотреть кейс
                    <Icon name="arrowUpRight" className="h-4 w-4" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ds-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const src = img(item.image);
            return (
              <article
                key={i}
                className="group relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface"
              >
                <div className="overflow-hidden">
                  {src ? (
                    <img
                      src={src}
                      alt={item.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div
                      className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15"
                      aria-hidden="true"
                    >
                      <Icon name="camera" className="h-9 w-9 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-5">
                  {item.tag && (
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {item.tag}
                    </span>
                  )}
                  <h3 className="mt-2 font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.result && <p className="mt-1 text-sm text-white/80">{item.result}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionWrap>
  );
}
