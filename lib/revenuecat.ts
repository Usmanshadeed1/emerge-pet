import { getSetting } from "@/lib/settings";

export const PLANS = {
  monthly: {
    id:       "emergepet_monthly",
    label:    "Monthly",
    price:    "$4.99",
    period:   "month",
    savings:  null,
  },
  annual: {
    id:       "emergepet_annual",
    label:    "Annual",
    price:    "$39.99",
    period:   "year",
    savings:  "Save 33%",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function getRevenueCatApiKey(): Promise<string | null> {
  return getSetting("revenuecat_api_key");
}

// Fetch a subscriber's entitlements from RevenueCat REST API
export async function getSubscriberEntitlements(userId: string): Promise<{
  isActive: boolean;
  expiresAt: Date | null;
  productId: string | null;
}> {
  const apiKey = await getRevenueCatApiKey();
  if (!apiKey) return { isActive: false, expiresAt: null, productId: null };

  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return { isActive: false, expiresAt: null, productId: null };

    const data = await res.json() as {
      subscriber?: {
        entitlements?: Record<string, {
          expires_date: string | null;
          product_identifier: string;
        }>;
      };
    };

    const entitlements = data.subscriber?.entitlements ?? {};
    const premium      = entitlements["premium"] ?? Object.values(entitlements)[0];

    if (!premium) return { isActive: false, expiresAt: null, productId: null };

    const expiresAt = premium.expires_date ? new Date(premium.expires_date) : null;
    const isActive  = !expiresAt || expiresAt > new Date();

    return { isActive, expiresAt, productId: premium.product_identifier };
  } catch {
    return { isActive: false, expiresAt: null, productId: null };
  }
}

// Determine plan type (MONTHLY | ANNUAL) from RevenueCat product identifier
export function planFromProductId(productId: string | null): "MONTHLY" | "ANNUAL" {
  if (!productId) return "MONTHLY";
  return productId.toLowerCase().includes("annual") ? "ANNUAL" : "MONTHLY";
}
