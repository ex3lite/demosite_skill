"use client";
import { useEffect, useState } from "react";
import { site, img, tel, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function Header({ data }: { data: Section }) {
  const v = data.variant ?? variantOf("header", "classic");
  const nav = data.nav ?? site.nav ?? [];
  const phone = data.phone ?? site.contacts?.phone;
  const cta = data.cta ?? site.cta?.primary ?? { label: "Оставить заявку", href: "#contacts" };
  const logo = img("logo");
  const sch = site.schedule ?? {};
  const addr = site.contacts?.address;

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const Logo = ({ className = "" }: { className?: string }) => (
    <a href="#top" className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      {logo ? (
        <img src={logo} alt={site.brand.name} className="h-9 w-9 object-contain" width={36} height={36} />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-primary text-primary-fg font-display font-semibold">
          {site.brand.name.charAt(0)}
        </span>
      )}
      <span className="font-display text-lg font-semibold tracking-tight">{site.brand.name}</span>
    </a>
  );

  const NavLinks = ({ className = "" }: { className?: string }) => (
    <nav className={`items-center gap-7 text-[15px] text-muted ${className}`}>
      {nav.map((n: any) => (
        <a key={n.href} href={n.href} data-spy={n.href.replace("#", "")}
          className="hover:text-text data-[active]:text-text transition-colors cursor-pointer">{n.label}</a>
      ))}
    </nav>
  );

  const Phone = () => phone ? (
    <a href={tel(phone)} className="font-medium tabular-nums hover:text-accent transition-colors cursor-pointer whitespace-nowrap">
      {phone}
    </a>
  ) : null;

  const Burger = () => (
    <button onClick={() => setOpen((x) => !x)} aria-label="Меню" aria-expanded={open}
      className="lg:hidden grid h-11 w-11 place-items-center rounded-[var(--radius)] border border-border cursor-pointer">
      <Icon name={open ? "x" : "menu"} className="w-6 h-6" />
    </button>
  );

  // фон шапки в зависимости от скролла
  const barBg = scrolled ? "bg-bg/85 backdrop-blur border-border" : "bg-transparent border-transparent";

  // ── topbar: тонкая утилитарная строка (график/адрес) + основная строка ──────
  if (v === "topbar") {
    return (
      <header className="sticky top-0 z-50">
        <div className="hidden md:block bg-primary text-primary-fg/90 text-[13px]">
          <Container className="flex h-9 items-center justify-between">
            <span className="flex items-center gap-2"><Icon name="clock" className="w-3.5 h-3.5" />{sch.weekdays ?? "Пн–Пт: 9:00–20:00"}</span>
            {addr && <span className="flex items-center gap-2"><Icon name="mapPin" className="w-3.5 h-3.5" />{addr}</span>}
          </Container>
        </div>
        <div className={`border-b transition-colors duration-300 ${scrolled ? "bg-bg/90 backdrop-blur border-border" : "bg-bg border-border"}`}>
          <Container className="flex h-16 items-center justify-between gap-4">
            <Logo />
            <NavLinks className="hidden lg:flex" />
            <div className="hidden lg:flex items-center gap-4"><Phone /><Button href={cta.href}>{cta.label}</Button></div>
            <Burger />
          </Container>
        </div>
        <MobileMenu />
      </header>
    );
  }

  // ── centered: лого по центру, nav слева, действия справа ─────────────────────
  if (v === "centered") {
    return (
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${barBg}`}>
        <Container className="grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <NavLinks className="hidden lg:flex" />
          <Logo className="lg:justify-self-center" />
          <div className="hidden lg:flex items-center justify-end gap-4"><Phone /><Button href={cta.href}>{cta.label}</Button></div>
          <div className="col-start-3 flex justify-end lg:hidden"><Burger /></div>
        </Container>
        <MobileMenu />
      </header>
    );
  }

  // ── split: nav слева, лого по центру, телефон+CTA справа ─────────────────────
  if (v === "split") {
    return (
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${barBg}`}>
        <Container className="flex h-18 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo />
            <NavLinks className="hidden xl:flex" />
          </div>
          <div className="hidden lg:flex items-center gap-5"><Phone /><Button href={cta.href} variant="accent">{cta.label}</Button></div>
          <Burger />
        </Container>
        <MobileMenu />
      </header>
    );
  }

  // ── minimal: лого слева, только телефон + CTA, навигация в меню ───────────────
  if (v === "minimal") {
    return (
      <header className={`sticky top-0 z-50 transition-colors duration-300 ${scrolled ? "bg-bg/85 backdrop-blur" : "bg-transparent"}`}>
        <Container className="flex h-18 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden sm:block"><Phone /></span>
            <Button href={cta.href}>{cta.label}</Button>
            <button onClick={() => setOpen((x) => !x)} aria-label="Меню"
              className="grid h-11 w-11 place-items-center rounded-[var(--radius)] border border-border cursor-pointer">
              <Icon name={open ? "x" : "menu"} className="w-6 h-6" />
            </button>
          </div>
        </Container>
        {open && (
          <div className="border-t border-border bg-bg">
            <Container className="grid gap-1 py-4 sm:grid-cols-2">
              {nav.map((n: any) => (
                <a key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className="py-2.5 text-base cursor-pointer hover:text-accent">{n.label}</a>
              ))}
            </Container>
          </div>
        )}
      </header>
    );
  }

  // ── floating: «плавающая» закруглённая шапка с отступом от краёв ──────────────
  if (v === "floating") {
    return (
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className={`mx-auto max-w-[var(--container-max)] rounded-[var(--radius)] border px-4 transition-all duration-300 ${
          scrolled ? "border-border bg-surface/90 backdrop-blur shadow-[var(--shadow-card)]" : "border-border/60 bg-surface/70 backdrop-blur"}`}>
          <div className="flex h-15 items-center justify-between gap-4">
            <Logo />
            <NavLinks className="hidden lg:flex" />
            <div className="hidden lg:flex items-center gap-4"><Phone /><Button href={cta.href}>{cta.label}</Button></div>
            <Burger />
          </div>
        </div>
        <MobileMenu floating />
      </header>
    );
  }

  // ── classic (по умолчанию): лого слева, nav, телефон+CTA справа ──────────────
  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${barBg}`}>
      <Container className="flex h-16 sm:h-18 items-center justify-between gap-4">
        <Logo />
        <NavLinks className="hidden lg:flex" />
        <div className="hidden lg:flex items-center gap-4 shrink-0"><Phone /><Button href={cta.href}>{cta.label}</Button></div>
        <Burger />
      </Container>
      <MobileMenu />
    </header>
  );

  // мобильное меню (общее)
  function MobileMenu({ floating = false }: { floating?: boolean }) {
    if (!open) return null;
    return (
      <div className={`lg:hidden border-t border-border bg-bg ${floating ? "mx-3 mt-2 rounded-[var(--radius)] border" : ""}`}>
        <Container className="py-4 flex flex-col gap-1">
          {nav.map((n: any) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="py-2.5 text-base border-b border-border/60 cursor-pointer">{n.label}</a>
          ))}
          {phone && <a href={tel(phone)} className="py-2.5 font-medium">{phone}</a>}
          <Button href={cta.href} className="mt-3 w-full">{cta.label}</Button>
        </Container>
      </div>
    );
  }
}
