"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/** Live countdown (ticks every second) to `deadlineIso`. */
export function useCountdown(deadlineIso?: string | null): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadlineIso) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadlineIso]);

  const deadline = deadlineIso ? new Date(deadlineIso).getTime() : NaN;
  const diff = Number.isNaN(deadline) ? 0 : deadline - now;
  if (diff <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: !Number.isNaN(deadline) };
  }

  return {
    totalMs: diff,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    isPast: false,
  };
}
