"use client";

import { useEffect } from "react";
import { useLucentStore } from "../store/useLucentStore";

export default function AudioCatalogLoader() {
  const setAudioCatalog = useLucentStore((s) => s.actions.setAudioCatalog);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/audio-catalog", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.ok) return;
        if (cancelled) return;

        setAudioCatalog({
          backgrounds: Array.isArray(data.backgrounds) ? data.backgrounds : [],
          bells: Array.isArray(data.bells) ? data.bells : [],
        });
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [setAudioCatalog]);

  return null;
}
