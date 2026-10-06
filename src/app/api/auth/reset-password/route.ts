import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/reset-password
// Body: { token, newPassword }
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ ok: false, error: "Token and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find user with the reset token
    const users = await db.user.findMany({
      where: { passwordHash: { contains: `reset:${token}:` } },
    });

    if (users.length === 0) {
      return NextResponse.json({ ok: false, error: "Invalid or expired reset token" }, { status: 401 });
    }

    const user = users[0];
    
    // Extract and check expiry
    const match = user.passwordHash.match(/reset:([^:]+):(.+)$/);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Invalid reset token format" }, { status: 401 });
    }
    const expires = new Date(match[2]);
    if (expires < new Date()) {
      return NextResponse.json({ ok: false, error: "Reset token has expired" }, { status: 401 });
    }

    // Set new password (strip the reset token suffix)
    const passwordHash = `hash_${Buffer.from(newPassword).toString("base64")}`;
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true, message: "Password reset successfully. Please sign in with your new password." });
  } catch (err: any) {
    console.error("[auth.reset-password]", err);
    return NextResponse.json({ ok: false, error: "Failed to reset password" }, { status: 500 });
  }
}
