"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SubscriptionStatus {
  isPremium:        boolean;
  plan:             "MONTHLY" | "ANNUAL" | null;
  status:           "ACTIVE" | "CANCELLED" | "EXPIRED" | null;
  currentPeriodEnd: string | null;
  subscribedAt:     string | null;
}

const PREMIUM_FEATURES = [
  { icon: "🩺", label: "AI Symptom Checker",          desc: "Instant urgency triage for your pet's symptoms" },
  { icon: "💯", label: "Pet Health Score",             desc: "AI-powered health rating across 6 categories" },
  { icon: "📱", label: "QR Code Emergency Sharing",   desc: "Printable QR tag with full medical info" },
  { icon: "🤖", label: "AI Visit Prep",               desc: "Pre-appointment summaries for your vet" },
  { icon: "⭐", label: "Rewards & Achievements",      desc: "Earn points and unlock badges for care habits" },
];

const PLANS = [
  {
    key:      "monthly" as const,
    label:    "Monthly",
    price:    "$4.99",
    period:   "/month",
    savings:  null,
    popular:  false,
  },
  {
    key:      "annual" as const,
    label:    "Annual",
    price:    "$39.99",
    period:   "/year",
    savings:  "Save 33%",
    popular:  true,
  },
];

export default function UpgradePage() {
  const [status,     setStatus]     = useState<SubscriptionStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [checkingOut, setCheckingOut] = useState<"monthly" | "annual" | null>(null);
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch("/api/subscriptions/status")
      .then((r) => r.json())
      .then((d: SubscriptionStatus) => setStatus(d))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: "monthly" | "annual") {
    setCheckingOut(plan);
    setError("");
    try {
      const res  = await fetch("/api/subscriptions/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json() as { url?: string; error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        // RevenueCat not yet configured — show friendly message
        setError("Payment system is not yet configured. Please contact support.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCheckingOut(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  // ── Already subscribed view ─────────────────────────────────────────────────
  if (status?.isPremium && status.plan) {
    const renewalDate = status.currentPeriodEnd
      ? new Date(status.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;

    return (
      <div className="mx-auto max-w-2xl anim-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Subscription</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your plan on EmergePet Premium.</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-2xl">⭐</div>
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Active Premium</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {status.plan === "ANNUAL" ? "Annual Plan" : "Monthly Plan"}
              </p>
              {status.status === "CANCELLED" && (
                <p className="text-xs text-red-500 font-medium mt-0.5">Cancelled — access until period end</p>
              )}
            </div>
          </div>

          {renewalDate && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 px-4 py-3 mb-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.status === "CANCELLED" ? "Access until" : "Next renewal"}: <span className="font-semibold text-gray-900 dark:text-white">{renewalDate}</span>
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
                <span className="ml-auto text-xs text-green-600 font-semibold">Active</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-800 transition text-center">
              Back to Dashboard
            </Link>
            <a
              href="https://app.revenuecat.com/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-sm font-semibold text-amber-600 hover:bg-amber-50 dark:bg-amber-900/20 transition text-center"
            >
              Manage Subscription
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Upgrade view ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl anim-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade to Premium</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Give your pets the care they deserve with AI-powered tools.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm transition ${
              plan.popular
                ? "ring-2 ring-amber-400 shadow-amber-100"
                : "ring-1 ring-gray-200 dark:ring-gray-700"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-white shadow">
                Most Popular
              </span>
            )}

            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{plan.label}</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mb-1">{plan.period}</span>
              </div>
              {plan.savings && (
                <span className="inline-block mt-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                  {plan.savings}
                </span>
              )}
            </div>

            <ul className="space-y-2.5 mb-6">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold mt-0.5">✓</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{f.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.key)}
              disabled={checkingOut !== null}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${
                plan.popular
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 hover:bg-amber-600"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {checkingOut === plan.key ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Redirecting…
                </span>
              ) : (
                `Get ${plan.label} Premium`
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Secure payment via RevenueCat. Cancel anytime.{" "}
        <Link href="/dashboard" className="underline hover:text-gray-600 dark:text-gray-400">Back to dashboard</Link>
      </p>
    </div>
  );
}
