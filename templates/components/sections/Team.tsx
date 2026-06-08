import { img, variantOf, initials } from "@/lib/site";
import type { Section } from "@/lib/types";
import { Section as SectionWrap } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

type Member = { name: string; position: string; experience_years?: number; image?: string };

export default function Team({ data }: { data: Section }) {
  const v = variantOf("team", "grid");
  const members: Member[] = data.members ?? [];

  if (members.length === 0) return null;

  // ── row: компактный ряд аватаров-кружков с подписями ──────────────────────
  if (v === "row") {
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Команда"}
        title={data.title ?? "Наши специалисты"}
        subtitle={data.subtitle}
      >
        <ul className="ds-stagger flex flex-wrap justify-center gap-x-8 gap-y-10 sm:gap-x-12">
          {members.map((member, i) => {
            const src = img(member.image);
            return (
              <li key={i} className="flex w-32 flex-col items-center text-center sm:w-36">
                {src ? (
                  <img
                    src={src}
                    alt={`${member.name} — ${member.position}`}
                    loading="lazy"
                    className="aspect-square w-24 rounded-full object-cover shadow-[var(--shadow-card)] sm:w-28"
                  />
                ) : (
                  <div className="grid aspect-square w-24 place-items-center rounded-full bg-primary/10 font-display text-2xl font-semibold text-primary sm:w-28">
                    {initials(member.name)}
                  </div>
                )}
                <div className="mt-4 font-display text-base font-semibold text-text">{member.name}</div>
                <div className="mt-0.5 text-sm text-accent">{member.position}</div>
                {member.experience_years != null && (
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted tabular-nums">
                    <Icon name="award" className="h-4 w-4 shrink-0" />
                    стаж {member.experience_years} лет
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </SectionWrap>
    );
  }

  // ── cards: горизонтальные карточки (фото слева, текст справа) ──────────────
  if (v === "cards") {
    return (
      <SectionWrap
        id={data.id}
        eyebrow={data.eyebrow ?? "Команда"}
        title={data.title ?? "Наши специалисты"}
        subtitle={data.subtitle}
      >
        <ul className="ds-stagger grid gap-6 sm:grid-cols-2">
          {members.map((member, i) => {
            const src = img(member.image);
            return (
              <li
                key={i}
                className="ds-hover-lift flex items-center gap-5 rounded-[var(--radius)] border border-border bg-surface p-5 sm:p-6"
              >
                {src ? (
                  <img
                    src={src}
                    alt={`${member.name} — ${member.position}`}
                    loading="lazy"
                    className="aspect-square w-24 shrink-0 rounded-[var(--radius)] object-cover sm:w-28"
                  />
                ) : (
                  <div className="grid aspect-square w-24 shrink-0 place-items-center rounded-[var(--radius)] bg-primary/10 font-display text-2xl font-semibold text-primary sm:w-28">
                    {initials(member.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-text">{member.name}</h3>
                  <p className="mt-0.5 text-sm text-accent">{member.position}</p>
                  {member.experience_years != null && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted tabular-nums">
                      <Icon name="award" className="h-4 w-4 shrink-0" />
                      стаж {member.experience_years} лет
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionWrap>
    );
  }

  // ── grid (по умолчанию): сетка карточек с вертикальным фото ────────────────
  return (
    <SectionWrap
      id={data.id}
      eyebrow={data.eyebrow ?? "Команда"}
      title={data.title ?? "Наши специалисты"}
      subtitle={data.subtitle}
    >
      <ul className="ds-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member, i) => {
          const src = img(member.image);
          return (
            <li key={i} className="group">
              <div className="overflow-hidden rounded-[var(--radius)]">
                {src ? (
                  <img
                    src={src}
                    alt={`${member.name} — ${member.position}`}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="grid aspect-[3/4] w-full place-items-center bg-primary/10 font-display text-5xl font-semibold text-primary">
                    {initials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-text">{member.name}</h3>
              <p className="mt-0.5 text-sm text-accent">{member.position}</p>
              {member.experience_years != null && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted tabular-nums">
                  <Icon name="award" className="h-4 w-4 shrink-0" />
                  стаж {member.experience_years} лет
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </SectionWrap>
  );
}
