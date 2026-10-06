import { db } from "@/lib/db";
import { HomeShowcase } from "@/components/acewears/home-showcase";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [products, categories, reels, tradeInItems] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { orderIdx: "asc" } },
        variants: { where: { isActive: true }, orderBy: { size: "asc" } },
        promoTags: { where: { isActive: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.reelItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true, slug: true, title: true,
            basePriceCents: true, currency: true, fit: true,
            images: { where: { angle: "FRONT" }, take: 1 },
            variants: { where: { isActive: true } },
          },
        },
      },
    }),
    // Existing trade-in items (demo buyer with stable ID)
    db.tradeInItem.findMany({
      where: { userId: "acewears-buyer-demo-id" },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { title: true, slug: true } } },
    }),
  ]);

  return (
    <HomeShowcase
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        basePriceCents: p.basePriceCents,
        currency: p.currency,
        creditSurchargePercent: p.creditSurchargePercent,
        fit: p.fit,
        material: p.material,
        tags: p.tags,
        images: p.images.map((i) => ({ url: i.url, altText: i.altText, angle: i.angle })),
        variants: p.variants.map((v) => ({
          id: v.id, size: v.size, color: v.color, stockCount: v.stockCount,
        })),
        promoTags: p.promoTags.map((pt) => ({ label: pt.label, kind: pt.kind })),
        category: { slug: p.category.slug, name: p.category.name },
      }))}
      categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
      reels={reels.map((r) => ({
        id: r.id,
        videoUrl: r.videoUrl,
        posterUrl: r.posterUrl,
        title: r.title,
        caption: r.caption,
        product: {
          id: r.product.id,
          slug: r.product.slug,
          title: r.product.title,
          basePriceCents: r.product.basePriceCents,
          currency: r.product.currency,
          fit: r.product.fit,
          images: r.product.images.map((i) => ({ url: i.url })),
          variants: r.product.variants.map((v) => ({
            id: v.id, size: v.size, color: v.color, stockCount: v.stockCount,
          })),
        },
      }))}
      tradeInItems={tradeInItems.map((t) => ({
        id: t.id,
        status: t.status,
        claimedCreditCents: t.claimedCreditCents,
        condition: t.condition,
        createdAt: t.createdAt.toISOString(),
        product: { title: t.product.title, slug: t.product.slug },
      }))}
    />
  );
}
