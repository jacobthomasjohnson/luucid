"use client";

import { formatClock } from "../lib/time";

export default function TimerDisplay({ remainingSeconds, caption = "Remaining" }) {
  const text = formatClock(remainingSeconds);

  return (
    <div className="text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{caption}</div>
      <div
        className="mt-2 text-5xl font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-6xl"
        aria-label={`${caption} ${text}`}
      >
        {text}
      </div>
    </div>
  );
}
