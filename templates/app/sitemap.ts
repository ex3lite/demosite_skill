import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `https://${site.brand.domain}`, lastModified: new Date(), priority: 1 }];
}
