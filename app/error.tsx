"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center max-w-md">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 dark:bg-red-900/30 text-4xl mx-auto">
          🚨
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Something went wrong</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          An unexpected error occurred. Our team has been notified. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
