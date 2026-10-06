import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
//  POST /api/auth/signup
//  Body: { name, email, password, preferredCurrency?, preferredLanguage? }
//  Creates a new user account. Password is hashed (simple hash for demo —
//  production would use bcrypt/argon2).
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, preferredCurrency, preferredLanguage } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password (demo: simple hash — production: bcrypt)
    const passwordHash = `hash_${Buffer.from(password).toString("base64")}`;

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CUSTOMER",
        isPremium: false,
        preferredCurrency: preferredCurrency || "NGN",
        preferredLanguage: preferredLanguage || "en",
        creditBalanceCents: 0,
        creditLimitCents: 0,
        creditUsedCents: 0,
      },
      select: {
        id: true, email: true, name: true, role: true, isPremium: true,
        preferredCurrency: true, preferredLanguage: true,
        heightCm: true, weightKg: true, fitPreference: true,
      },
    });

    // Generate a simple session token (demo — production: JWT signed with secret)
    const token = `session_${user.id}_${Date.now()}`;

    return NextResponse.json({
      ok: true,
      data: { user, token },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[auth.signup]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create account", detail: String(err.message) },
      { status: 500 }
    );
  }
}
