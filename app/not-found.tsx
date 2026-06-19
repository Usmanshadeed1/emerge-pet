import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — EmergePet",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center max-w-md">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-600 text-4xl shadow-xl shadow-green-600/25 mx-auto">
          🐾
        </div>
        <h1 className="text-6xl font-extrabold text-green-600 mb-3">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Home Page
          </Link>
        </div>
      </div>
    </main>
  );
}
