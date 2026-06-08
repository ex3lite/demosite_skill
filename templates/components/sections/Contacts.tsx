import { site, tel, variantOf } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export default function Contacts({ data }: { data: Section }) {
  const v = variantOf("contacts", "split-map");

  const k = site.contacts ?? {};
  const c = site.company ?? {};
  const sch = site.schedule ?? {};
  const bank = c.bank ?? {};
  const msg = k.messengers ?? {};

  const m = k.map ?? {};
  const d = 0.008;
  const hasMap = typeof m.lat === "number" && typeof m.lon === "number";
  const bbox = `${m.lon - d}%2C${m.lat - d}%2C${m.lon + d}%2C${m.lat + d}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${m.lat}%2C${m.lon}`;

  type ContactRow = { icon: string; label: string; value: string; href?: string };
  const rows: ContactRow[] = [];
  if (k.phone) rows.push({ icon: "phone", label: "Телефон", value: k.phone, href: tel(k.phone) });
  if (k.phone_mobile) rows.push({ icon: "phone", label: "Мобильный", value: k.phone_mobile, href: tel(k.phone_mobile) });
  if (k.email) rows.push({ icon: "mail", label: "Почта", value: k.email, href: `mailto:${k.email}` });
  if (k.address) rows.push({ icon: "mapPin", label: "Адрес", value: k.address });
  if (msg.telegram) rows.push({ icon: "send", label: "Telegram", value: msg.telegram.replace(/^https?:\/\/(t\.me\/)?/, "@"), href: msg.telegram.startsWith("http") ? msg.telegram : `https://t.me/${msg.telegram.replace(/^@/, "")}` });

  type ScheduleRow = { label: string; value: string };
  const schedule: ScheduleRow[] = [];
  if (sch.weekdays) schedule.push({ label: "Пн–Пт", value: sch.weekdays });
  if (sch.saturday) schedule.push({ label: "Суббота", value: sch.saturday });
  if (sch.sunday) schedule.push({ label: "Воскресенье", value: sch.sunday });

  type ReqRow = { label: string; value: string };
  const req: ReqRow[] = [];
  if (c.legal_name) req.push({ label: "Наименование", value: c.legal_name });
  if (c.inn) req.push({ label: "ИНН", value: String(c.inn) });
  if (c.kpp) req.push({ label: "КПП", value: String(c.kpp) });
  if (c.ogrn) req.push({ label: c.ogrn_kind ? String(c.ogrn_kind) : "ОГРН", value: String(c.ogrn) });
  if (bank.checking_account) req.push({ label: "Расчётный счёт", value: String(bank.checking_account) });
  if (bank.name) req.push({ label: "Банк", value: String(bank.name) });
  if (bank.bik) req.push({ label: "БИК", value: String(bank.bik) });
  if (bank.corr_account) req.push({ label: "Корр. счёт", value: String(bank.corr_account) });
  if (c.director?.full) req.push({ label: "Директор", value: String(c.director.full) });

  const ContactList = ({ className = "" }: { className?: string }) => (
    <ul className={`space-y-4 ${className}`}>
      {rows.map((r, i) => (
        <li key={i} className="flex items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
            <Icon name={r.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{r.label}</div>
            {r.href ? (
              <a
                href={r.href}
                className="font-display text-lg text-text transition-colors hover:text-accent cursor-pointer break-words"
              >
                {r.value}
              </a>
            ) : (
              <span className="font-display text-lg text-text break-words">{r.value}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  const ScheduleBlock = ({ withIcon = true }: { withIcon?: boolean }) => (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        {withIcon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
            <Icon name="clock" className="h-5 w-5" />
          </span>
        )}
        <h3 className="font-display text-lg font-semibold text-text">Режим работы</h3>
      </div>
      <dl className="space-y-2.5">
        {schedule.map((s, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 text-sm">
            <dt className="text-muted">{s.label}</dt>
            <dd className="font-medium text-text tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const Requisites = ({ className = "" }: { className?: string }) => (
    <div className={`rounded-[var(--radius)] border border-border bg-surface p-6 ${className}`}>
      <h3 className="mb-5 font-display text-lg font-semibold text-text">Реквизиты</h3>
      <dl className="space-y-3 text-sm tabular-nums">
        {req.map((r, i) => (
          <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-muted">{r.label}</dt>
            <dd className="font-medium text-text sm:text-right break-all">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const Map = ({ className = "" }: { className?: string }) => (
    <div className={`overflow-hidden rounded-[var(--radius)] ${className}`}>
      {hasMap ? (
        <iframe
          src={mapSrc}
          className="h-full w-full min-h-[340px] rounded-[var(--radius)] border border-border"
          loading="lazy"
          title="Карта проезда"
        />
      ) : (
        <div className="grid h-full min-h-[340px] place-items-center rounded-[var(--radius)] border border-border bg-gradient-to-br from-primary/15 to-accent/15 text-muted">
          <div className="flex flex-col items-center gap-2">
            <Icon name="mapPin" className="h-8 w-8 text-primary" />
            {k.address && <span className="px-6 text-center text-sm">{k.address}</span>}
          </div>
        </div>
      )}
    </div>
  );

  if (v === "map-top") {
    return (
      <SectionWrap id={data.id} eyebrow={data.eyebrow ?? "Контакты"} title={data.title ?? "Контакты"}>
        <Map className="ds-reveal aspect-[21/9]" />
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          <div className="ds-reveal">
            <h3 className="mb-5 font-display text-lg font-semibold text-text">Связаться с нами</h3>
            <ContactList />
          </div>
          {schedule.length > 0 && (
            <div className="ds-reveal">
              <ScheduleBlock />
            </div>
          )}
          {req.length > 0 && <Requisites className="ds-reveal" />}
        </div>
      </SectionWrap>
    );
  }

  if (v === "cards") {
    return (
      <SectionWrap id={data.id} eyebrow={data.eyebrow ?? "Контакты"} title={data.title ?? "Контакты"}>
        <div className="ds-stagger grid gap-6 lg:grid-cols-3">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-7">
            <h3 className="mb-5 font-display text-lg font-semibold text-text">Связаться с нами</h3>
            <ContactList />
          </div>
          {schedule.length > 0 && (
            <div className="rounded-[var(--radius)] border border-border bg-surface p-7">
              <ScheduleBlock />
            </div>
          )}
          {req.length > 0 && <Requisites className="p-7" />}
        </div>
        <Map className="ds-reveal mt-6 aspect-[21/9]" />
      </SectionWrap>
    );
  }

  // split-map (по умолчанию)
  return (
    <SectionWrap id={data.id} eyebrow={data.eyebrow ?? "Контакты"} title={data.title ?? "Контакты"}>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="ds-reveal space-y-8">
          <div>
            <h3 className="mb-5 font-display text-lg font-semibold text-text">Связаться с нами</h3>
            <ContactList />
          </div>
          {schedule.length > 0 && <ScheduleBlock />}
          {req.length > 0 && <Requisites />}
        </div>
        <Map className="ds-reveal h-full" />
      </div>
    </SectionWrap>
  );
}
