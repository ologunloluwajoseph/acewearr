import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// ISR — regenerate the sitemap at most once per hour.
// This avoids querying the database at BUILD time, which would fail
// if DATABASE_URL isn't set during the Vercel build.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://acewears.com";

  // Static routes are always present, even if the database is unreachable.
  // These cover the marketing pages and section anchors.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/?section=catalog`, priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/?section=reels`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${baseUrl}/?section=wishlist`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${baseUrl}/?section=tradein`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/?section=premium`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${baseUrl}/?section=credit`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${baseUrl}/?section=terms`, priority: 0.5, changeFrequency: "yearly" },
  ];

  // Graceful fallback: if the database isn't reachable (e.g. during a cold start
  // when DATABASE_URL isn't yet configured), return just the static routes.
  // The site will still be crawlable; the dynamic product/category URLs will be
  // added once the database becomes available on the next regeneration.
  try {
    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.category.findMany({ select: { slug: true } }),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/?section=catalog&category=${c.slug}`,
      priority: 0.6,
      changeFrequency: "weekly" as const,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/?product=${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.warn("[sitemap] Database unreachable, returning static routes only:", error);
    return staticRoutes;
  }
}
