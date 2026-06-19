"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token  = params.token as string;

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    setLoading(true);
    const res  = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErrors({ form: data.error ?? "Something went wrong." }); return; }
    setSuccess(true);
    setTimeout(() => router.push("/login?success=Password+updated+successfully.+Please+sign+in."), 2200);
  }

  if (success) {
    return (
      <div className="anim-scale-in w-full max-w-[440px]">
        <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 ring-1 ring-green-100 dark:ring-green-900">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password updated!</h2>
          <p className="mt-2.5 text-sm text-gray-500 dark:text-gray-400">Redirecting you to sign in…</p>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div className="h-full rounded-full bg-green-500" style={{ width: "100%", animation: "shrink 2.2s linear forwards" }} />
          </div>
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
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Set a new password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Choose something strong and unique.</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900/90 backdrop-blur-sm p-8 shadow-2xl shadow-gray-300/50 ring-1 ring-gray-200 dark:ring-gray-700/70">
        {errors.form && (
          <div role="alert" className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            {errors.form}{" "}
            {errors.form?.includes("invalid or has expired") && (
              <Link href="/forgot-password" className="font-medium underline">Request a new link</Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="New password" type="password" id="password" autoComplete="new-password"
            placeholder="Min. 8 characters" value={password} error={errors.password}
            onChange={(e) => setPassword(e.target.value)} required />

          <Input label="Confirm new password" type="password" id="confirmPassword" autoComplete="new-password"
            placeholder="Re-enter your password" value={confirmPassword} error={errors.confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} required />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Update password
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
