export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 rounded-xl bg-gray-200 dark:bg-gray-700 mb-2" />
        <div className="h-4 w-64 rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-1.5" />
                <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
