/* AceWears seed: products + variants + images + reviews + reels
   Run: bun run db:seed
*/
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const cats = [
  { slug: "tops",     name: "Tops" },
  { slug: "bottoms",  name: "Bottoms" },
  { slug: "outerwear", name: "Outerwear" },
  { slug: "shoes",     name: "Shoes" },
  { slug: "accessories", name: "Accessories" },
  { slug: "jewelry",   name: "Jewelry" },
  { slug: "wigs",      name: "Wigs & Hair" },
];

const products = [
  {
    slug: "tailored-navy-blazer",
    title: "AceWears Tailored Navy Blazer",
    description: "Italian-milled wool blazer with peak lapels and a slim modern silhouette. Engineered for drape retention through a half-canvas construction, this piece transitions from boardroom to evening without compromise.",
    basePriceCents: 28900, currency: "USD",
    material: "Italian Wool (98%) / Elastane (2%)",
    fit: "SLIM",
    care: "Dry clean only. Steam on low to refresh.",
    tags: "blazer, formal, wool, navy",
    categorySlug: "outerwear",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80&auto=format&fit=crop", altText: "Front view of navy blazer" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&q=80&auto=format&fit=crop", altText: "Back view of navy blazer" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1593030761757-71fae0555655?w=900&q=80&auto=format&fit=crop", altText: "Peak lapel detail" },
    ],
    variants: [
      { sku: "AW-BLAZER-NV-S", size: "S", color: "Navy", stockCount: 2 },
      { sku: "AW-BLAZER-NV-M", size: "M", color: "Navy", stockCount: 8 },
      { sku: "AW-BLAZER-NV-L", size: "L", color: "Navy", stockCount: 5 },
      { sku: "AW-BLAZER-NV-XL", size: "XL", color: "Navy", stockCount: 0 },
    ],
    sizeChart: [
      { size: "S",  chestCm: 96,  waistCm: 82, lengthCm: 72 },
      { size: "M",  chestCm: 102, waistCm: 88, lengthCm: 74 },
      { size: "L",  chestCm: 108, waistCm: 94, lengthCm: 76 },
      { size: "XL", chestCm: 114, waistCm: 100, lengthCm: 78 },
    ],
  },
  {
    slug: "amber-cashmere-knit",
    title: "Electric Amber Cashmere Knit",
    description: "12-gauge pure Mongolian cashmere sweater in our signature electric amber hue. Brushed for softness, rib-knit at the cuffs and hem for shape retention. A statement layer that elevates denim or tailoring.",
    basePriceCents: 18900, currency: "USD",
    material: "100% Mongolian Cashmere",
    fit: "REGULAR",
    care: "Hand wash cold, dry flat. Store folded.",
    tags: "cashmere, knit, amber, sweater",
    categorySlug: "tops",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80&auto=format&fit=crop", altText: "Front of amber knit" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80&auto=format&fit=crop&flip=h", altText: "Back of amber knit" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop", altText: "Knit texture detail" },
    ],
    variants: [
      { sku: "AW-KNT-AMB-S", size: "S", color: "Amber", stockCount: 4 },
      { sku: "AW-KNT-AMB-M", size: "M", color: "Amber", stockCount: 1 },
      { sku: "AW-KNT-AMB-L", size: "L", color: "Amber", stockCount: 7 },
    ],
    sizeChart: [
      { size: "S", chestCm: 92, waistCm: 80, lengthCm: 66 },
      { size: "M", chestCm: 98, waistCm: 86, lengthCm: 68 },
      { size: "L", chestCm: 104, waistCm: 92, lengthCm: 70 },
    ],
  },
  {
    slug: "teal-performance-chino",
    title: "Transformative Teal Performance Chino",
    description: "Mid-rise 4-way stretch chino in transformative teal. Moisture-wicking, wrinkle-resistant, and equipped with a hidden gusset for full range of motion. From desk to dinner, all-day comfort.",
    basePriceCents: 9900, currency: "USD",
    material: "Tech Twill: 64% Cotton, 32% Recycled Polyester, 4% Elastane",
    fit: "SLIM",
    care: "Machine wash cold, hang dry.",
    tags: "chino, teal, performance, pants",
    categorySlug: "bottoms",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&q=80&auto=format&fit=crop", altText: "Front of teal chino" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&q=80&auto=format&fit=crop&flip=h", altText: "Back of teal chino" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&q=80&auto=format&fit=crop", altText: "Chino pocket detail" },
    ],
    variants: [
      { sku: "AW-CHN-TL-30", size: "30", color: "Teal", stockCount: 12 },
      { sku: "AW-CHN-TL-32", size: "32", color: "Teal", stockCount: 3 },
      { sku: "AW-CHN-TL-34", size: "34", color: "Teal", stockCount: 6 },
    ],
    sizeChart: [
      { size: "30", chestCm: 0, waistCm: 76, hipCm: 96, lengthCm: 100 },
      { size: "32", chestCm: 0, waistCm: 82, hipCm: 102, lengthCm: 102 },
      { size: "34", chestCm: 0, waistCm: 88, hipCm: 108, lengthCm: 104 },
    ],
  },
  {
    slug: "navy-leather-sneaker",
    title: "Deep Navy Leather Sneaker",
    description: "Hand-finished calfskin low-top sneaker on a cup-sole. Memory-foam insole, padded collar, and a waxed cotton lace. Quiet luxury for the everyday rotation.",
    basePriceCents: 21900, currency: "USD",
    material: "Calfskin leather upper / Rubber sole",
    fit: "REGULAR",
    care: "Wipe clean with damp cloth. Condition monthly.",
    tags: "sneaker, leather, navy, shoes",
    categorySlug: "shoes",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop", altText: "Front of navy sneaker" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900&q=80&auto=format&fit=crop", altText: "Side of sneaker" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1606107557199-2e756b52c4d3?w=900&q=80&auto=format&fit=crop", altText: "Sneaker stitching detail" },
    ],
    variants: [
      { sku: "AW-SNK-NV-41", size: "41", color: "Navy", stockCount: 9 },
      { sku: "AW-SNK-NV-42", size: "42", color: "Navy", stockCount: 2 },
      { sku: "AW-SNK-NV-43", size: "43", color: "Navy", stockCount: 0 },
    ],
    sizeChart: [
      { size: "41", chestCm: 0, waistCm: 0, lengthCm: 26 },
      { size: "42", chestCm: 0, waistCm: 0, lengthCm: 27 },
      { size: "43", chestCm: 0, waistCm: 0, lengthCm: 28 },
    ],
  },
  {
    slug: "amber-leather-belt",
    title: "Amber Full-Grain Leather Belt",
    description: "Vegetable-tanned full-grain leather belt with brushed nickel buckle. Develops a rich patina over time. 35mm width, sized for everyday wear with denim or chinos.",
    basePriceCents: 7900, currency: "USD",
    material: "Full-grain Italian leather",
    fit: "REGULAR",
    care: "Condition quarterly with leather balm.",
    tags: "belt, leather, amber, accessory",
    categorySlug: "accessories",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=900&q=80&auto=format&fit=crop", altText: "Front of belt" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80&auto=format&fit=crop", altText: "Belt buckle detail" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1611085583191-93028e7d5f0a?w=900&q=80&auto=format&fit=crop", altText: "Leather grain detail" },
    ],
    variants: [
      { sku: "AW-BLT-AMB-32", size: "32", color: "Amber", stockCount: 14 },
      { sku: "AW-BLT-AMB-34", size: "34", color: "Amber", stockCount: 6 },
      { sku: "AW-BLT-AMB-36", size: "36", color: "Amber", stockCount: 4 },
    ],
    sizeChart: [
      { size: "32", chestCm: 0, waistCm: 82, lengthCm: 95 },
      { size: "34", chestCm: 0, waistCm: 88, lengthCm: 100 },
      { size: "36", chestCm: 0, waistCm: 94, lengthCm: 105 },
    ],
  },
  {
    slug: "navy-merino-crew",
    title: "Deep Navy Merino Crew",
    description: "19.5 micron extra-fine merino wool crewneck. Naturally temperature-regulating, breathable, and odor-resistant. A versatile layering essential in deep navy.",
    basePriceCents: 12900, currency: "USD",
    material: "100% Extra-fine Merino Wool (19.5 micron)",
    fit: "REGULAR",
    care: "Machine wash cold, wool cycle. Reshape and dry flat.",
    tags: "merino, wool, navy, sweater",
    categorySlug: "tops",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop", altText: "Front of navy crew" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop&flip=h", altText: "Back of navy crew" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80&auto=format&fit=crop", altText: "Stitch detail" },
    ],
    variants: [
      { sku: "AW-MER-NV-S", size: "S", color: "Navy", stockCount: 5 },
      { sku: "AW-MER-NV-M", size: "M", color: "Navy", stockCount: 8 },
      { sku: "AW-MER-NV-L", size: "L", color: "Navy", stockCount: 11 },
      { sku: "AW-MER-NV-XL", size: "XL", color: "Navy", stockCount: 3 },
    ],
    sizeChart: [
      { size: "S",  chestCm: 94,  waistCm: 82, lengthCm: 66 },
      { size: "M",  chestCm: 100, waistCm: 88, lengthCm: 68 },
      { size: "L",  chestCm: 106, waistCm: 94, lengthCm: 70 },
      { size: "XL", chestCm: 112, waistCm: 100, lengthCm: 72 },
    ],
  },

  // ============ JEWELRY (face closeup try-on) ============
  {
    slug: "amber-gold-hoop-earrings",
    title: "Electric Amber Gold Hoop Earrings",
    description: "14k gold-plated medium hoop earrings with a hand-set amber cubic zirconia accent. Lightweight, hypoallergenic, and engineered to catch light from every angle. The signature AceWears amber hue makes these the statement piece your jewelry rotation has been missing.",
    basePriceCents: 8900, currency: "USD",
    material: "14k Gold Plated Brass / Amber CZ",
    fit: "REGULAR",
    care: "Wipe clean with soft cloth. Avoid contact with perfumes.",
    tags: "earring, jewelry, gold, hoop, amber, accessory",
    categorySlug: "jewelry",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=900&q=80&auto=format&fit=crop", altText: "Front of amber gold hoop earrings" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1631982690223-8aa4be0a2497?w=900&q=80&auto=format&fit=crop", altText: "Back of earrings" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900&q=80&auto=format&fit=crop", altText: "Hoop closure detail" },
    ],
    variants: [
      { sku: "AW-EAR-HOOP-M", size: "M", color: "Gold/Amber", stockCount: 12 },
      { sku: "AW-EAR-HOOP-L", size: "L", color: "Gold/Amber", stockCount: 5 },
    ],
    sizeChart: [
      { size: "M", chestCm: 0, waistCm: 0, lengthCm: 3 },
      { size: "L", chestCm: 0, waistCm: 0, lengthCm: 5 },
    ],
  },
  {
    slug: "navy-pearl-pendant-necklace",
    title: "Deep Navy Pearl Pendant Necklace",
    description: "Freshwater baroque pearl suspended from a sterling silver chain, hand-finished in deep navy rhodium. The 18-inch length sits perfectly at the collarbone. A quiet-luxury staple that elevates a t-shirt or completes an evening look.",
    basePriceCents: 11900, currency: "USD",
    material: "Sterling Silver / Freshwater Pearl",
    fit: "REGULAR",
    care: "Store flat. Wipe pearl with damp cloth.",
    tags: "necklace, jewelry, pearl, silver, navy, pendant",
    categorySlug: "jewelry",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80&auto=format&fit=crop", altText: "Front of pearl pendant necklace" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&q=80&auto=format&fit=crop", altText: "Back of necklace" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1573408305245-2-7c5d1c0a4f4?w=900&q=80&auto=format&fit=crop", altText: "Pearl detail" },
    ],
    variants: [
      { sku: "AW-NEC-PRL-18", size: "18in", color: "Silver/Pearl", stockCount: 8 },
      { sku: "AW-NEC-PRL-20", size: "20in", color: "Silver/Pearl", stockCount: 3 },
    ],
    sizeChart: [
      { size: "18in", chestCm: 0, waistCm: 0, lengthCm: 46 },
      { size: "20in", chestCm: 0, waistCm: 0, lengthCm: 51 },
    ],
  },

  // ============ WIGS (headshot try-on) ============
  {
    slug: "amber-bob-wig",
    title: "Electric Amber Bob Wig",
    description: "Premium heat-resistant synthetic bob wig in our signature electric amber. 12-inch length with a side-swept part, lace front for natural hairline integration, and adjustable inner cap for secure fit. Pre-styled and ready to wear — the statement hairpiece for the bold.",
    basePriceCents: 14900, currency: "USD",
    material: "Heat-Resistant Synthetic Fiber / Lace Front",
    fit: "REGULAR",
    care: "Hand wash with wig shampoo. Air dry on wig stand.",
    tags: "wig, hairpiece, amber, bob, lace front, hair",
    categorySlug: "wigs",
    images: [
      { angle: "FRONT",  url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80&auto=format&fit=crop", altText: "Front of amber bob wig" },
      { angle: "BACK",   url: "https://images.unsplash.com/photo-1492106939443-df1b6f5f5f5b?w=900&q=80&auto=format&fit=crop", altText: "Back of wig" },
      { angle: "SIDE_DETAIL", url: "https://images.unsplash.com/photo-1581805680871-9c5b3f4ecb6b?w=900&q=80&auto=format&fit=crop", altText: "Lace front detail" },
    ],
    variants: [
      { sku: "AW-WIG-AMB-OS", size: "OS", color: "Amber", stockCount: 6 },
    ],
    sizeChart: [
      { size: "OS", chestCm: 0, waistCm: 0, lengthCm: 30 },
    ],
  },
];

