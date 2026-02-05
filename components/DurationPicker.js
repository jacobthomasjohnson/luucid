"use client";

import { useEffect, useRef, useState } from "react";

import {
  CUSTOM_DURATION_MAX,
  CUSTOM_DURATION_MIN,
  DURATION_CHIPS_MINUTES,
} from "../lib/constants";

function clampMinutes(valueMinutes) {
  return Math.max(CUSTOM_DURATION_MIN, Math.min(CUSTOM_DURATION_MAX, Number(valueMinutes) || CUSTOM_DURATION_MIN));
}

function EditableMinutes({ valueMinutes, onChange, className, ariaLabel }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  const v = clampMinutes(valueMinutes);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      try {
        el.focus();
        el.select?.();
      } catch {
        // ignore
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [editing]);

  function commit() {
    const raw = String(draft || "").trim();
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setEditing(false);
      return;
    }
    onChange(clampMinutes(parsed));
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
    setDraft(String(v));
  }

  function startEditing() {
    setDraft(String(v));
    setEditing(true);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={`${className} cursor-text rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400`}
        aria-label={ariaLabel || `Duration ${v} minutes`}
      >
        {v}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => {
        const next = String(e.target.value || "")
          .replace(/[^0-9]/g, "")
          .slice(0, 3);
        setDraft(next);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      inputMode="numeric"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      aria-label={ariaLabel || `Duration ${v} minutes`}
      className={`${className} w-[4ch] bg-transparent p-0 text-center outline-none ring-0 border-0 shadow-none appearance-none caret-sky-400`}
    />
  );
}

export default function DurationPicker({ valueMinutes, onChange, mode = "full" }) {
  function step(delta) {
    onChange(clampMinutes(valueMinutes + delta));
  }

  if (mode === "minimal") {
    const v = clampMinutes(valueMinutes);

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-4">
        <EditableMinutes
          valueMinutes={v}
          onChange={onChange}
          className="text-6xl font-semibold tabular-nums tracking-tight text-(--luucid-text)"
          ariaLabel={`Duration ${v} minutes`}
        />
        <div className="text-sm font-medium text-(--luucid-muted)">Minutes</div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="flex items-center justify-center h-16 w-16 rounded-full bg-(--luucid-btn-white-bg) shadow-sm ring-1 ring-(--luucid-btn-white-border) text-2xl text-(--luucid-subtle) transition-colors duration-200 ease-out hover:bg-(--luucid-btn-white-hover-bg) active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            onClick={() => step(-1)}
            aria-label="Decrease duration"
          >
            −
          </button>

          <button
            type="button"
            className="h-16 w-16 rounded-full bg-(--luucid-btn-white-bg) shadow-sm ring-1 ring-(--luucid-btn-white-border) text-2xl text-(--luucid-subtle) transition-colors duration-200 ease-out hover:bg-(--luucid-btn-white-hover-bg) active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
                  ? "bg-(--luucid-accent-bg) text-(--luucid-accent-fg)"
                  : "bg-(--luucid-surface-soft) text-(--luucid-subtle) hover:bg-(--luucid-surface) shadow-sm ring-1 ring-(--luucid-border)"
              }`}
              aria-pressed={selected}
            >
              {m} min
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-(--luucid-surface-soft) p-3 shadow-sm ring-1 ring-(--luucid-border)">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-(--luucid-text)">Custom</div>
            <div className="text-xs text-(--luucid-muted)">{CUSTOM_DURATION_MIN} to {CUSTOM_DURATION_MAX} minutes</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-11 w-11 rounded-full bg-(--luucid-btn-white-bg) shadow-sm ring-1 ring-(--luucid-btn-white-border) text-(--luucid-subtle) hover:bg-(--luucid-btn-white-hover-bg) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              onClick={() => step(-1)}
              aria-label="Decrease duration"
            >
              −
            </button>

            <EditableMinutes
              valueMinutes={valueMinutes}
              onChange={onChange}
              className="min-w-18 text-center text-2xl font-semibold tabular-nums tracking-tight text-(--luucid-text)"
              ariaLabel={`Duration ${clampMinutes(valueMinutes)} minutes`}
            />

            <button
              type="button"
              className="h-11 w-11 rounded-full bg-(--luucid-btn-white-bg) shadow-sm ring-1 ring-(--luucid-btn-white-border) text-(--luucid-subtle) hover:bg-(--luucid-btn-white-hover-bg) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
