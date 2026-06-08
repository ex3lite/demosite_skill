// Контракт данных демо-сайта. Совпадает с references/pipeline.md (раздел 3).
export type Img = string; // публичный путь, напр. "/images/hero.webp"

export interface Palette {
  bg: string; surface: string; text: string; muted: string;
  primary: string; primaryFg: string; accent: string; accentFg?: string;
  border: string; ring: string;
}
export interface FontDef { family: string; weights: number[]; }
export interface Design {
  mode: "light" | "dark";
  palette: Palette;
  fonts: { display: FontDef; body: FontDef };
  radius: string; style: string; shadow: string;
  containerMax?: string; sectionY?: string;
}
export interface CTA { label: string; href: string; }
export interface NavItem { label: string; href: string; }

// Секция: обязательны type+id, остальное — пропсы конкретного компонента.
export interface Section { type: string; id: string; [k: string]: any; }

export interface Seo {
  title: string; description: string; keywords: string[];
  ogImageSlug: string; locale: string; noindex?: boolean;
}
export interface Brand {
  name: string; legalName: string; tagline: string; slug: string; domain: string;
}

/** Профиль вариативности — делает каждый сайт структурно непохожим (анти-фингерпринт).
 *  Заполняется variation_engine.py. Компоненты читают свои варианты. */
export interface Variation {
  seed: number;
  preloader?: "spinner" | "bar" | "dots";
  animation?: "subtle" | "editorial" | "energetic";
  spacing?: "compact" | "normal" | "roomy";
  container?: "narrow" | "normal" | "wide";
  heroVariant?: string;
  sectionVariants?: Record<string, string>;
  [k: string]: any;
}

export interface Site {
  brand: Brand;
  design: Design;
  seo: Seo;
  company: any;
  contacts: any;
  schedule: any;
  stats: any;
  nav: NavItem[];
  cta: { primary: CTA; phoneLabel?: string };
  images: Record<string, Img>;
  legal?: { copyright?: string; privacyLabel?: string };
  variation?: Variation;
  sections: Section[];
}
