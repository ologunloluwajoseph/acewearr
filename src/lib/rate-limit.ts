/**
 * Simple rate limiter for AceWears API routes.
 * In production, use Redis or a proper rate limiting service.
 * This uses an in-memory Map for demo purposes.
 */

import { NextResponse } from "next/server";

type RateLimitEntry = { count: number; resetAt: number };

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given key (usually IP or userId).
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = maxRequests - entry.count;
  const allowed = entry.count <= maxRequests;

  return { allowed, remaining: Math.max(0, remaining), resetAt: entry.resetAt };
}

/**
 * Rate limit presets for different endpoint types
 */
export const RATE_LIMITS = {
  // Auth: 10 requests per minute per IP (prevent brute force)
  AUTH: { maxRequests: 10, windowMs: 60 * 1000 },
  // Checkout: 5 per minute (prevent fraud)
  CHECKOUT: { maxRequests: 5, windowMs: 60 * 1000 },
  // Try-on: 3 per minute (AI generation is expensive)
  TRY_ON: { maxRequests: 3, windowMs: 60 * 1000 },
  // General API: 100 per minute
  GENERAL: { maxRequests: 100, windowMs: 60 * 1000 },
  // Search: 30 per minute
  SEARCH: { maxRequests: 30, windowMs: 60 * 1000 },
};

/**
 * Helper for Next.js API routes — returns null if allowed, or a 429 Response
 */
export function enforceRateLimit(
  req: Request,
  preset: keyof typeof RATE_LIMITS = "GENERAL"
): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limit = RATE_LIMITS[preset];
  const result = checkRateLimit(ip, limit.maxRequests, limit.windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}
