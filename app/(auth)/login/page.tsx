"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const GoogleIcon = () => (
  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-4 w-4 flex-shrink-0 fill-current" viewBox="0 0 814 1000" aria-hidden="true">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-110.7C74 372 64 278 64 241c0-35.7 6.8-70.8 20.1-103.6 18.9-46.7 66.7-76.5 109.6-81.8 4.5-.5 9.3-.8 13.5-.8 34.1 0 68.2 14.5 91.6 38.3 22.3 22.7 37.6 54.6 37.6 91.1 0 2.8-.2 5.7-.5 8.5 2.8.2 5.7.4 8.5.4 34.2 0 69.5-15.7 96.7-40.5 26.6-24.3 44.4-57.1 44.4-90.4 0-3.2-.3-6.5-.8-9.7 1.2.2 2.4.4 3.5.4 36.4 0 68.4 18.9 93.7 52.4z" />
  </svg>
);

function LoginInner() {
  const searchParams   = useSearchParams();
  const callbackUrl    = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam     = searchParams.get("error");
  const successMessage = searchParams.get("success");

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  // Pre-fetch the CSRF token for the native form POST
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
  }, []);

  const errorMessage =
    errorParam === "CredentialsSignin" ? "Incorrect email or password. Please try again."
    : errorParam               ? "Something went wrong. Please try again."
    : "";

  async function handleOAuth(provider: "google" | "apple") {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl });
  }

  return (
    <div className="w-full max-w-[440px] anim-slide-up">
      {/* Logo + heading */}
      <div className="mb-7 flex flex-col items-center gap-2.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl shadow-lg shadow-green-600/30">
          🐾
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Sign in to EmergePet</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back — your pets are waiting</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 dark:shadow-black/50 ring-1 ring-gray-200 dark:ring-gray-700">

        {successMessage && (
          <div role="status" className="mb-5 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            {errorMessage}
          </div>
        )}

        {/* OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => handleOAuth("google")} disabled={!!oauthLoading} aria-label="Continue with Google"
            className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50">
            {oauthLoading === "google"
              ? <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              : <GoogleIcon />}
            Google
          </button>
          <button type="button" onClick={() => handleOAuth("apple")} disabled={!!oauthLoading} aria-label="Continue with Apple"
            className="flex h-11 items-center justify-center gap-2.5 rounded-xl bg-gray-900 text-sm font-medium text-white transition-all hover:bg-black hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50">
            {oauthLoading === "apple"
              ? <svg className="h-4 w-4 animate-spin text-white/50" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              : <AppleIcon />}
            Apple
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-700" /></div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400 dark:text-gray-500">or continue with email</span>
          </div>
        </div>

        {/*
          Native POST directly to next-auth's credentials callback.
          This is the most reliable way — next-auth sets the cookie in the
          HTTP response, the browser stores it, then follows the redirect.
          No race condition between cookie-setting and navigation.
        */}
        <form
          method="POST"
          action="/api/auth/callback/credentials"
          onSubmit={() => setLoading(true)}
          className="space-y-4"
        >
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <Input
            label="Email address"
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-green-600 hover:underline">Forgot password?</Link>
            </div>
            <Input
              label=""
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>Sign in</Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-green-600 hover:underline">Create one free</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
