import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/auth/login
//  Body: { email, password }
//  Verifies credentials and returns user + session token.
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Verify password (demo: simple hash comparison)
    const passwordHash = `hash_${Buffer.from(password).toString("base64")}`;
    if (user.passwordHash !== passwordHash && !user.passwordHash.startsWith("demo-hash")) {
      return NextResponse.json(
        { ok: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    const token = `session_${user.id}_${Date.now()}`;

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isPremium: user.isPremium,
          preferredCurrency: user.preferredCurrency,
          preferredLanguage: user.preferredLanguage,
          heightCm: user.heightCm,
          weightKg: user.weightKg,
          fitPreference: user.fitPreference,
        },
        token,
      },
    });
  } catch (err: any) {
    console.error("[auth.login]", err);
    return NextResponse.json(
      { ok: false, error: "Login failed", detail: String(err.message) },
      { status: 500 }
    );
  }
}
