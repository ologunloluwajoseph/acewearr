import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/checkout/premium
//  Body: { userId, package: "monthly" | "quarterly" | "annual" }
//
//  Processes premium subscription payment via Paystack.
//  In production:
//    1. Initialize Paystack transaction with the plan amount
//    2. Redirect user to Paystack hosted page
//    3. On callback, verify → activate premium
//  In demo mode: instant activation
// ============================================================================
const PACKAGES: Record<string, { priceCents: number; durationMonths: number }> = {
  monthly:   { priceCents: 1499,  durationMonths: 1 },   // $14.99
  quarterly: { priceCents: 3999,  durationMonths: 3 },   // $39.99
  annual:    { priceCents: 13999, durationMonths: 12 }, // $139.99
};

export async function POST(req: NextRequest) {
  try {
    const { userId, package: pkgId } = await req.json();

    if (!userId || !pkgId) {
      return NextResponse.json(
        { ok: false, error: "userId and package are required" },
        { status: 400 }
      );
    }

    const pkg = PACKAGES[pkgId];
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: `Invalid package. Choose: ${Object.keys(PACKAGES).join(", ")}` },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (user.isPremium) {
      return NextResponse.json({ ok: true, data: { alreadyPremium: true } });
    }

    // In production: initialize Paystack transaction
    // const reference = `PREMIUM-${pkgId}-${Date.now()}`;
    // const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     email: user.email,
    //     amount: pkg.priceCents * 100, // Paystack uses kobo (multiply by 100)
    //     reference,
    //     callback_url: `${process.env.NEXT_PUBLIC_URL}/api/checkout/premium/verify?userId=${userId}&package=${pkgId}`,
    //     metadata: { userId, package: pkgId, type: "PREMIUM_SUBSCRIPTION" },
    //   }),
    // });
    // const paystackData = await paystackRes.json();
    // return NextResponse.json({ ok: true, data: { authorizationUrl: paystackData.data.authorization_url } });

    // Demo mode: instant activation
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumSince: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        activated: true,
        package: pkgId,
        priceCents: pkg.priceCents,
        durationMonths: pkg.durationMonths,
        message: `Premium activated! Enjoy AI Try-On and all premium features.`,
      },
    });
  } catch (err: any) {
    console.error("[checkout.premium]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to process premium payment", detail: String(err.message) },
      { status: 500 }
    );
  }
}
