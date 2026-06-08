import { site, img } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";

type Stat = { value: string; label: string };

function StatValue({ value }: { value: string }) {
  const m = value.match(/^(\D*)(\d[\d\s]*)(.*)$/);
  if (m) {
    const prefix = m[1] ?? "";
    const num = parseInt(m[2].replace(/\s/g, ""), 10);
    const suffix = m[3] ?? "";
    if (!isNaN(num)) {
      return <Counter value={num} prefix={prefix} suffix={suffix} />;
    }
  }
  return <span>{value}</span>;
}

function Requisites() {
  const c = site.company ?? {};
  const rows: { label: string; value: string }[] = [];
  if (c.legal_name) rows.push({ label: "Полное наименование", value: c.legal_name });
  if (c.inn) rows.push({ label: "ИНН", value: String(c.inn) });
  if (c.kpp) rows.push({ label: "КПП", value: String(c.kpp) });
  if (c.ogrn) rows.push({ label: c.ogrn_kind ?? "ОГРН", value: String(c.ogrn) });
  if (c.address_legal?.full) rows.push({ label: "Юридический адрес", value: c.address_legal.full });
  if (c.director?.full) rows.push({ label: "Директор", value: c.director.full });
  if (rows.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-lg font-semibold text-text">Реквизиты</h3>
      <dl className="mt-4 space-y-3 text-sm tabular-nums">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6">
            <dt className="text-muted shrink-0">{r.label}</dt>
            <dd className="text-text sm:text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function About({ data }: { data: Section }) {
  const v: string = (site.variation?.sectionVariants?.about as string) ?? "split";

  const body: string[] = data.body ?? [];
  let stats: Stat[] = data.stats ?? [];
  if (stats.length === 0) {
    const s = site.stats ?? {};
    stats = [
      { value: `${s.years_on_market ?? 12}`, label: "лет на рынке" },
      { value: `${new Intl.NumberFormat("ru-RU").format(s.clients ?? 5000)}+`, label: "клиентов" },
      { value: `${s.rating ?? "4.9"}`, label: "средний рейтинг" },
    ];
  }
  const showReq: boolean = data.showRequisites ?? true;
  const image = img(data.image) ?? img("about");
  const cta = data.cta;

  const eyebrow = data.eyebrow ?? "О компании";
  const title = data.title ?? site.brand?.name;
  const subtitle = data.subtitle;

  const paragraphs = (
    <div className="text-muted leading-relaxed space-y-4">
      {body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );

  // ── side-stats: текст слева 2/3, узкая колонка справа 1/3 ───────────────────
  if (v === "side-stats") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="ds-reveal lg:col-span-2">
            {paragraphs}
            {cta && (
              <div className="mt-8">
                <Button href={cta.href ?? "#contacts"} variant="primary" size="lg" iconRight="arrowRight">
                  {cta.label ?? "Подробнее"}
                </Button>
              </div>
            )}
          </div>

          <div className="ds-reveal lg:col-span-1 space-y-6">
            <div className="divide-y divide-border border-y border-border">
              {stats.map((s, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 py-4">
                  <span className="font-display text-3xl font-semibold text-primary tabular-nums">
                    <StatValue value={s.value} />
                  </span>
                  <span className="text-muted text-sm text-right">{s.label}</span>
                </div>
              ))}
            </div>
            {showReq && <Requisites />}
          </div>
        </div>
      </SectionWrap>
    );
  }

  // ── stacked: центр, абзацы в колонки, широкая полоса stats ──────────────────
  if (v === "stacked") {
    return (
      <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle} align="center">
        {image ? (
          <div className="ds-scale overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow-card)]">
            <img
              src={image}
              alt={`${site.brand?.name ?? "Компания"} — команда за работой`}
              loading="lazy"
              className="w-full object-cover aspect-[21/9]"
            />
          </div>
        ) : (
          <div className="aspect-[21/9] rounded-[var(--radius)] bg-gradient-to-br from-primary/15 to-accent/15" />
        )}

        {body.length > 0 && (
          <div className="ds-reveal mx-auto mt-12 max-w-4xl text-muted leading-relaxed columns-1 gap-10 sm:columns-2 [&>p]:mb-4 [&>p]:break-inside-avoid">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="ds-stagger mt-14 grid grid-cols-2 gap-8 border-t border-border pt-10 sm:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-semibold text-primary tabular-nums">
                <StatValue value={s.value} />
              </div>
              <div className="mt-2 text-muted text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {cta && (
          <div className="mt-10 flex justify-center">
            <Button href={cta.href ?? "#contacts"} variant="primary" size="lg" iconRight="arrowRight">
              {cta.label ?? "Подробнее"}
            </Button>
          </div>
        )}

        {showReq && (
          <div className="mx-auto mt-12 max-w-2xl text-left">
            <Requisites />
          </div>
        )}
      </SectionWrap>
    );
  }

  // ── split (по умолчанию): текст+stats слева, изображение справа ─────────────
  return (
    <SectionWrap id={data.id} eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="ds-reveal">
          {paragraphs}

          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl font-semibold text-primary tabular-nums">
                  <StatValue value={s.value} />
                </div>
                <div className="mt-1 text-muted text-sm">{s.label}</div>
              </div>
            ))}
          </div>

          {cta && (
            <div className="mt-9">
              <Button href={cta.href ?? "#contacts"} variant="primary" size="lg" iconRight="arrowRight">
                {cta.label ?? "Подробнее"}
              </Button>
            </div>
          )}
        </div>

        <div className="ds-reveal-blur space-y-6">
          {image ? (
            <div className="overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow-card)]">
              <img
                src={image}
                alt={`${site.brand?.name ?? "Компания"} — о нас`}
                loading="lazy"
                className="w-full object-cover aspect-[4/5]"
              />
            </div>
          ) : (
            <div className="aspect-[4/5] rounded-[var(--radius)] bg-gradient-to-br from-primary/15 to-accent/15" />
          )}
          {showReq && <Requisites />}
        </div>
      </div>
    </SectionWrap>
  );
}
