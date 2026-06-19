"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res  = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="anim-scale-in w-full max-w-[440px]">
        <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 ring-1 ring-green-100 dark:ring-green-900">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check your inbox</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            If an account exists for that email, we sent a reset link. Check your spam folder too.
          </p>
          <Link href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:underline">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] anim-slide-up">
      {/* Logo + heading */}
      <div className="mb-7 flex flex-col items-center gap-2.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl shadow-lg shadow-green-600/30">
          🐾
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Forgot password?</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">We&apos;ll email you a reset link</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70">
        {error && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Email address" type="email" id="email" autoComplete="email"
            placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="font-semibold text-green-600 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}


