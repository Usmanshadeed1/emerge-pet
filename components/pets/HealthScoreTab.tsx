"use client";

import { useState } from "react";

interface Category {
  name:       string;
  score:      number;
  statusNote: string;
}

interface Recommendation {
  label: "URGENT" | "SOON" | "TIP";
  text:  string;
}

interface HealthScoreResult {
  overallScore:    number;
  grade:           string;
  categories:      Category[];
  recommendations: Recommendation[];
}

interface Props {
  petId:      string;
  petName:    string;
  isPremium:  boolean;
}

function RingScore({ score, grade }: { score: number; grade: string }) {
  const size       = 160;
  const stroke     = 14;
  const r          = (size - stroke) / 2;
  const circ       = 2 * Math.PI * r;
  const offset     = circ - (score / 100) * circ;
  const color      = score >= 80 ? "#22c55e" : score >= 60 ? "#f97316" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size, marginTop: -(size) }}
      >
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{grade}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{score}%</span>
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
  SOON:   "bg-orange-100 text-orange-700 border border-orange-200",
  TIP:    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 border border-blue-200",
};

const BAR_COLOR = (score: number) =>
  score >= 80 ? "bg-green-500" : score >= 60 ? "bg-orange-400" : "bg-red-500";

export function HealthScoreTab({ petId, petName, isPremium }: Props) {
  const [result,  setResult]  = useState<HealthScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/ai/health-score/${petId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setResult(data as HealthScoreResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-3xl">🔒</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Health Score is a Premium Feature</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Upgrade to EmergePet Premium to generate an AI-powered health score with a full breakdown and personalised recommendations.
        </p>
        <a
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
        >
          Upgrade to Premium
        </a>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-3xl">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Health Score</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Get a comprehensive health score for {petName} across 6 wellness categories with personalised recommendations.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 mb-4">
            {error}
          </p>
        )}
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            "Generate Health Score"
          )}
        </button>
      </div>
    );
  }

  const scoreColor = result.overallScore >= 80 ? "text-green-600" : result.overallScore >= 60 ? "text-orange-500" : "text-red-600";

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Health Score — {petName}</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Regenerating…
            </>
          ) : "Regenerate"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Ring + grade */}
      <div className="flex flex-col items-center py-4 relative">
        <RingScore score={result.overallScore} grade={result.grade} />
        <p className={`mt-2 text-sm font-medium ${scoreColor}`}>
          Overall Score: {result.overallScore}/100
        </p>
      </div>

      {/* 6 Category bars */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category Breakdown</h4>
        {result.categories.map((cat) => (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-white">{cat.score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_COLOR(cat.score)} transition-all duration-700`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.statusNote}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-2.5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recommendations</h4>
          {result.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[rec.label]}`}>
                {rec.label}
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{rec.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
