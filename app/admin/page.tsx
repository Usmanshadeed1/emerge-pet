"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalUsers:      number;
  totalPets:       number;
  totalRecords:    number;
  activeSubs:      number;
  newUsersThisWeek: number;
  totalReminders:  number;
}

const CARDS = [
  {
    key:   "totalUsers" as keyof Stats,
    label: "Total Users",
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 ring-blue-100",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
      </svg>
    ),
  },
  {
    key:   "totalPets" as keyof Stats,
    label: "Total Pets",
    color: "bg-green-50 dark:bg-green-900/20 text-green-600 ring-green-100 dark:ring-green-900",
    icon: <span className="text-xl">🐾</span>,
  },
  {
    key:   "totalRecords" as keyof Stats,
    label: "Health Records",
    color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 ring-purple-100",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
      </svg>
    ),
  },
  {
    key:   "activeSubs" as keyof Stats,
    label: "Active Premium",
    color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 ring-amber-100 dark:ring-amber-900",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>
      </svg>
    ),
  },
  {
    key:   "newUsersThisWeek" as keyof Stats,
    label: "New This Week",
    color: "bg-teal-50 text-teal-600 ring-teal-100",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
      </svg>
    ),
  },
  {
    key:   "totalReminders" as keyof Stats,
    label: "Reminders Set",
    color: "bg-rose-50 text-rose-600 ring-rose-100",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
      </svg>
    ),
  },
];

export default function AdminAnalyticsPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d: Stats) => { setStats(d); setLoading(false); });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Platform overview at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="flex items-center gap-4 rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
          >
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
              {loading ? (
                <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              ) : (
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.[card.key]?.toLocaleString() ?? "—"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/users", label: "Manage Users" },
            { href: "/admin/subscriptions", label: "View Subscriptions" },
            { href: "/admin/settings", label: "Configure AI & Services" },
            { href: "/admin/emr", label: "Manage EMR Keys" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-green-300 hover:bg-green-50 dark:bg-green-900/20 hover:text-green-700 dark:text-green-400 transition-all"
            >
              {link.label}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
