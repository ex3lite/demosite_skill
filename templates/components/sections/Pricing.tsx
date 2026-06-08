import { variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Plan = {
  name: string;
  price_label: string;
  period?: string;
  features: string[];
  popular?: boolean;
  cta?: { label: string; href: string };
};

export default function Pricing({ data }: { data: Section }) {
  const v = variantOf("pricing", "cards");
  const plans: Plan[] = data.plans ?? [];

  return (
    <SectionWrap
      id={data.id}
      eyebrow={data.eyebrow ?? "Цены"}
      title={data.title ?? "Тарифы"}
      subtitle={data.subtitle}
      align="center"
    >
      {v === "table" ? (
        <PricingTable plans={plans} />
      ) : v === "highlight" ? (
        <PricingHighlight plans={plans} />
      ) : (
        <PricingCards plans={plans} />
      )}
    </SectionWrap>
  );
}

/* ───────────────────────── cards ───────────────────────── */

function PricingCards({ plans }: { plans: Plan[] }) {
  const cols =
    plans.length === 2
      ? "sm:grid-cols-2 max-w-3xl mx-auto"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`ds-stagger grid items-stretch gap-6 ${cols}`}>
      {plans.map((plan, i) => {
        const href = plan.cta?.href ?? "#contacts";
        const label = plan.cta?.label ?? "Выбрать тариф";
        return (
          <div
            key={i}
            className={`relative flex flex-col rounded-[var(--radius)] p-7 ${
              plan.popular
                ? "border-2 border-accent bg-primary/5 shadow-[var(--shadow-card)]"
                : "border border-border bg-surface"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-medium text-accent-fg">
                Популярный
              </span>
            )}

            <h3 className="font-display text-xl font-semibold text-text">
              {plan.name}
            </h3>

            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-4xl font-semibold text-primary tabular-nums">
                {plan.price_label}
              </span>
              {plan.period && (
                <span className="pb-1 text-sm text-muted">{plan.period}</span>
              )}
            </div>

            {plan.features.length > 0 && (
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-text">
                    <Icon
                      name="check-circle"
                      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 pt-2">
              <Button
                href={href}
                variant={plan.popular ? "primary" : "outline"}
                className="w-full justify-center"
              >
                {label}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── table ───────────────────────── */

function PricingTable({ plans }: { plans: Plan[] }) {
  // Сводим все фичи в единый набор строк для сравнения по колонкам-тарифам.
  const rows: string[] = [];
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (!rows.includes(feature)) rows.push(feature);
    }
  }

  return (
    <div>
      {/* Сравнительная таблица — на md и шире */}
      <div className="hidden overflow-hidden rounded-[var(--radius)] border border-border md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface">
              <th className="sticky left-0 z-10 bg-surface px-6 py-5 align-bottom" />
              {plans.map((plan, i) => (
                <th
                  key={i}
                  className={`border-l border-border px-6 py-5 text-center align-bottom ${
                    plan.popular ? "bg-primary/5" : ""
                  }`}
                >
                  {plan.popular && (
                    <span className="mb-2 inline-block rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-fg">
                      Популярный
                    </span>
                  )}
                  <div className="font-display text-lg font-semibold text-text">
                    {plan.name}
                  </div>
                  <div className="mt-1 flex items-end justify-center gap-1">
                    <span className="font-display text-2xl font-semibold text-primary tabular-nums">
                      {plan.price_label}
                    </span>
                    {plan.period && (
                      <span className="pb-0.5 text-xs text-muted">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((feature, ri) => (
              <tr key={ri} className="border-t border-border">
                <td className="sticky left-0 z-10 bg-bg px-6 py-4 text-sm text-text">
                  {feature}
                </td>
                {plans.map((plan, ci) => {
                  const has = plan.features.includes(feature);
                  return (
                    <td
                      key={ci}
                      className={`border-l border-border px-6 py-4 text-center ${
                        plan.popular ? "bg-primary/5" : ""
                      }`}
                    >
                      {has ? (
                        <Icon
                          name="check"
                          className="mx-auto h-5 w-5 text-accent"
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-border">
              <td className="sticky left-0 z-10 bg-bg px-6 py-5" />
              {plans.map((plan, ci) => {
                const href = plan.cta?.href ?? "#contacts";
                const label = plan.cta?.label ?? "Выбрать";
                return (
                  <td
                    key={ci}
                    className={`border-l border-border px-6 py-5 text-center ${
                      plan.popular ? "bg-primary/5" : ""
                    }`}
                  >
                    <Button
                      href={href}
                      variant={plan.popular ? "primary" : "outline"}
                      className="w-full justify-center"
                    >
                      {label}
                    </Button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Мобильный стек карточек */}
      <div className="grid gap-6 md:hidden">
        {plans.map((plan, i) => {
          const href = plan.cta?.href ?? "#contacts";
          const label = plan.cta?.label ?? "Выбрать тариф";
          return (
            <div
              key={i}
              className={`flex flex-col rounded-[var(--radius)] p-6 ${
                plan.popular
                  ? "border-2 border-accent bg-primary/5"
                  : "border border-border bg-surface"
              }`}
            >
              {plan.popular && (
                <span className="mb-3 self-start rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-fg">
                  Популярный
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-text">
                {plan.name}
              </h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-display text-3xl font-semibold text-primary tabular-nums">
                  {plan.price_label}
                </span>
                {plan.period && (
                  <span className="pb-1 text-sm text-muted">{plan.period}</span>
                )}
              </div>
              <ul className="mt-5 space-y-3 text-sm">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-text">
                    <Icon
                      name="check-circle"
                      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Button
                  href={href}
                  variant={plan.popular ? "primary" : "outline"}
                  className="w-full justify-center"
                >
                  {label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────── highlight ─────────────────────── */

function PricingHighlight({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) return null;

  // Главный тариф — помеченный popular, иначе первый. Остальные — компактно рядом.
  const mainIndex = Math.max(
    plans.findIndex((p) => p.popular),
    0
  );
  const main = plans[mainIndex];
  const rest = plans.filter((_, i) => i !== mainIndex);

  const mainHref = main.cta?.href ?? "#contacts";
  const mainLabel = main.cta?.label ?? "Выбрать тариф";

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-5">
      {/* Акцентный тариф */}
      <div className="ds-reveal flex flex-col rounded-[var(--radius)] bg-primary p-8 text-primary-fg shadow-[var(--shadow-card)] sm:p-10 lg:col-span-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-2xl font-semibold">{main.name}</h3>
          <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-fg">
            Популярный
          </span>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <span className="font-display text-5xl font-semibold tabular-nums">
            {main.price_label}
          </span>
          {main.period && (
            <span className="pb-1.5 text-sm text-primary-fg/80">
              {main.period}
            </span>
          )}
        </div>

        {main.features.length > 0 && (
          <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
            {main.features.map((feature, fi) => (
              <li key={fi} className="flex items-start gap-3">
                <Icon
                  name="check-circle"
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                />
                <span className="leading-relaxed text-primary-fg/90">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 pt-2">
          <Button
            href={mainHref}
            variant="accent"
            size="lg"
            className="w-full justify-center sm:w-auto"
          >
            {mainLabel}
          </Button>
        </div>
      </div>

      {/* Второстепенные тарифы */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {rest.length > 0 ? (
          rest.map((plan, i) => {
            const href = plan.cta?.href ?? "#contacts";
            const label = plan.cta?.label ?? "Подробнее";
            return (
              <div
                key={i}
                className="ds-reveal flex flex-1 flex-col rounded-[var(--radius)] border border-border bg-surface p-6"
              >
                <h3 className="font-display text-lg font-semibold text-text">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-display text-3xl font-semibold text-primary tabular-nums">
                    {plan.price_label}
                  </span>
                  {plan.period && (
                    <span className="pb-1 text-sm text-muted">
                      {plan.period}
                    </span>
                  )}
                </div>
                {plan.features.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm">
                    {plan.features.slice(0, 4).map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-text">
                        <Icon
                          name="check-circle"
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-5">
                  <Button
                    href={href}
                    variant="outline"
                    className="w-full justify-center"
                  >
                    {label}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ds-reveal flex flex-1 flex-col justify-center rounded-[var(--radius)] border border-border bg-surface p-8">
            <Icon name="sparkle" className="h-8 w-8 text-accent" />
            <p className="mt-4 font-display text-xl font-semibold text-text">
              Индивидуальные условия
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Подберём решение под ваши задачи и рассчитаем стоимость.
            </p>
            <div className="mt-6">
              <Button
                href="#contacts"
                variant="outline"
                className="w-full justify-center"
              >
                Узнать цену
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
