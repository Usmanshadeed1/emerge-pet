import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRevenueCatApiKey, PLANS, type PlanKey } from "@/lib/revenuecat";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan = body?.plan as PlanKey | undefined;

  if (!plan || !PLANS[plan]) {
    return NextResponse.json(
      { error: "plan must be 'monthly' or 'annual'." },
      { status: 400 }
    );
  }

  const apiKey = await getRevenueCatApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Payment system not configured. Contact support." },
      { status: 503 }
    );
  }

  const selectedPlan = PLANS[plan];
  const baseUrl      = process.env.NEXTAUTH_URL ?? "http://localhost:3333";

  // Create a RevenueCat checkout URL via their Billing API
  // This uses RevenueCat's Web Billing (checkout link generation)
  try {
    const res = await fetch("https://api.revenuecat.com/v1/checkout", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_user_id:   session.user.id,
        product_id:    selectedPlan.id,
        success_url:   `${baseUrl}/dashboard/upgrade?success=true`,
        cancel_url:    `${baseUrl}/dashboard/upgrade?cancelled=true`,
      }),
    });

    if (res.ok) {
      const data = await res.json() as { checkout_url?: string };
      if (data.checkout_url) {
        return NextResponse.json({ url: data.checkout_url });
      }
    }

    // RevenueCat Web Billing may not be available on all plans —
    // return a structured response so the frontend can handle gracefully
    return NextResponse.json({
      url:     null,
      planId:  selectedPlan.id,
      message: "Redirect to RevenueCat checkout",
    });
  } catch {
    return NextResponse.json({ error: "Failed to initiate checkout." }, { status: 500 });
  }
}
