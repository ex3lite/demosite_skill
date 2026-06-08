import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// нужно для output: export (статическая генерация /robots.txt)
export const dynamic = "force-static";

// Обычный robots.txt — выглядит как у настоящего сайта.
// Запрет индексации управляется meta-тегом (site.seo.noindex), а не здесь.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    host: `https://${site.brand.domain}`,
  };
}
