"use client";

import { INTERVAL_OPTIONS_MINUTES } from "../lib/constants";

export default function IntervalControls({
  enabled,
  intervalMinutes,
  onToggle,
  onChangeInterval,
}) {
  const selectedMinutes = enabled ? intervalMinutes : 0;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Interval bells">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`rounded-full px-4 py-2.5 text-sm transition-all duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            selectedMinutes === 0
              ? "bg-zinc-900 text-white"
              : "bg-white/70 text-zinc-700 hover:bg-white ring-1 ring-zinc-100 hover:scale-[1.01]"
          }`}
          aria-pressed={selectedMinutes === 0}
        >
          No interval bells
        </button>

        {INTERVAL_OPTIONS_MINUTES.map((m) => {
          const selected = enabled && m === intervalMinutes;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                onToggle(true);
                onChangeInterval(m);
              }}
              className={`rounded-full px-4 py-2.5 text-sm transition-all duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                selected
                  ? "bg-zinc-900 text-white"
                  : "bg-white/70 text-zinc-700 hover:bg-white ring-1 ring-zinc-100 hover:scale-[1.01]"
              }`}
              aria-pressed={selected}
            >
              Every {m} min
            </button>
          );
        })}
      </div>
    </div>
  );
}
