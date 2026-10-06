import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/auth/oauth
//  Body: { provider: "facebook" | "google", accessToken?, name, email, providerId }
//
//  In production:
//    Facebook: verify the access token via
//      GET https://graph.facebook.com/me?fields=id,name,email&access_token=TOKEN
//    Google: verify via
//      GET https://www.googleapis.com/oauth2/v2/userinfo?access_token=TOKEN
//
//  In demo mode: we trust the frontend-sent user info.
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { provider, accessToken, name, email, providerId } = await req.json();

    if (!provider || !email) {
      return NextResponse.json({ ok: false, error: "Provider and email are required" }, { status: 400 });
    }

    let verifiedName = name || email.split("@")[0];
    let verifiedEmail = email;

    // === PRODUCTION: Verify the OAuth access token ===
    if (accessToken) {
      try {
        if (provider === "facebook") {
          const res = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
          );
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          verifiedName = data.name || verifiedName;
          verifiedEmail = data.email || verifiedEmail;
        } else if (provider === "google") {
          const res = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
          );
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          verifiedName = data.name || verifiedName;
          verifiedEmail = data.email || verifiedEmail;
        }
      } catch (e: any) {
        console.error(`[oauth.${provider}] token verification failed:`, e.message);
        // In demo mode, continue with frontend-sent data
        // In production, you'd return an error here
      }
    }

    // Check if user already exists by email
    let user = await db.user.findUnique({ where: { email: verifiedEmail } });

    if (!user) {
      user = await db.user.create({
        data: {
          name: verifiedName,
          email: verifiedEmail,
          passwordHash: `oauth_${provider}_${providerId || verifiedEmail}`,
          role: "CUSTOMER",
          isPremium: false,
          preferredCurrency: "NGN",
          preferredLanguage: "en",
          creditBalanceCents: 0,
          creditLimitCents: 0,
          creditUsedCents: 0,
        },
      });
    }

    const token = `oauth_${provider}_${user.id}_${Date.now()}`;

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id, email: user.email, name: user.name, role: user.role,
          isPremium: user.isPremium,
          preferredCurrency: user.preferredCurrency,
          preferredLanguage: user.preferredLanguage,
        },
        token,
        provider,
      },
    });
  } catch (err: any) {
    console.error("[auth.oauth]", err);
    return NextResponse.json({ ok: false, error: "OAuth login failed", detail: String(err.message) }, { status: 500 });
  }
}
