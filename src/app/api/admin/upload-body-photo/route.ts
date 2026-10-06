import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// POST /api/admin/upload-body-photo
// Accepts a single file upload and persists to /public/uploads/body/
// Returns { url }
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    // In production this would also verify the user is premium
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported file type: ${ext}` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "body");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const name = `${userId}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, name), buffer);

    return NextResponse.json({ ok: true, url: `/uploads/body/${name}` });
  } catch (err: any) {
    console.error("[upload-body-photo]", err);
    return NextResponse.json(
      { ok: false, error: "Upload failed", detail: String(err.message) },
      { status: 500 }
    );
  }
}
