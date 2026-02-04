"use client";

import { INTERVAL_OPTIONS_MINUTES } from "../lib/constants";

export default function IntervalControls({
  enabled,
  intervalMinutes,
  onToggle,
  onChangeInterval,
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-900">Interval bells</div>
          <div className="text-xs text-zinc-500">Optional reminders during your session</div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            enabled ? "bg-sky-500" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 translate-x-1 rounded-full bg-white transition-transform duration-200 ease-out ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
          <span className="sr-only">Toggle interval bells</span>
        </button>
      </div>

      {enabled ? (
        <div className="mt-6">
          <div className="text-sm font-medium text-zinc-900">Frequency</div>
          <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Interval frequency">
            {INTERVAL_OPTIONS_MINUTES.map((m) => {
              const selected = m === intervalMinutes;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeInterval(m)}
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
      ) : null}
    </div>
  );
}
