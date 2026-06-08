import type { Metadata } from "next";
import "./globals.css";
import { site, img } from "@/lib/site";
import { Preloader } from "@/components/ui/Preloader";
import { SiteClient } from "@/components/ui/SiteClient";

// ── SEO из site.seo (статично на этапе сборки) ───────────────────────────────
const ogImage = img(site.seo.ogImageSlug) ?? img("og");
export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.brand.domain}`),
  title: site.seo.title,
  description: site.seo.description,
  keywords: site.seo.keywords,
  applicationName: site.brand.name,
  openGraph: {
    title: site.seo.title,
    description: site.seo.description,
    siteName: site.brand.name,
    locale: site.seo.locale,
    type: "website",
    images: ogImage ? [{ url: ogImage, width: 1536, height: 1024 }] : [],
  },
  twitter: { card: "summary_large_image", title: site.seo.title, description: site.seo.description,
    images: ogImage ? [ogImage] : [] },
  // По умолчанию не индексируем (сайт-витрина перед бэкендом). Переопределяется site.seo.noindex=false.
  robots: site.seo.noindex === false ? undefined : { index: false, follow: false },
};

// ── Google Fonts из site.design.fonts ────────────────────────────────────────
function fontsHref(): string {
  const fams = [site.design.fonts.display, site.design.fonts.body].map((f) => {
    const fam = f.family.trim().replace(/\s+/g, "+");
    const w = [...new Set(f.weights)].sort((a, b) => a - b).join(";");
    return `family=${fam}:wght@${w}`;
  });
  return `https://fonts.googleapis.com/css2?${fams.join("&")}&display=swap`;
}

// ── CSS-переменные темы из site.design ───────────────────────────────────────
function themeVars(): string {
  const p = site.design.palette;
  const stack = (fam: string, kind: "serif" | "sans") =>
    `"${fam}", ${kind === "serif" ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;
  const isSerifDisplay = /serif|garamond|playfair|cormorant|lora|merriweather/i.test(site.design.fonts.display.family);
  const d = site.design as any;
  return `:root{
    --c-bg:${p.bg};--c-surface:${p.surface};--c-text:${p.text};--c-muted:${p.muted};
    --c-primary:${p.primary};--c-primary-fg:${p.primaryFg};--c-accent:${p.accent};
    --c-accent-fg:${p.accentFg || "#0B0B0C"};
    --c-border:${p.border};--c-ring:${p.ring || p.primary};
    --c-font-display:${stack(site.design.fonts.display.family, isSerifDisplay ? "serif" : "sans")};
    --c-font-body:${stack(site.design.fonts.body.family, "sans")};
    --radius:${site.design.radius};--shadow-card:${site.design.shadow};
    --container-max:${d.containerMax || "72rem"};--section-y:${d.sectionY || "clamp(4rem,9vw,7rem)"};
  }`.replace(/\s+/g, " ");
}

// ── JSON-LD: Organization / LocalBusiness с реквизитами ──────────────────────
function jsonLd(): string {
  const c = site.company, k = site.contacts;
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: c.legal_name || site.brand.name,
    description: site.seo.description,
    url: `https://${site.brand.domain}`,
    telephone: k?.phone,
    email: k?.email,
    image: ogImage ? `https://${site.brand.domain}${ogImage}` : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: c?.address_actual?.street + ", " + c?.address_actual?.house,
      addressLocality: c?.address_actual?.city,
      postalCode: c?.address_actual?.postal_code,
      addressCountry: "RU",
    },
    geo: k?.map ? { "@type": "GeoCoordinates", latitude: k.map.lat, longitude: k.map.lon } : undefined,
    aggregateRating: site.stats?.rating
      ? { "@type": "AggregateRating", ratingValue: site.stats.rating, reviewCount: site.stats.reviews_count }
      : undefined,
  };
  return JSON.stringify(ld);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref()} />
        {(() => {
          const ic = img("logo");           // фавикон = логотип из бандла (/_next/static/media)
          if (!ic) return null;
          const type = ic.includes(".svg") ? "image/svg+xml" : ic.includes(".png") ? "image/png" : undefined;
          return (<>
            <link rel="icon" href={ic} {...(type ? { type } : {})} />
            <link rel="apple-touch-icon" href={ic} />
          </>);
        })()}
        <meta name="theme-color" content={site.design.palette.primary} />
      </head>
      <body>
        <Preloader />
        <a id="top" />
        {children}
        <SiteClient />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      </body>
    </html>
  );
}
