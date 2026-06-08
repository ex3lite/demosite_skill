import { site, img, tel } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

export default function Footer({ data }: { data: Section }) {
  const c = site.company ?? {};
  const k = site.contacts ?? {};
  const nav = site.nav ?? [];
  const logo = img("logo");

  return (
    <footer id={data.id} className="bg-[#0b0b0c] text-white/70">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* бренд */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 text-white">
              {logo ? <img src={logo} alt={site.brand.name} className="h-8 w-8 object-contain" /> :
                <span className="grid h-8 w-8 place-items-center rounded-[var(--radius)] bg-accent text-[#0b0b0c] font-display font-bold">{site.brand.name.charAt(0)}</span>}
              <span className="font-display text-lg font-semibold">{site.brand.name}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{site.brand.tagline}</p>
          </div>

          {/* навигация */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">Разделы</h4>
            <ul className="space-y-2.5 text-sm">
              {nav.map((n: any) => (
                <li key={n.href}><a href={n.href} className="hover:text-white transition-colors cursor-pointer">{n.label}</a></li>
              ))}
            </ul>
          </div>

          {/* контакты */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">Контакты</h4>
            <ul className="space-y-3 text-sm">
              {k.phone && <li className="flex items-center gap-2.5"><Icon name="phone" className="w-4 h-4 text-accent" /><a href={tel(k.phone)} className="hover:text-white cursor-pointer">{k.phone}</a></li>}
              {k.email && <li className="flex items-center gap-2.5"><Icon name="mail" className="w-4 h-4 text-accent" /><a href={`mailto:${k.email}`} className="hover:text-white cursor-pointer">{k.email}</a></li>}
              {k.address && <li className="flex items-start gap-2.5"><Icon name="mapPin" className="w-4 h-4 mt-0.5 text-accent shrink-0" /><span>{k.address}</span></li>}
            </ul>
          </div>

          {/* реквизиты */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">Реквизиты</h4>
            <dl className="space-y-1.5 text-sm tabular-nums">
              <div>{c.legal_name}</div>
              {c.inn && <div>ИНН {c.inn}{c.kpp ? ` · КПП ${c.kpp}` : ""}</div>}
              {c.ogrn && <div>{c.ogrn_kind} {c.ogrn}</div>}
            </dl>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-white/40">
          <p>© {c.founded_year ? `${c.founded_year}—2025` : "2025"} {c.legal_name || site.brand.name}. Все права защищены.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            <a href="#" data-no-scroll className="hover:text-white/70 transition-colors cursor-pointer">Политика конфиденциальности</a>
            <a href="#" data-no-scroll className="hover:text-white/70 transition-colors cursor-pointer">Согласие на обработку ПДн</a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
