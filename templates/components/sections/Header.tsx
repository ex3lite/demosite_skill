"use client";
import { useEffect, useState } from "react";
import { site, img, tel } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function Header({ data }: { data: Section }) {
  const nav = data.nav ?? site.nav ?? [];
  const phone = data.phone ?? site.contacts?.phone;
  const cta = data.cta ?? site.cta?.primary ?? { label: "Оставить заявку", href: "#contacts" };
  const logo = img("logo");

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${
      scrolled ? "bg-bg/85 backdrop-blur border-b border-border" : "bg-transparent border-b border-transparent"}`}>
      <Container className="flex h-16 sm:h-18 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          {logo ? (
            <img src={logo} alt={site.brand.name} className="h-9 w-9 object-contain" width={36} height={36} />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-primary text-primary-fg font-display font-semibold">
              {site.brand.name.charAt(0)}
            </span>
          )}
          <span className="font-display text-lg font-semibold tracking-tight">{site.brand.name}</span>
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-[15px] text-muted">
          {nav.map((n: any) => (
            <a key={n.href} href={n.href} className="hover:text-text transition-colors cursor-pointer">{n.label}</a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {phone && (
            <a href={tel(phone)} className="font-medium tabular-nums hover:text-accent transition-colors cursor-pointer">
              {phone}
            </a>
          )}
          <Button href={cta.href} variant="primary">{cta.label}</Button>
        </div>

        <button onClick={() => setOpen((v) => !v)} aria-label="Меню" aria-expanded={open}
          className="lg:hidden grid h-11 w-11 place-items-center rounded-[var(--radius)] border border-border cursor-pointer">
          <Icon name={open ? "x" : "menu"} className="w-6 h-6" />
        </button>
      </Container>

      {open && (
        <div className="lg:hidden border-t border-border bg-bg">
          <Container className="py-4 flex flex-col gap-1">
            {nav.map((n: any) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)}
                className="py-2.5 text-base border-b border-border/60 cursor-pointer">{n.label}</a>
            ))}
            {phone && <a href={tel(phone)} className="py-2.5 font-medium">{phone}</a>}
            <Button href={cta.href} variant="primary" className="mt-3 w-full">{cta.label}</Button>
          </Container>
        </div>
      )}
    </header>
  );
}
