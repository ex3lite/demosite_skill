import { Icon } from "./Icon";

export function Stars({ value = 5, className = "" }: { value?: number; className?: string }) {
  const full = Math.round(value);
  return (
    <div className={`inline-flex items-center gap-0.5 text-accent ${className}`} aria-label={`Оценка ${value} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" className={`w-4 h-4 ${i < full ? "fill-accent" : "opacity-25"}`} />
      ))}
    </div>
  );
}
