import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// нужно для output: export (статическая генерация /sitemap.xml)
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `https://${site.brand.domain}`, lastModified: new Date(), priority: 1 }];
}
