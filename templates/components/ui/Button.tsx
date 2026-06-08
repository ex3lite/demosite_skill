import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] " +
  "cursor-pointer select-none whitespace-nowrap " +
  "transition-[transform,background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] " +
  "active:scale-[0.98]";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  accent: "bg-accent text-[#0b0b0c] hover:opacity-90",
  outline: "border border-border bg-transparent text-text hover:bg-surface",
  ghost: "bg-transparent text-text hover:text-accent",
};
const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export function Button({
  href = "#", variant = "primary", size = "md", icon, iconRight, className = "", children,
}: {
  href?: string; variant?: Variant; size?: Size; icon?: string; iconRight?: string;
  className?: string; children: ReactNode;
}) {
  return (
    <a href={href} className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
      {icon && <Icon name={icon} className="w-[18px] h-[18px]" />}
      {children}
      {iconRight && <Icon name={iconRight} className="w-[18px] h-[18px]" />}
    </a>
  );
}
