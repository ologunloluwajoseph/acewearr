import { NextRequest, NextResponse } from "next/server";

// ============================================================================
//  GET /api/app/version
//  Returns the current app version, changelog, and minimum required version.
//  Used by:
//  - The mobile app to check if an update is available
//  - The website to show "Update available" banners
//  - Developers to push updates to installed apps
// ============================================================================

export const APP_VERSIONS = [
  {
    version: "1.0.0",
    releasedAt: "2026-09-01",
    type: "major",
    title: "AceWears Launch",
    changelog: [
      "Full e-commerce platform with product catalog",
      "AI Virtual Try-On for premium users",
      "Buy on Credit with loyalty surcharge system",
      "Shoppable AceReels video feed",
      "Wishlist with social sharing",
      "Paystack checkout integration",
      "Multi-vendor marketplace",
      "11 languages + 4 currencies",
      "Dark mode support",
    ],
    minRequired: "1.0.0",
    downloadUrl: "/download/acewears-source.zip",
    size: "1.5MB",
  },
];

export async function GET(req: NextRequest) {
  const clientVersion = req.headers.get("x-app-version") || req.url.split("clientVersion=")[1]?.split("&")[0];
  const current = APP_VERSIONS[0];

  // Check if client needs an update
  let updateAvailable = false;
  let mustUpdate = false;
  if (clientVersion) {
    const clientParts = clientVersion.split(".").map(Number);
    const currentParts = current.version.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((currentParts[i] || 0) > (clientParts[i] || 0)) {
        updateAvailable = true;
        break;
      }
    }
    // Check if client version is below minimum required
    const minParts = current.minRequired.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((clientParts[i] || 0) < (minParts[i] || 0)) {
        mustUpdate = true;
        break;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    data: {
      currentVersion: current.version,
      releasedAt: current.releasedAt,
      title: current.title,
      changelog: current.changelog,
      minRequired: current.minRequired,
      downloadUrl: current.downloadUrl,
      size: current.size,
      updateAvailable,
      mustUpdate,
      features: {
        web: [
          "browse_products",
          "search_products",
          "add_to_cart",
          "checkout_paystack",
          "buy_on_credit",
          "wishlist",
          "account_management",
          "order_tracking",
          "purchase_history",
        ],
        app_only: [
          "ai_virtual_try_on",
          "premium_activation",
          "ace_reels",
          "trade_in_portal",
          "seller_dashboard",
          "loyalty_points",
          "push_notifications",
          "offline_browsing",
          "live_chat",
        ],
      },
    },
  });
}
