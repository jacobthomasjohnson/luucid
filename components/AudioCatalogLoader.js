"use client";

import { useEffect } from "react";
import { useLuucidStore } from "../store/useLuucidStore";
import { getAudioEngine } from "../lib/audioEngine";

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

  useEffect(() => {
    const audio = getAudioEngine();

    function tryUnlock() {
      // Fire-and-forget: unlock attempts are best-effort.
      audio.unlock();
    }

    // iOS/Safari generally requires a direct user gesture before audio can play.
    // Use a few common interaction events to unlock ASAP.
    window.addEventListener("pointerdown", tryUnlock, { passive: true, once: true });
    window.addEventListener("touchstart", tryUnlock, { passive: true, once: true });
    window.addEventListener("keydown", tryUnlock, { passive: true, once: true });

    return () => {
      window.removeEventListener("pointerdown", tryUnlock);
      window.removeEventListener("touchstart", tryUnlock);
      window.removeEventListener("keydown", tryUnlock);
    };
  }, []);

  return null;
}
