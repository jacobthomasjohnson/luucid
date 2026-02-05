"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    // Focus after paint.
    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus?.();
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;

      const el = lastActiveRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--luucid-border) bg-(--luucid-surface-soft) shadow-sm backdrop-blur transition-colors hover:bg-(--luucid-surface) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        aria-label="Help"
        title="Help"
      >
        <span className="text-base font-semibold leading-none text-(--luucid-text)" aria-hidden="true">
          ?
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-background opacity-70 backdrop-blur" />

          <div className="relative w-full max-w-lg rounded-2xl border border-(--luucid-border) bg-(--luucid-surface) shadow-sm">
            <div className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <div id={titleId} className="text-base font-semibold text-(--luucid-text)">
                  How it works
                </div>
                <div className="mt-1 text-sm text-(--luucid-muted)">
                  Set up a simple meditation timer with optional background audio and bells.
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--luucid-border) bg-(--luucid-surface-soft) shadow-sm transition-colors hover:bg-(--luucid-surface) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label="Close help"
                title="Close"
              >
                <span className="text-lg leading-none text-(--luucid-text)" aria-hidden="true">
                  ×
                </span>
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="space-y-3 text-sm text-(--luucid-text)">
                <div className="rounded-2xl bg-(--luucid-surface-soft) p-4 shadow-sm ring-1 ring-(--luucid-border)">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Choose your session duration.</li>
                    <li>Select a background sound (it will preview when you tap it).</li>
                    <li>Pick a start bell and an end bell.</li>
                    <li>Optionally turn on interval bells (e.g. every 5 minutes).</li>
                    <li>Adjust background and bell volume, then press “Begin”.</li>
                  </ol>
                </div>

                <div className="text-sm text-(--luucid-muted)">
                  During a session you can pause/play, end the session, and (during warm up) skip warm up.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
