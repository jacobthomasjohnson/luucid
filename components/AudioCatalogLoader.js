"use client";

import { useEffect } from "react";
import { useLuucidStore } from "../store/useLuucidStore";

export default function AudioCatalogLoader() {
  const setAudioCatalog = useLuucidStore((s) => s.actions.setAudioCatalog);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/audio/catalog.json", { cache: "no-store" });
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
