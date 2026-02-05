"use client";

import { BACKGROUNDS } from "../lib/constants";
import {
  CloudRain,
  Waves,
  Square,
  Leaf,
  Mountain,
  Coffee,
  Wind,
  Flame,
  Moon,
  Sparkles,
  Slash,
} from "lucide-react";

const ICONS_BY_NAME = {
  CloudRain,
  Waves,
  Square,
  Leaf,
  Mountain,
  Coffee,
  Wind,
  Flame,
  Moon,
  Sparkles,
  Slash,
};

function getBackgroundIcon({ id, iconName }) {
  if (iconName && ICONS_BY_NAME[iconName]) return ICONS_BY_NAME[iconName];
  if (id === "rain" || id === "rainy") return CloudRain;
  if (id === "ocean") return Waves;
  return Square;
}

export default function SoundGrid({
  selectedId,
  onSelect,
  onPreview,
  previewingId = null,
  backgrounds = BACKGROUNDS,
}) {
  const items = Array.isArray(backgrounds) && backgrounds.length ? backgrounds : BACKGROUNDS;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((bg) => {
        const selected = bg.id === selectedId;
        const playing = previewingId === bg.id;
        const Icon = getBackgroundIcon({ id: bg.id, iconName: bg.icon });

        function activate() {
          // If the currently selected sound is playing, tapping again should unselect it.
          if (selected && playing) {
            onPreview(bg.id);
            onSelect("none");
            return;
          }

          onSelect(bg.id);
          onPreview(bg.id);
        }

        return (
          <div key={bg.id} className="relative">
            <div
              role="button"
              tabIndex={0}
              onClick={activate}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activate();
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
                      <div className="text-sm font-medium text-(--luucid-text) leading-tight sm:truncate">{bg.label}</div>
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
          </div>
        );
      })}
    </div>
  );
}
