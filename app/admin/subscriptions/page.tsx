"use client";

import { useState, useEffect, useCallback } from "react";

type SubStatus = "ALL" | "ACTIVE" | "CANCELLED" | "EXPIRED";

interface Sub {
  id:              string;
  plan:            string;
  status:          string;
  currentPeriodEnd: string | null;
  createdAt:       string;
  user:            { name: string | null; email: string };
}

interface SubsData {
  subs:           Sub[];
  activeSubs:     number;
  monthlyRevenue: number;
}

const STATUS_TABS: { label: string; value: SubStatus }[] = [
  { label: "All",       value: "ALL"       },
  { label: "Active",    value: "ACTIVE"    },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired",   value: "EXPIRED"   },
];

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === "ACTIVE"    ? "bg-green-50 dark:bg-green-900/20  text-green-700 dark:text-green-400  ring-green-200 dark:ring-green-800"  :
    status === "CANCELLED" ? "bg-gray-100 dark:bg-gray-700  text-gray-600 dark:text-gray-400   ring-gray-200 dark:ring-gray-700"   :
                              "bg-red-50 dark:bg-red-900/20    text-red-700 dark:text-red-400    ring-red-200 dark:ring-red-800";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function AdminSubscriptionsPage() {
  const [data,    setData]    = useState<SubsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<SubStatus>("ALL");

  const load = useCallback(async (status: SubStatus) => {
    setLoading(true);
    const res  = await fetch(`/api/admin/subscriptions?status=${status}`);
    const json = await res.json() as SubsData;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Billing and subscription management.</p>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Subscriptions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.activeSubs}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</p>
            <p className="mt-1 text-3xl font-bold text-green-600">
              ${data.monthlyRevenue.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Records</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{data.subs.length}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              filter === tab.value
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-700 animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : !data || data.subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-3xl mb-3">💳</span>
            <p className="font-medium text-gray-700 dark:text-gray-300">No subscriptions found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span>User</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Renewal</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.subs.map((sub) => (
                <div key={sub.id} className="grid grid-cols-4 items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.user.name ?? "(no name)"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{sub.user.email}</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                    {sub.plan}
                  </span>
                  <StatusBadge status={sub.status} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
