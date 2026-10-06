import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, passwordResetEmail, generateToken } from "@/lib/email";

// POST /api/auth/forgot-password
// Body: { email }
// Generates a reset token, stores it, and sends a reset email.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    // Don't reveal if user exists — always return success
    if (!user) {
      return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the token in the user record (using passwordHash field temporarily in demo)
    // In production, you'd have a separate PasswordReset model
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: `${user.passwordHash}|reset:${token}:${expires.toISOString()}` },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}?reset=${token}`;
    
    const emailTemplate = passwordResetEmail({
      userName: user.name || email,
      resetUrl,
    });
    emailTemplate.to = email;
    await sendEmail(emailTemplate);

    return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (err: any) {
    console.error("[auth.forgot-password]", err);
    return NextResponse.json({ ok: false, error: "Failed to send reset email" }, { status: 500 });
  }
}
