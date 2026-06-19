"use client";

import { useState } from "react";
import { VisitPrepTab } from "./VisitPrepTab";
import { HealthScoreTab } from "./HealthScoreTab";

type AISubTab = "visit-prep" | "health-score";

interface Props {
  petId:     string;
  petName:   string;
  isPremium: boolean;
}

export function AIToolsTab({ petId, petName, isPremium }: Props) {
  const [subTab, setSubTab] = useState<AISubTab>("visit-prep");

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
        <button
          onClick={() => setSubTab("visit-prep")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            subTab === "visit-prep"
              ? "bg-violet-600 text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700"
          }`}
        >
          Visit Prep
        </button>
        <button
          onClick={() => setSubTab("health-score")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            subTab === "health-score"
              ? "bg-green-600 text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700"
          }`}
        >
          Health Score
        </button>
      </div>

      {subTab === "visit-prep"   && <VisitPrepTab  petId={petId} petName={petName} />}
      {subTab === "health-score" && <HealthScoreTab petId={petId} petName={petName} isPremium={isPremium} />}
    </div>
  );
}
