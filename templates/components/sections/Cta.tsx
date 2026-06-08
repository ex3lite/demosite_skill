"use client";

import { useState } from "react";
import { site, tel, img, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function Cta({ data }: { data: Section }) {
  const v = variantOf("cta", "band");

  const title: string = data.title ?? "Оставьте заявку";
  const subtitle: string | undefined = data.subtitle;
  const phone: string | undefined = site.contacts?.phone;
  const cta = data.cta ?? site.cta?.primary ?? { label: "Записаться", href: "#contacts" };

  const [name, setName] = useState("");
  const [telValue, setTelValue] = useState("");
  const [sent, setSent] = useState(false);

  const inputClass =
    "w-full h-11 rounded-[var(--radius)] border border-border bg-bg px-4 text-text " +
    "placeholder:text-muted outline-none transition-shadow focus:ring-2 focus:ring-accent/40";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name.trim() && telValue.trim()) setSent(true);
  }

  const successBlock = (
    <div className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-surface p-5 text-text">
      <span className="mt-0.5 shrink-0 text-accent">
        <Icon name="check-circle" className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold">Заявка принята</p>
        <p className="mt-1 text-muted leading-relaxed">Перезвоним в течение 15 минут.</p>
      </div>
    </div>
  );

  // ── Поля формы (переиспользуются во всех вариантах) ──────────────────────────
  const fields = (submitLabel: string) => (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div>
        <label htmlFor="cta-name" className="sr-only">Имя</label>
        <input
          id="cta-name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Ваше имя"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="cta-phone" className="sr-only">Телефон</label>
        <input
          id="cta-phone"
          type="tel"
          name="phone"
          value={telValue}
          onChange={(e) => setTelValue(e.target.value)}
          required
          autoComplete="tel"
          placeholder="Телефон"
          className={`${inputClass} tabular-nums`}
        />
      </div>
      <Button href="#" variant="accent" size="lg" iconRight="arrowRight" className="w-full cursor-pointer">
        {submitLabel}
      </Button>
      <p className="text-center text-xs text-muted">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
      </p>
    </form>
  );

  // ── Вариант: split — текст слева, форма справа, обычный фон ───────────────────
  if (v === "split") {
    const bg = img(data.image);
    return (
      <section id={data.id} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="ds-reveal relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]">
            {bg && (
              <>
                <img
                  src={bg}
                  alt=""
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 to-accent/8" />
              </>
            )}
            <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-semibold leading-[1.1] sm:text-4xl">{title}</h2>
                {subtitle && <p className="mt-4 max-w-md text-lg text-muted leading-relaxed">{subtitle}</p>}
                {phone && (
                  <a
                    href={tel(phone)}
                    className="mt-7 inline-flex items-center gap-3 text-text transition-colors hover:text-accent"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/15 text-accent">
                      <Icon name="phone" />
                    </span>
                    <span className="font-display text-2xl font-semibold tabular-nums">{phone}</span>
                  </a>
                )}
              </div>
              <div className="rounded-[var(--radius)] border border-border bg-bg p-6 shadow-[var(--shadow-card)]">
                {sent ? successBlock : fields(cta.label ?? "Записаться")}
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // ── Вариант: card — одна центрированная карточка с формой ─────────────────────
  if (v === "card") {
    return (
      <section id={data.id} style={{ paddingBlock: "var(--section-y)" }}>
        <Container>
          <div className="ds-reveal mx-auto max-w-xl rounded-[var(--radius)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon name="send" className="h-6 w-6" />
            </span>
            <h2 className="font-display text-3xl font-semibold leading-[1.1] sm:text-4xl">{title}</h2>
            {subtitle && <p className="mx-auto mt-4 max-w-md text-lg text-muted leading-relaxed">{subtitle}</p>}
            {phone && (
              <a
                href={tel(phone)}
                className="mt-5 inline-flex items-center gap-2 font-display text-xl font-semibold tabular-nums text-text transition-colors hover:text-accent"
              >
                <Icon name="phone" className="h-5 w-5 text-accent" />
                {phone}
              </a>
            )}
            <div className="mt-8 text-left">
              {sent ? successBlock : fields(cta.label ?? "Записаться")}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // ── Вариант по умолчанию: band — акцентная полоса primary + карточка-форма ────
  return (
    <section id={data.id} style={{ paddingBlock: "var(--section-y)" }}>
      <Container>
        <div className="ds-reveal grid items-center gap-8 rounded-[var(--radius)] bg-primary p-8 text-primary-fg shadow-[var(--shadow-card)] sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-[1.1] sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-4 max-w-md text-lg text-primary-fg/80 leading-relaxed">{subtitle}</p>}
            {phone && (
              <a
                href={tel(phone)}
                className="mt-7 inline-flex items-center gap-3 text-primary-fg transition-opacity hover:opacity-80"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15">
                  <Icon name="phone" />
                </span>
                <span className="font-display text-2xl font-semibold tabular-nums">{phone}</span>
              </a>
            )}
          </div>
          <div className="rounded-[var(--radius)] bg-surface p-6 text-text shadow-[var(--shadow-card)]">
            {sent ? successBlock : fields(cta.label ?? "Записаться")}
          </div>
        </div>
      </Container>
    </section>
  );
}
