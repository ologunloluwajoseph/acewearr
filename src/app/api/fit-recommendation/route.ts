import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/fit-recommendation
// Body: { productId, heightCm, weightKg, fitPreference }
// Returns: { recommendedSize, confidence, reasoning }
//
// Algorithm:
//  1. Load the product's size chart (chest/waist/length per size).
//  2. Estimate the user's chest/waist using standard anthropometric formulas
//     adjusted by fit preference (SLIM/REGULAR/RELAXED).
//  3. Score each size by sum of absolute deviation.
//  4. Return the size with the lowest deviation.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, heightCm, weightKg, fitPreference = "REGULAR" } = body;

    if (!productId || !heightCm || !weightKg) {
      return NextResponse.json(
        { ok: false, error: "productId, heightCm, weightKg are required" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { sizeChart: true },
    });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }
    if (product.sizeChart.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No size chart available for this product" },
        { status: 422 }
      );
    }

    // ---- Anthropometric estimate (simplified) ----
    // BMI-based chest estimate (Devine-derived heuristic).
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    // Base chest for an average male/female at this BMI
    const baseChest = 36 + 2.2 * (bmi - 21); // cm
    const baseWaist = 30 + 2.0 * (bmi - 21);

    // Fit preference tweaks how snug/loose the user wants the garment
    const fitOffset = fitPreference === "SLIM" ? -2 : fitPreference === "RELAXED" ? +3 : 0;
    const targetChest = baseChest + fitOffset;
    const targetWaist = baseWaist + fitOffset;

    // ---- Score each size ----
    let best: { size: string; score: number; chestCm: number; waistCm: number } | null = null;
    for (const row of product.sizeChart) {
      const dChest = Math.abs(row.chestCm - targetChest);
      const dWaist = Math.abs((row.waistCm || 0) - targetWaist);
      const score = dChest * 0.6 + dWaist * 0.4;
      if (!best || score < best.score) {
        best = { size: row.size, score, chestCm: row.chestCm, waistCm: row.waistCm || 0 };
      }
    }

    const confidence = Math.max(
      0,
      Math.min(1, 1 - (best?.score || 999) / 15)
    );

    return NextResponse.json({
      ok: true,
      data: {
        recommendedSize: best?.size,
        confidence: Math.round(confidence * 100) / 100,
        measurements: {
          estimatedChest: Math.round(targetChest),
          estimatedWaist: Math.round(targetWaist),
          bmi: Math.round(bmi * 10) / 10,
        },
        selectedSize: best
          ? { size: best.size, chestCm: best.chestCm, waistCm: best.waistCm }
          : null,
        reasoning: `Based on your height (${heightCm}cm), weight (${weightKg}kg) and ${fitPreference.toLowerCase()} fit preference, we estimate a chest of ~${Math.round(targetChest)}cm. Size ${best?.size} matches closest with a chest of ${best?.chestCm}cm.`,
      },
    });
  } catch (err: any) {
    console.error("[fit-recommendation]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to compute fit recommendation", detail: String(err.message) },
      { status: 500 }
    );
  }
}
