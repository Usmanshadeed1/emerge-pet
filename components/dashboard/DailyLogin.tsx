"use client";

import { useEffect } from "react";

export function DailyLogin() {
  useEffect(() => {
    fetch("/api/auth/daily-login", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
