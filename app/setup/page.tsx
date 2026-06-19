"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const router  = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [secret,    setSecret]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((d: { available: boolean }) => setAvailable(d.available));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/setup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ secret }),
    });

    const data = await res.json() as { ok?: boolean; error?: string };

    if (data.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/admin"), 2500);
    } else {
      setError(data.error ?? "Something went wrong.");
    }
    setLoading(false);
  }

  if (available === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-3xl">
            ✅
          </div>
          <h1 className="text-xl font-bold text-white">Admin Already Configured</h1>
          <p className="mt-2 text-sm text-slate-400">
            This setup page is no longer available. An admin account already exists.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-4xl">
            🎉
          </div>
          <h1 className="text-xl font-bold text-white">You&apos;re now an Admin!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your account has been promoted. Redirecting to the admin panel…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/20 text-3xl">
            🐾
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Setup</h1>
          <p className="mt-2 text-sm text-slate-400">
            One-time setup to activate your admin account. This page will disappear after use.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900 p-8 ring-1 ring-white/10 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
              Setup Secret
            </label>
            <input
              type="password"
              placeholder="Enter your setup secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Activating…" : "Activate Admin Access"}
          </button>

          <p className="text-center text-xs text-slate-500">
            You must be signed in to the account you want to promote.
          </p>
        </form>
      </div>
    </div>
  );
}
