import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const cats = await db.category.findMany({
    include: { children: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ ok: true, data: cats });
}
