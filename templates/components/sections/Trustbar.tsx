import { site } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Counter } from "@/components/ui/Counter";
import { Marquee } from "@/components/ui/Marquee";

type TrustItem = { icon?: string; label: string; value?: string };

export default function Trustbar({ data }: { data: Section }) {
  const v = variantOf("trustbar", "row");

  const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
  const s = site.stats ?? {};

  let items: TrustItem[] = data.items ?? [];
  if (items.length === 0) {
    items = [
      { icon: "award", value: String(s.years_on_market ?? 0), label: "лет на рынке" },
      { icon: "users", value: fmt(Number(s.clients ?? 0)), label: "клиентов" },
      { icon: "star", value: String(s.rating ?? 0), label: "рейтинг" },
      { icon: "shield", value: String(s.specialists ?? 0), label: "специалистов" },
    ];
  }

  // ── marquee: бегущая лента из элементов в одну строку ─────────────────────
  if (v === "marquee") {
    return (
      <section id={data.id} className="border-y border-border bg-surface">
        <Container className="py-8 sm:py-10">
          <div className="ds-reveal">
            <Marquee duration={28}>
              {items.map((item, i) => (
                <span key={i} className="flex items-center gap-3 text-text">
                  {item.icon && (
                    <span className="text-primary">
                      <Icon name={item.icon} className="w-5 h-5" />
                    </span>
                  )}
                  {item.value && (
                    <span className="font-display text-lg font-semibold tabular-nums">{item.value}</span>
                  )}
                  <span className="text-muted">{item.label}</span>
                  <span aria-hidden className="text-border">&middot;</span>
                </span>
              ))}
            </Marquee>
          </div>
        </Container>
      </section>
    );
  }

  // ── stat-strip: крупные анимированные цифры в ряд ─────────────────────────
  if (v === "stat-strip") {
    return (
      <section id={data.id} className="border-y border-border bg-surface">
        <Container className="py-8 sm:py-10">
          <div className="ds-stagger grid grid-cols-2 gap-6 md:grid-cols-4">
            {items.map((item, i) => {
              const num = item.value !== undefined ? parseInt(item.value.replace(/\s/g, ""), 10) : NaN;
              const suffix = item.value && /\+\s*$/.test(item.value) ? "+" : "";
              return (
                <div key={i} className="text-center">
                  <div className="font-display text-3xl sm:text-4xl font-semibold text-primary tabular-nums">
                    {Number.isNaN(num)
                      ? (item.value ?? "")
                      : <Counter value={num} suffix={suffix} />}
                  </div>
                  <div className="mt-2 text-sm text-muted">{item.label}</div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    );
  }

  // ── row (по умолчанию): чип-иконка + значение + подпись, с разделителями ──
  return (
    <section id={data.id} className="border-y border-border bg-surface">
      <Container className="py-8 sm:py-10">
        <div className="ds-stagger grid grid-cols-2 gap-6 md:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 ${i % 4 === 0 ? "" : "md:border-l md:border-border md:pl-6"}`}
            >
              {item.icon && (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/8 text-primary">
                  <Icon name={item.icon} className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0">
                {item.value && (
                  <div className="font-display text-2xl font-semibold leading-none text-text tabular-nums">
                    {item.value}
                  </div>
                )}
                <div className={`text-sm text-muted ${item.value ? "mt-1" : ""}`}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function variantOf(sectionType: string, fallback: string): string {
  return site.variation?.sectionVariants?.[sectionType] ?? fallback;
}