const reels = [
  { videoUrl: "https://cdn.coverr.co/videos/coverr-a-man-walking-in-the-city-1080p.mp4", posterUrl: "https://images.unsplash.com/photo-1490114538077-0d7f8906b1f5?w=900&q=80", title: "The AceWears Tailoring Edit", caption: "Suiting that moves with you.", productSlug: "tailored-navy-blazer" },
  { videoUrl: "https://cdn.coverr.co/videos/coverr-a-woman-in-a-coat-walking-on-the-street-1080p.mp4", posterUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80", title: "Knit Season is Here", caption: "Cashmere in electric amber.", productSlug: "amber-cashmere-knit" },
  { videoUrl: "https://cdn.coverr.co/videos/coverr-walking-down-the-street-1080p.mp4", posterUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80", title: "Everyday Performance", caption: "Chinos built for movement.", productSlug: "teal-performance-chino" },
];

async function main() {
  console.log("Seeding AceWears database...");

  await db.tryOnResult.deleteMany();
  await db.bodyProfile.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.creditTransaction.deleteMany();
  await db.reviewPhoto.deleteMany();
  await db.review.deleteMany();
  await db.reelItem.deleteMany();
  await db.cartItem.deleteMany();
  await db.recentView.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.sizeChartEntry.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
  await db.promoTag.deleteMany();
  await db.tradeInItem.deleteMany();
  await db.notification.deleteMany();
  await db.address.deleteMany();

  // Demo admin — stable ID for predictable auth flow
  const admin = await db.user.create({
    data: {
      id: "acewears-admin-demo-id",
      email: "admin@acewears.com",
      passwordHash: "demo-hash-admin",
      name: "AceWears Admin",
      role: "ADMIN",
      isPremium: true,
      premiumSince: new Date(),
      heightCm: 178,
      weightKg: 75,
      fitPreference: "REGULAR",
    },
  });

  // Demo verified buyer — stable ID for predictable auth flow
  const buyer = await db.user.create({
    data: {
      id: "acewears-buyer-demo-id",
      email: "buyer@acewears.com",
      passwordHash: "demo-hash-buyer",
      name: "Verified Buyer",
      role: "CUSTOMER",
      isPremium: false, // buyer must activate premium via the activation page
      premiumSince: null,
      heightCm: 180,
      weightKg: 78,
      fitPreference: "SLIM",
    },
  });

  // Seed a body profile for the demo buyer so the try-on flow can be exercised
  // without requiring the user to upload a photo first.
  await db.bodyProfile.create({
    data: {
      userId: buyer.id,
      skinTone: "deep",
      hairStyle: "fade",
      hairColor: "black",
      eyeColor: "brown",
      bodyType: "MESOMORPH",
      bustChestCm: 102,
      waistCm: 84,
      hipCm: 100,
      inseamCm: 82,
      shoulderCm: 47,
      faceImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=512&q=80&auto=format&fit=crop",
      bodyImageUrl: "https://images.unsplash.com/photo-1506157786151-b8df1511ed91?w=512&q=80&auto=format&fit=crop",
      vlmExtractedAttrs: JSON.stringify({
        faceShape: "oval",
        jawLine: "defined",
        cheekbones: "medium",
        skinUndertone: "warm",
        hairTexture: "coily",
        eyeShape: "almond",
        build: "athletic-mesomorph",
        height: "tall",
        posture: "upright",
        genderPresentation: "masculine",
      }),
      consentToRender: true,
    },
  });

  const catMap: Record<string, { id: string }> = {};
  for (const c of cats) {
    catMap[c.slug] = await db.category.create({ data: { slug: c.slug, name: c.name } });
  }

  const prodMap: Record<string, { id: string }> = {};
  for (const p of products) {
    const created = await db.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        basePriceCents: p.basePriceCents,
        currency: p.currency,
        material: p.material,
        fit: p.fit,
        care: p.care,
        tags: p.tags,
        categoryId: catMap[p.categorySlug].id,
        isActive: true,
        images: {
          create: p.images.map((img, i) => ({
            angle: img.angle,
            url: img.url,
            altText: img.altText,
            orderIdx: i,
          })),
        },
        variants: {
          create: p.variants,
        },
        sizeChart: {
          create: p.sizeChart,
        },
      },
    });
    prodMap[p.slug] = created;

    if (p.variants.some(v => v.stockCount <= 2 && v.stockCount > 0)) {
      const lowStock = p.variants.find(v => v.stockCount <= 2 && v.stockCount > 0)!;
      await db.promoTag.create({
        data: {
          productId: created.id,
          label: `Only ${lowStock.stockCount} left in Size ${lowStock.size}`,
          kind: "SCARCITY",
          isActive: true,
          payload: JSON.stringify({ size: lowStock.size, count: lowStock.stockCount }),
        },
      });
    }
  }

  for (const r of reels) {
    await db.reelItem.create({
      data: {
        videoUrl: r.videoUrl,
        posterUrl: r.posterUrl,
        title: r.title,
        caption: r.caption,
        productId: prodMap[r.productSlug].id,
        isActive: true,
      },
    });
  }

  const blazer = prodMap["tailored-navy-blazer"];
  const blazerVariant = await db.productVariant.findFirst({ where: { productId: blazer.id, size: "L" } });
  if (!blazerVariant) throw new Error("Blazer L variant missing");

  const order = await db.order.create({
    data: {
      userId: buyer.id,
      status: "DELIVERED",
      subtotalCents: 28900,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 28900,
      currency: "USD",
      trackingNumber: "AW-1Z-9834-2271",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      items: {
        create: [{
          productId: blazer.id,
          variantId: blazerVariant.id,
          titleSnapshot: "AceWears Tailored Navy Blazer",
          priceCents: 28900,
          quantity: 1,
          sizeSnapshot: "L",
          reviewEligible: true,
        }],
      },
    },
  });

  const oi = await db.orderItem.findFirst({ where: { orderId: order.id } });
  if (oi) {
    const review = await db.review.create({
      data: {
        userId: buyer.id,
        productId: blazer.id,
        orderItemId: oi.id,
        rating: 5,
        title: "Impeccable tailoring",
        body: "The fit at size L was spot-on for my 180cm / 78kg frame. Shoulder drape is immaculate and the half-canvas construction gives genuine structure without stiffness. Wore it straight from the box to a wedding — zero break-in needed.",
        fitTags: "fit_true_to_size,quality_high",
        isVerified: true,
      },
    });
    await db.reviewPhoto.create({
      data: {
        reviewId: review.id,
        url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&auto=format&fit=crop",
        orderIdx: 0,
      },
    });
  }

  // Second DELIVERED order (sneaker) WITHOUT a review yet — so the
  // verified-buyer review flow can be demonstrated end-to-end.
  const sneaker = prodMap["navy-leather-sneaker"];
  const sneakerVariant = await db.productVariant.findFirst({ where: { productId: sneaker.id, size: "42" } });
  if (sneakerVariant) {
    await db.order.create({
      data: {
        userId: buyer.id,
        status: "DELIVERED",
        subtotalCents: 21900,
        shippingCents: 0,
        discountCents: 0,
        totalCents: 21900,
        currency: "USD",
        trackingNumber: "AW-1Z-9912-4471",
        placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        items: {
          create: [{
            productId: sneaker.id,
            variantId: sneakerVariant.id,
            titleSnapshot: "Deep Navy Leather Sneaker",
            priceCents: 21900,
            quantity: 1,
            sizeSnapshot: "42",
            reviewEligible: true,
          }],
        },
      },
    });
  }

  // Seed wishlist items for the demo buyer (3 items spanning categories
  // so the wishlist page + premium try-on-from-wishlist flow is testable)
  const wishlistProducts = [
    prodMap["amber-gold-hoop-earrings"],
    prodMap["amber-bob-wig"],
    prodMap["tailored-navy-blazer"],
  ].filter(Boolean);
  for (const wp of wishlistProducts) {
    await db.wishlistItem.create({
      data: {
        userId: buyer.id,
        productId: wp.id,
        note: "On my wishlist — would love to try this on!",
      },
    });
  }

  // ====== Credit system starts at ZERO for the demo buyer ======
  // Credit only grows when the user actually buys products at full price.
  // The surcharge from each purchase is credited to their balance.
  // We seed ONE completed order so the user has a transaction history,
  // but the starting balance is zero — they must buy more to unlock credit.
  const creditProduct = prodMap["navy-merino-crew"];
  if (creditProduct) {
    const creditVariant = await db.productVariant.findFirst({
      where: { productId: creditProduct.id, size: "M" },
    });
    if (creditVariant) {
      const creditOrder = await db.order.create({
        data: {
          userId: buyer.id,
          status: "DELIVERED",
          subtotalCents: creditProduct.basePriceCents,
          shippingCents: 0,
          discountCents: 0,
          totalCents: creditProduct.basePriceCents,
          currency: creditProduct.currency,
          trackingNumber: "AW-1Z-9934-1187",
          placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          items: {
            create: [{
              productId: creditProduct.id,
              variantId: creditVariant.id,
              titleSnapshot: creditProduct.title,
              priceCents: creditProduct.basePriceCents,
              quantity: 1,
              sizeSnapshot: "M",
              reviewEligible: true,
            }],
          },
        },
      });
      // Credit the surcharge from this purchase to the user's balance
      // Credit = price * 3% (default surchargePercent)
      const surchargePercent = (creditProduct as any).creditSurchargePercent ?? 3.0;
      const surcharge = Math.round(creditProduct.basePriceCents * surchargePercent / 100);
      await db.creditTransaction.create({
        data: {
          userId: buyer.id,
          productId: creditProduct.id,
          type: "EARNED",
          amountCents: surcharge,
          balanceAfterCents: surcharge,
          description: `Credit earned from purchase of ${creditProduct.title}`,
          orderId: creditOrder.id,
        },
      });
      await db.user.update({
        where: { id: buyer.id },
        data: {
          creditBalanceCents: surcharge,
          creditLimitCents: surcharge,
          creditUsedCents: 0,
        },
      });
    }
  }

  console.log(`Seed complete. Admin: ${admin.email}, Buyer: ${buyer.email} (credit starts at ₦${buyer.creditBalanceCents || 0} + earned surcharge)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
