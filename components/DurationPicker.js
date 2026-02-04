"use client";

import {
  CUSTOM_DURATION_MAX,
  CUSTOM_DURATION_MIN,
  DURATION_CHIPS_MINUTES,
} from "../lib/constants";

function clampMinutes(valueMinutes) {
  return Math.max(CUSTOM_DURATION_MIN, Math.min(CUSTOM_DURATION_MAX, Number(valueMinutes) || CUSTOM_DURATION_MIN));
}

export default function DurationPicker({ valueMinutes, onChange, mode = "full" }) {
  function step(delta) {
    onChange(clampMinutes(valueMinutes + delta));
  }

  if (mode === "minimal") {
    const v = clampMinutes(valueMinutes);

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-4">
        <div className="text-6xl font-semibold tabular-nums tracking-tight text-zinc-900" aria-label={`Duration ${v} minutes`}>
          {v}
        </div>
        <div className="text-sm font-medium text-zinc-500">Minutes</div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="h-16 w-16 rounded-full bg-white/80 ring-1 ring-zinc-100 text-2xl text-zinc-700 transition-all duration-200 ease-out hover:bg-white hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => step(-1)}
            aria-label="Decrease duration"
          >
            −
          </button>

          <button
            type="button"
            className="h-16 w-16 rounded-full bg-white/80 ring-1 ring-zinc-100 text-2xl text-zinc-700 transition-all duration-200 ease-out hover:bg-white hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => step(1)}
            aria-label="Increase duration"
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick durations">
        {DURATION_CHIPS_MINUTES.map((m) => {
          const selected = m === valueMinutes;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              className={`rounded-full px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                selected
                  ? "bg-zinc-900 text-white"
                  : "bg-white/70 text-zinc-700 hover:bg-white shadow-sm ring-1 ring-zinc-100"
              }`}
              aria-pressed={selected}
            >
              {m} min
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-zinc-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-zinc-900">Custom</div>
            <div className="text-xs text-zinc-500">{CUSTOM_DURATION_MIN} to {CUSTOM_DURATION_MAX} minutes</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-full bg-white/80 shadow-sm ring-1 ring-zinc-100 text-zinc-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              onClick={() => step(-1)}
              aria-label="Decrease duration"
            >
              −
            </button>

            <div
              className="min-w-18 text-center text-2xl font-semibold tabular-nums tracking-tight text-zinc-900"
              aria-label={`Duration ${valueMinutes} minutes`}
            >
              {valueMinutes}
            </div>

            <button
              type="button"
              className="h-11 w-11 rounded-full bg-white/80 shadow-sm ring-1 ring-zinc-100 text-zinc-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              onClick={() => step(1)}
              aria-label="Increase duration"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
