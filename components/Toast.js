"use client";

import { useEffect } from "react";

export default function Toast({ open, message, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-sm rounded-xl border border-(--luucid-border) bg-(--luucid-surface) px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-(--luucid-text)">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-(--luucid-muted) hover:bg-(--luucid-btn-secondary-hover-bg) focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Dismiss"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
