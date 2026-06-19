import Link from "next/link";

const PREMIUM_FEATURES = [
  "AI Symptom Checker",
  "Pet Health Score",
  "QR Code Emergency Sharing",
  "Rewards & Achievements",
  "AI Visit Prep",
];

interface PremiumGateProps {
  isPremium:   boolean;
  featureName?: string;
  children:    React.ReactNode;
}

export function PremiumGate({ isPremium, featureName, children }: PremiumGateProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 px-6 py-12 text-center">
      {/* Lock icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-100 dark:ring-amber-900">
        <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {featureName ? `${featureName} is a Premium feature` : "Premium feature"}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Upgrade to EmergePet Premium to unlock this feature and everything below.
      </p>

      {/* Feature list */}
      <ul className="mt-5 space-y-2 text-left">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 text-xs font-bold">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/upgrade"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all"
      >
        ⭐ Upgrade to Premium
      </Link>
    </div>
  );
}
