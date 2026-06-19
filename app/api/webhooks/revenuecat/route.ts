import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planFromProductId } from "@/lib/revenuecat";

// RevenueCat webhook event types we care about
type RCEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "BILLING_ISSUE"
  | "EXPIRATION"
  | "SUBSCRIBER_ALIAS";

interface RCWebhookEvent {
  type:               RCEventType;
  app_user_id:        string;
  product_id:         string;
  expiration_at_ms:   number | null;
  purchased_at_ms:    number;
}

interface RCWebhookPayload {
  event: RCWebhookEvent;
}

export async function POST(req: Request) {
  let payload: RCWebhookPayload;

  try {
    payload = await req.json() as RCWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event } = payload;
  if (!event?.type || !event?.app_user_id) {
    return NextResponse.json({ error: "Missing event data" }, { status: 400 });
  }

  const userId           = event.app_user_id;
  const productId        = event.product_id ?? null;
  const plan             = planFromProductId(productId);
  const currentPeriodEnd = event.expiration_at_ms
    ? new Date(event.expiration_at_ms)
    : null;

  try {
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE": {
        // Upsert active subscription
        await db.subscription.upsert({
          where:  { userId },
          create: {
            userId,
            revenueCatId:    productId,
            plan,
            status:          "ACTIVE",
            currentPeriodEnd,
          },
          update: {
            revenueCatId:    productId,
            plan,
            status:          "ACTIVE",
            currentPeriodEnd,
          },
        });
        break;
      }

      case "CANCELLATION": {
        // Mark cancelled — still active until period end
        await db.subscription.upsert({
          where:  { userId },
          create: {
            userId,
            revenueCatId:    productId,
            plan,
            status:          "CANCELLED",
            currentPeriodEnd,
          },
          update: {
            status:          "CANCELLED",
            currentPeriodEnd,
          },
        });
        break;
      }

      case "EXPIRATION":
      case "BILLING_ISSUE": {
        // Mark expired — features should be gated
        await db.subscription.upsert({
          where:  { userId },
          create: {
            userId,
            revenueCatId:    productId,
            plan,
            status:          "EXPIRED",
            currentPeriodEnd,
          },
          update: {
            status:          "EXPIRED",
            currentPeriodEnd,
          },
        });
        break;
      }

      default:
        // Unknown event — acknowledge but take no action
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/revenuecat]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
