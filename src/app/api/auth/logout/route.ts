import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/logout — clears the session (demo: just returns success)
export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: true, message: "Logged out successfully" });
}
