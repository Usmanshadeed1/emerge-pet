"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email,   setEmail]   = useState("");
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("/api/newsletter/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-green-300 font-medium text-sm">
        ✓ You&apos;re on the list! We&apos;ll keep you posted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/40"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {status === "loading" ? "Subscribing…" : "Stay Updated"}
      </button>
      {status === "error" && (
        <p className="text-red-300 text-xs mt-1 w-full">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
