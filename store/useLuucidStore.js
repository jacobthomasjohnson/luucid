"use client";

import { create } from "zustand";
import { BACKGROUNDS, BELLS, DEFAULTS, getBackgroundById, getBellById } from "../lib/constants";
import { clampNumber, minutesToSeconds } from "../lib/time";
import { getAudioEngine } from "../lib/audioEngine";

function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function computeElapsedSeconds(runtime, tMs) {
  if (!runtime.startedAtMs) return 0;
  const base = tMs - runtime.startedAtMs - runtime.pausedTotalMs;
  return Math.max(0, base / 1000);
}

function shouldPlayIntervalBell({ intervalEnabled, intervalSeconds, durationSeconds, nextIntervalAtSeconds }) {
  if (!intervalEnabled) return false;
  if (!intervalSeconds || intervalSeconds <= 0) return false;
  if (!durationSeconds || durationSeconds <= 0) return false;

  // Avoid interval at the very end; end bell handles completion.
  if (nextIntervalAtSeconds >= durationSeconds) return false;
  return true;
}

const WARMUP_SECONDS = 60;

export const useLuucidStore = create((set, get) => ({
  toast: {
    open: false,
    message: "",
  },

  audioCatalog: {
    backgrounds: BACKGROUNDS,
    bells: BELLS,
  },

  preview: {
    kind: null, // null | 'background'
    id: null,
  },

  preload: {
    backgrounds: false,
    bells: false,
  },

  ui: {
    shellMinHeight: 0,
  },

  config: {
    backgroundId: DEFAULTS.backgroundId,
    durationMinutes: DEFAULTS.durationMinutes,
    startBellId: DEFAULTS.startBellId,
    endBellId: DEFAULTS.endBellId,

    intervalEnabled: DEFAULTS.intervalEnabled,
    intervalMinutes: DEFAULTS.intervalMinutes,

    backgroundVolume: DEFAULTS.backgroundVolume,
    bellVolume: DEFAULTS.bellVolume,
  },

  runtime: {
    status: "idle", // idle | running | paused | complete
    mode: "session", // warmup | session
    warmupSeconds: WARMUP_SECONDS,
    durationSeconds: minutesToSeconds(DEFAULTS.durationMinutes),

    startedAtMs: 0,
    pausedAtMs: 0,
    pausedTotalMs: 0,

    lastTickMs: 0,
    remainingSeconds: minutesToSeconds(DEFAULTS.durationMinutes),

    intervalSeconds: minutesToSeconds(DEFAULTS.intervalMinutes),
    nextIntervalAtSeconds: minutesToSeconds(DEFAULTS.intervalMinutes),

    completedNaturally: false,
  },

  actions: {
    setShellMinHeight(height) {
      const h = Math.max(0, Math.ceil(Number(height) || 0));
      if (!h) return;
      set((s) => ({
        ui: {
          ...(s.ui || {}),
          shellMinHeight: Math.max(Number(s.ui?.shellMinHeight) || 0, h),
        },
      }));
    },

    stopPreview() {
      getAudioEngine().stopPreview({ fadeOutSeconds: 0.2 });
      set({ preview: { kind: null, id: null } });
    },

    async preloadCatalog({ backgrounds = false, bells = false } = {}) {
      const { audioCatalog, preload } = get();
      const audio = getAudioEngine();

      async function runWithLimit(tasks, limit) {
        const pending = [...tasks];
        const workers = Array.from({ length: Math.max(1, limit) }, async () => {
          while (pending.length) {
            const task = pending.shift();
            try {
              await task();
            } catch {
              // ignore
            }
          }
        });
        await Promise.all(workers);
      }

      const tasks = [];

      if (backgrounds && !preload.backgrounds) {
        set((s) => ({ preload: { ...s.preload, backgrounds: true } }));
        for (const bg of audioCatalog.backgrounds || []) {
          if (!bg?.src) continue;
          tasks.push(() => audio.preload({ src: bg.src, kind: "background" }));
        }
      }

      if (bells && !preload.bells) {
        set((s) => ({ preload: { ...s.preload, bells: true } }));
        for (const bell of audioCatalog.bells || []) {
          if (!bell?.src) continue;
          tasks.push(() => audio.preload({ src: bell.src, kind: "bell" }));
        }
      }

      if (!tasks.length) return;

      // Keep bandwidth/CPU reasonable.
      await runWithLimit(tasks, 2);
    },
    setAudioCatalog({ backgrounds, bells }) {
      set((s) => ({
        audioCatalog: {
          backgrounds: Array.isArray(backgrounds) && backgrounds.length ? backgrounds : s.audioCatalog.backgrounds,
          bells: Array.isArray(bells) && bells.length ? bells : s.audioCatalog.bells,
        },
      }));
    },
    showToast(message) {
      set({ toast: { open: true, message: String(message || "") } });
      window.clearTimeout(get()._toastTimer);
      const timer = window.setTimeout(() => {
        set({ toast: { open: false, message: "" } });
      }, 2500);
      set({ _toastTimer: timer });
    },

    dismissToast() {
      set({ toast: { open: false, message: "" } });
    },

    resetAll() {
      const audio = getAudioEngine();
      audio.stopAll();
      audio.setBackgroundVolume(DEFAULTS.backgroundVolume);
      audio.setBellVolume(DEFAULTS.bellVolume);

      set({
        preview: { kind: null, id: null },
        config: {
          backgroundId: DEFAULTS.backgroundId,
          durationMinutes: DEFAULTS.durationMinutes,
          startBellId: DEFAULTS.startBellId,
          endBellId: DEFAULTS.endBellId,
          intervalEnabled: DEFAULTS.intervalEnabled,
          intervalMinutes: DEFAULTS.intervalMinutes,
          backgroundVolume: DEFAULTS.backgroundVolume,
          bellVolume: DEFAULTS.bellVolume,
        },
        runtime: {
          ...get().runtime,
          status: "idle",
          mode: "session",
          warmupSeconds: WARMUP_SECONDS,
          durationSeconds: minutesToSeconds(DEFAULTS.durationMinutes),
          remainingSeconds: minutesToSeconds(DEFAULTS.durationMinutes),
          startedAtMs: 0,
          pausedAtMs: 0,
          pausedTotalMs: 0,
          lastTickMs: 0,
          intervalSeconds: minutesToSeconds(DEFAULTS.intervalMinutes),
          nextIntervalAtSeconds: minutesToSeconds(DEFAULTS.intervalMinutes),
          completedNaturally: false,
        },
      });
    },

    setBackground(id) {
      set((s) => ({ config: { ...s.config, backgroundId: id } }));
    },

    setDurationMinutes(value) {
      const v = clampNumber(value, 1, 180);
      set((s) => ({
        config: { ...s.config, durationMinutes: v },
        runtime: {
          ...s.runtime,
          durationSeconds: minutesToSeconds(v),
          remainingSeconds: minutesToSeconds(v),
        },
      }));
    },

    setStartBell(id) {
      set((s) => ({ config: { ...s.config, startBellId: id } }));
    },

    setEndBell(id) {
      set((s) => ({ config: { ...s.config, endBellId: id } }));
    },

    setIntervalEnabled(enabled) {
      set((s) => ({ config: { ...s.config, intervalEnabled: Boolean(enabled) } }));
    },

    setIntervalMinutes(value) {
      const v = clampNumber(value, 1, 180);
      set((s) => ({ config: { ...s.config, intervalMinutes: v } }));
    },

    setBackgroundVolume(value) {
      const v = Math.max(0, Math.min(1, Number(value)));
      const audio = getAudioEngine();
      audio.setBackgroundVolume(v);
      set((s) => ({ config: { ...s.config, backgroundVolume: v } }));
    },

    setBellVolume(value) {
      const v = Math.max(0, Math.min(1, Number(value)));
      const audio = getAudioEngine();
      audio.setBellVolume(v);
      set((s) => ({ config: { ...s.config, bellVolume: v } }));
    },

    async previewBackground(backgroundId) {
      // Back-compat: treat preview as a toggle for looping background previews.
      return get().actions.togglePreviewBackground(backgroundId);
    },

    async togglePreviewBackground(backgroundId) {
      const { config, audioCatalog, preview } = get();
      const audio = getAudioEngine();

      const id = backgroundId || config.backgroundId;
      const background = getBackgroundById(id, audioCatalog.backgrounds);

      audio.setBackgroundVolume(config.backgroundVolume);

      if (preview.kind === "background" && preview.id === id) {
        audio.stopPreview({ fadeOutSeconds: 0.35 });
        set({ preview: { kind: null, id: null } });
        return { ok: true };
      }

      const result = await audio.startPreview({
        src: background.src,
        kind: "background",
        loop: true,
        fadeInSeconds: 0.45,
        fadeOutSeconds: 0.35,
        loopStart: background.loopStart ?? null,
        loopEnd: background.loopEnd ?? null,
      });

      if (!result.ok) {
        set({ preview: { kind: null, id: null } });
        get().actions.showToast("Audio unavailable");
        return result;
      }

      set({ preview: { kind: "background", id } });
      return { ok: true };
    },

    async previewBell(bellId) {
      const { config, audioCatalog } = get();
      const audio = getAudioEngine();
      audio.setBellVolume(config.bellVolume);
      const bell = getBellById(bellId, audioCatalog.bells);
      const result = await audio.playPreview({ src: bell.src, kind: "bell" });
      if (!result.ok) get().actions.showToast("Audio unavailable");
    },

    validateConfig() {
      const { config } = get();
      const durationMinutes = Number(config.durationMinutes);
      if (!durationMinutes || durationMinutes <= 0) return { ok: false, message: "Duration must be at least 1 minute" };
      return { ok: true };
    },

    async beginSession() {
      const { config, audioCatalog } = get();
      const validation = get().actions.validateConfig();
      if (!validation.ok) {
        get().actions.showToast(validation.message);
        return { ok: false };
      }

      const audio = getAudioEngine();
      audio.stopPreview({ fadeOutSeconds: 0.15 });
      set({ preview: { kind: null, id: null } });
      audio.setBackgroundVolume(config.backgroundVolume);
      audio.setBellVolume(config.bellVolume);

      const background =
        config.backgroundId === "none" ? null : getBackgroundById(config.backgroundId, audioCatalog.backgrounds);
      const startBell = getBellById(config.startBellId, audioCatalog.bells);
      const endBell = getBellById(config.endBellId, audioCatalog.bells);

      const durationSeconds = minutesToSeconds(config.durationMinutes);
      const intervalSeconds = minutesToSeconds(config.intervalMinutes);

      // Warm up first (no audio). Audio + start bell begin when the session timer starts.
      const warmupSeconds = WARMUP_SECONDS;
      const startedAtMs = nowMs();

      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "running",
          mode: "warmup",
          warmupSeconds,
          durationSeconds,
          remainingSeconds: warmupSeconds,
          startedAtMs,
          pausedAtMs: 0,
          pausedTotalMs: 0,
          lastTickMs: startedAtMs,
          intervalSeconds,
          nextIntervalAtSeconds: intervalSeconds,
          completedNaturally: false,
        },
        _sessionAudio: {
          backgroundSrc: background?.src ?? null,
          backgroundLoopStart: background?.loopStart ?? null,
          backgroundLoopEnd: background?.loopEnd ?? null,
          startBellSrc: startBell.src,
          endBellSrc: endBell.src,
        },
      }));

      return { ok: true };
    },

    pause() {
      const { runtime } = get();
      if (runtime.status !== "running") return;

      const t = nowMs();
      if (runtime.mode === "session" && get()._sessionAudio?.backgroundSrc) getAudioEngine().pauseBackground();

      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "paused",
          pausedAtMs: t,
          lastTickMs: t,
        },
      }));
    },

    async resume() {
      const { runtime } = get();
      if (runtime.status !== "paused") return;

      const t = nowMs();
      const pausedDelta = runtime.pausedAtMs ? t - runtime.pausedAtMs : 0;

      if (runtime.mode === "session" && get()._sessionAudio?.backgroundSrc) {
        const result = await getAudioEngine().resumeBackground({ fadeInSeconds: 0.6 });
        if (!result.ok) get().actions.showToast("Audio unavailable");
      }

      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "running",
          pausedAtMs: 0,
          pausedTotalMs: s.runtime.pausedTotalMs + pausedDelta,
          lastTickMs: t,
        },
      }));
    },

    async endSession({ completedNaturally } = { completedNaturally: false }) {
      const { runtime } = get();
      if (runtime.status === "idle" || runtime.status === "complete") return;

      const audio = getAudioEngine();
      const endBellSrc = get()._sessionAudio?.endBellSrc;

      if (completedNaturally && endBellSrc) {
        const bellResult = await audio.playBell({ src: endBellSrc });
        if (!bellResult.ok) get().actions.showToast("Audio unavailable");
      }

      // No fade-out controls: stop background immediately.
      audio.stopAll();

      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "complete",
          remainingSeconds: 0,
          completedNaturally: Boolean(completedNaturally),
        },
      }));
    },

    restartSession() {
      const { config } = get();
      // Reset runtime, keep config.
      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "idle",
          mode: "session",
          warmupSeconds: WARMUP_SECONDS,
          durationSeconds: minutesToSeconds(config.durationMinutes),
          remainingSeconds: minutesToSeconds(config.durationMinutes),
          startedAtMs: 0,
          pausedAtMs: 0,
          pausedTotalMs: 0,
          lastTickMs: 0,
          intervalSeconds: minutesToSeconds(config.intervalMinutes),
          nextIntervalAtSeconds: minutesToSeconds(config.intervalMinutes),
          completedNaturally: false,
        },
      }));
      getAudioEngine().stopAll();
      set({ preview: { kind: null, id: null } });
    },

    async skipWarmup() {
      const { runtime, config } = get();
      if (runtime.status === "idle" || runtime.status === "complete") return { ok: false };
      if (runtime.mode !== "warmup") return { ok: true };

      const t = nowMs();
      const durationSeconds = runtime.durationSeconds;
      const intervalSeconds = minutesToSeconds(config.intervalMinutes);

      set((s) => ({
        runtime: {
          ...s.runtime,
          status: "running",
          mode: "session",
          startedAtMs: t,
          pausedAtMs: 0,
          pausedTotalMs: 0,
          lastTickMs: t,
          remainingSeconds: durationSeconds,
          intervalSeconds,
          nextIntervalAtSeconds: intervalSeconds,
        },
      }));

      const audio = getAudioEngine();
      audio.setBackgroundVolume(config.backgroundVolume);
      audio.setBellVolume(config.bellVolume);

      const sessionAudio = get()._sessionAudio;
      if (sessionAudio?.backgroundSrc) {
        audio
          .startBackground({
            src: sessionAudio.backgroundSrc,
            loop: true,
            fadeInSeconds: DEFAULTS.fadeInSeconds,
            loopStart: sessionAudio.backgroundLoopStart ?? null,
            loopEnd: sessionAudio.backgroundLoopEnd ?? null,
          })
          .then((r) => {
            if (!r.ok) get().actions.showToast("Audio unavailable");
          });
      }

      if (sessionAudio?.startBellSrc) {
        audio.playBell({ src: sessionAudio.startBellSrc }).then((r) => {
          if (!r.ok) get().actions.showToast("Audio unavailable");
        });
      }

      return { ok: true };
    },

    tick() {
      const { runtime, config, audioCatalog } = get();
      if (runtime.status !== "running") return;

      const t = nowMs();
      const elapsedSeconds = computeElapsedSeconds(runtime, t);
      const durationSeconds = runtime.durationSeconds;

      if (runtime.mode === "warmup") {
        const warmupTotal = Number(runtime.warmupSeconds) || WARMUP_SECONDS;
        const remainingSeconds = Math.max(0, warmupTotal - elapsedSeconds);

        if (remainingSeconds > 0.001) {
          set((s) => ({
            runtime: {
              ...s.runtime,
              lastTickMs: t,
              remainingSeconds,
            },
          }));
          return;
        }

        // Transition into the actual session.
        const intervalSeconds = minutesToSeconds(config.intervalMinutes);
        const startedAtMs = t;

        set((s) => ({
          runtime: {
            ...s.runtime,
            mode: "session",
            startedAtMs,
            pausedAtMs: 0,
            pausedTotalMs: 0,
            lastTickMs: startedAtMs,
            remainingSeconds: durationSeconds,
            intervalSeconds,
            nextIntervalAtSeconds: intervalSeconds,
          },
        }));

        const audio = getAudioEngine();
        audio.setBackgroundVolume(config.backgroundVolume);
        audio.setBellVolume(config.bellVolume);

        const sessionAudio = get()._sessionAudio;
        if (sessionAudio?.backgroundSrc) {
          audio
            .startBackground({
              src: sessionAudio.backgroundSrc,
              loop: true,
              fadeInSeconds: DEFAULTS.fadeInSeconds,
              loopStart: sessionAudio.backgroundLoopStart ?? null,
              loopEnd: sessionAudio.backgroundLoopEnd ?? null,
            })
            .then((r) => {
              if (!r.ok) get().actions.showToast("Audio unavailable");
            });
        }

        if (sessionAudio?.startBellSrc) {
          audio.playBell({ src: sessionAudio.startBellSrc }).then((r) => {
            if (!r.ok) get().actions.showToast("Audio unavailable");
          });
        }

        return;
      }

      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // Interval bells are based on elapsed time, not setInterval accumulation.
      let nextIntervalAtSeconds = runtime.nextIntervalAtSeconds;
      const intervalSeconds = runtime.intervalSeconds;

      const canInterval = shouldPlayIntervalBell({
        intervalEnabled: config.intervalEnabled,
        intervalSeconds,
        durationSeconds,
        nextIntervalAtSeconds,
      });

      if (canInterval) {
        const endGuard = durationSeconds - 0.25;

        while (nextIntervalAtSeconds <= elapsedSeconds && nextIntervalAtSeconds < endGuard) {
          // Never play at t=0.
          if (nextIntervalAtSeconds > 0.01) {
            const bell = getBellById(config.startBellId, audioCatalog.bells);
            getAudioEngine()
              .playBell({ src: bell.src })
              .then((r) => {
                if (!r.ok) get().actions.showToast("Audio unavailable");
              });
          }
          nextIntervalAtSeconds += intervalSeconds;
        }
      }

      set((s) => ({
        runtime: {
          ...s.runtime,
          lastTickMs: t,
          remainingSeconds,
          nextIntervalAtSeconds,
        },
      }));

      if (remainingSeconds <= 0.001) {
        get().actions.endSession({ completedNaturally: true });
      }
    },
  },
}));
