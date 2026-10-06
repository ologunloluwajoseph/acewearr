import { NextRequest, NextResponse } from "next/server";

// ============================================================================
//  POST /api/notifications/register
//  Body: { userId, subscription }
//  Registers a push notification subscription (from the browser's
//  PushManager.subscribe() API). In production, this would store the
//  subscription in a PushSubscription model and use it to send push
//  notifications via the Web Push API.
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();
    if (!userId || !subscription) {
      return NextResponse.json({ ok: false, error: "userId and subscription are required" }, { status: 400 });
    }

    // In production:
    // 1. Store the subscription in the DB (PushSubscription model)
    // 2. When a notification needs to be sent (e.g. order shipped, restock alert):
    //    - Load the user's subscription
    //    - Use web-push library to send: webpush.sendNotification(subscription, payload)
    // 3. Service worker (sw.js) already has the push event listener

    console.log(`📱 Push notification subscription registered for user ${userId}`);

    return NextResponse.json({ ok: true, message: "Push notification subscription registered" });
  } catch (err: any) {
    console.error("[notifications.register]", err);
    return NextResponse.json({ ok: false, error: "Failed to register subscription" }, { status: 500 });
  }
}
