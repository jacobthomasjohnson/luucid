"use client";

import { BELLS } from "../lib/constants";
import { useState } from "react";
import {
  Bell,
  Square,
  CloudRain,
  Waves,
  Leaf,
  Mountain,
  Coffee,
  Wind,
  Flame,
  Moon,
  Slash,
} from "lucide-react";

const ICONS_BY_NAME = {
  Bell,
  Square,
  CloudRain,
  Waves,
  Leaf,
  Mountain,
  Coffee,
  Wind,
  Flame,
  Moon,
  Slash,
};

function getBellIcon({ iconName }) {
  if (iconName && ICONS_BY_NAME[iconName]) return ICONS_BY_NAME[iconName];
  return Bell;
}

export default function BellPicker({ label, valueId, onChange, onPreview, bells = BELLS }) {
  const items = Array.isArray(bells) && bells.length ? bells : BELLS;
  const [previewingId, setPreviewingId] = useState(null);

  async function activate(id) {
    onChange(id);
    setPreviewingId(id);
    try {
      await onPreview(id);
    } finally {
      window.setTimeout(() => {
        setPreviewingId((cur) => (cur === id ? null : cur));
      }, 900);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3" role="group" aria-label={`${label} options`}>
        {items.map((bell) => {
          const selected = bell.id === valueId;
          const playing = previewingId === bell.id;
          const Icon = getBellIcon({ iconName: bell.icon });

          return (
            <div
              key={bell.id}
              role="button"
              tabIndex={0}
              onClick={() => activate(bell.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activate(bell.id);
                }
              }}
              className={`group w-full rounded-2xl px-4 py-4 text-left ring-1 ring-inset transition-[transform,box-shadow,background-color] duration-200 ease-out active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 ${
                selected
                  ? "bg-(--luucid-surface) ring-(--luucid-border-strong)"
                  : "bg-(--luucid-surface-soft) ring-(--luucid-border) hover:bg-(--luucid-surface) hover:ring-(--luucid-border-strong)"
              }`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      aria-hidden="true"
                      className={`h-5 w-5 ${selected ? "text-(--luucid-text)" : "text-(--luucid-subtle)"}`}
                    />
                    <div className="text-sm font-medium text-(--luucid-text) leading-tight sm:truncate">{bell.label}</div>
                  </div>
                </div>

                <div
                  className={`text-xs font-medium text-(--luucid-muted) select-none transition-opacity duration-400 ease-out ${
                    playing ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!playing}
                >
                  Playing
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
