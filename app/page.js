"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  Timer,
  CloudRain,
  Bell,
  Repeat,
  Volume2,
  Check,
} from "lucide-react";

import SoundGrid from "../components/SoundGrid";
import DurationPicker from "../components/DurationPicker";
import BellPicker from "../components/BellPicker";
import IntervalControls from "../components/IntervalControls";
import VolumeControls from "../components/VolumeControls";
import PrimaryButton from "../components/PrimaryButton";
import Toast from "../components/Toast";
import ThemeLogo from "../components/ThemeLogo";
import { useLuucidStore } from "../store/useLuucidStore";

export default function Home() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [contentCanScroll, setContentCanScroll] = useState(false);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  const topChromeRef = useRef(null);
  const footerRef = useRef(null);
  const [topChromeH, setTopChromeH] = useState(0);
  const [footerH, setFooterH] = useState(0);
  const FADE_OVERLAP_PX = 16;

  const shellRef = useRef(null);

  const contentShellRef = useRef(null);
  const measureRefs = useRef({});
  const [measureWidth, setMeasureWidth] = useState(0);
  const [contentMinHeight, setContentMinHeight] = useState(0);

  const config = useLuucidStore((s) => s.config);
  const audioCatalog = useLuucidStore((s) => s.audioCatalog);
  const preview = useLuucidStore((s) => s.preview);
  const toast = useLuucidStore((s) => s.toast);
  const actions = useLuucidStore((s) => s.actions);
  const shellMinHeight = useLuucidStore((s) => s.ui?.shellMinHeight || 0);

  async function onBegin() {
    const result = await actions.beginSession();
    if (result.ok) router.push("/session");
  }

  const steps = useMemo(
    () => [
      { key: "duration", title: "Time", Icon: Timer },
      { key: "sound", title: "Sound", Icon: CloudRain },
      { key: "startBell", title: "Start bell", Icon: Bell },
      { key: "endBell", title: "End bell", Icon: Bell },
      { key: "intervals", title: "Intervals", Icon: Repeat },
      { key: "volume", title: "Volume", Icon: Volume2 },
      { key: "ready", title: "Ready", Icon: Check },
    ],
    [],
  );

  const step = steps[stepIndex];
  const StepIcon = step.Icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const shouldCenterStep = step.key === "duration" || step.key === "intervals" || step.key === "volume" || step.key === "ready";

  function renderStepBody(key) {
    if (key === "duration") {
      return (
        <div className="mx-auto w-full max-w-sm">
          <DurationPicker valueMinutes={config.durationMinutes} onChange={actions.setDurationMinutes} mode="minimal" />
        </div>
      );
    }

    if (key === "sound") {
      return (
        <div className="mx-auto w-full max-w-3xl">
          <SoundGrid
            selectedId={config.backgroundId}
            onSelect={actions.setBackground}
            onPreview={actions.togglePreviewBackground}
            backgrounds={audioCatalog.backgrounds}
            previewingId={preview.kind === "background" ? preview.id : null}
          />
        </div>
      );
    }

    if (key === "startBell") {
      return (
        <div className="mx-auto w-full max-w-3xl">
          <BellPicker
            label="Start bell"
            valueId={config.startBellId}
            onChange={actions.setStartBell}
            onPreview={actions.previewBell}
            bells={audioCatalog.bells}
          />
        </div>
      );
    }

    if (key === "endBell") {
      return (
        <div className="mx-auto w-full max-w-3xl">
          <BellPicker
            label="End bell"
            valueId={config.endBellId}
            onChange={actions.setEndBell}
            onPreview={actions.previewBell}
            bells={audioCatalog.bells}
          />
        </div>
      );
    }

    if (key === "intervals") {
      return (
        <IntervalControls
          enabled={config.intervalEnabled}
          intervalMinutes={config.intervalMinutes}
          onToggle={actions.setIntervalEnabled}
          onChangeInterval={actions.setIntervalMinutes}
        />
      );
    }

    if (key === "volume") {
      return (
        <VolumeControls
          backgroundVolume={config.backgroundVolume}
          bellVolume={config.bellVolume}
          onChangeBackground={actions.setBackgroundVolume}
          onChangeBell={actions.setBellVolume}
          previewBackground={(() => {
            const bg = audioCatalog.backgrounds.find((b) => b.id === config.backgroundId);
            if (!bg?.src) return { kind: "background", src: null };
            return {
              kind: "background",
              src: bg.src,
              loopStart: bg.loopStart ?? null,
              loopEnd: bg.loopEnd ?? null,
            };
          })()}
          previewBell={(() => {
            const bell = audioCatalog.bells.find((b) => b.id === config.startBellId);
            return {
              kind: "bell",
              src: bell?.src ?? null,
            };
          })()}
        />
      );
    }

    if (key === "ready") {
      return (
        <div className="mx-auto w-full max-w-xl space-y-3">
          <div className="rounded-2xl bg-(--luucid-surface-soft) p-4 shadow-sm ring-1 ring-(--luucid-border)">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-(--luucid-muted)">Duration</dt>
                <dd className="font-medium text-(--luucid-text)">{config.durationMinutes} min</dd>
              </div>
              <div>
                <dt className="text-(--luucid-muted)">Background</dt>
                <dd className="font-medium text-(--luucid-text)">
                  {audioCatalog.backgrounds.find((b) => b.id === config.backgroundId)?.label || config.backgroundId}
                </dd>
              </div>
              <div>
                <dt className="text-(--luucid-muted)">Start bell</dt>
                <dd className="font-medium text-(--luucid-text)">
                  {audioCatalog.bells.find((b) => b.id === config.startBellId)?.label || config.startBellId}
                </dd>
              </div>
              <div>
                <dt className="text-(--luucid-muted)">End bell</dt>
                <dd className="font-medium text-(--luucid-text)">
                  {audioCatalog.bells.find((b) => b.id === config.endBellId)?.label || config.endBellId}
                </dd>
              </div>
              <div>
                <dt className="text-(--luucid-muted)">Intervals</dt>
                <dd className="font-medium text-(--luucid-text)">
                  {config.intervalEnabled ? `Every ${config.intervalMinutes} min` : "Off"}
                </dd>
              </div>
              <div>
                <dt className="text-(--luucid-muted)">Volume</dt>
                <dd className="font-medium text-(--luucid-text)">
                  Background {Math.round(config.backgroundVolume * 100)}%, Bells {Math.round(config.bellVolume * 100)}%
                </dd>
              </div>
            </dl>
          </div>
        </div>
      );
    }

    return null;
  }

  useLayoutEffect(() => {
    function updateWidth() {
      const w = contentShellRef.current?.getBoundingClientRect?.().width || 0;
      setMeasureWidth(w);
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(min-width: 640px)");
    const onChange = () => setIsDesktop(Boolean(mql.matches));
    onChange();

    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  useLayoutEffect(() => {
    if (!measureWidth || !isDesktop) {
      // Mobile: don't reserve tallest-step height; it creates extra scrollable space.
      if (!isDesktop && contentMinHeight) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContentMinHeight(0);
      }
      return;
    }

    // Measure all step heights at the current width and reserve the tallest.
    let maxH = 0;
    for (const s of steps) {
      const el = measureRefs.current[s.key];
      if (!el) continue;
      const h = el.getBoundingClientRect?.().height || el.offsetHeight || 0;
      if (h > maxH) maxH = h;
    }

    if (maxH > 0) setContentMinHeight(Math.ceil(maxH));
  }, [measureWidth, isDesktop, contentMinHeight, steps, audioCatalog.backgrounds?.length, audioCatalog.bells?.length, config.intervalEnabled]);

  useLayoutEffect(() => {
    const el = contentShellRef.current;
    if (!el) return;

    // Only allow scrolling when content actually overflows.
    const next = el.scrollHeight - el.clientHeight > 1;
    if (next !== contentCanScroll) setContentCanScroll(next);
  }, [contentCanScroll, step.key, measureWidth, isDesktop, contentMinHeight, audioCatalog.backgrounds?.length, audioCatalog.bells?.length, config.intervalEnabled]);

  useLayoutEffect(() => {
    const el = contentShellRef.current;
    if (!el || isDesktop || !contentCanScroll) {
      if (fadeTop) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFadeTop(false);
      }
      if (fadeBottom) {
        setFadeBottom(false);
      }
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollTop = el.scrollTop || 0;
      const clientH = el.clientHeight || 0;
      const scrollH = el.scrollHeight || 0;

      const nextTop = scrollTop > 1;
      const nextBottom = scrollTop + clientH < scrollH - 1;
      if (nextTop !== fadeTop) setFadeTop(nextTop);
      if (nextBottom !== fadeBottom) setFadeBottom(nextBottom);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contentCanScroll, fadeTop, fadeBottom, isDesktop, step.key]);

  useLayoutEffect(() => {
    const topChrome = topChromeRef.current;
    const footer = footerRef.current;
    if (!topChrome || !footer) return;

    const update = () => {
      const nextTopH = Math.max(0, Math.round(topChrome.getBoundingClientRect().height || 0));
      const nextFooterH = Math.max(0, Math.round(footer.getBoundingClientRect().height || 0));

      setTopChromeH((prev) => (prev === nextTopH ? prev : nextTopH));
      setFooterH((prev) => (prev === nextFooterH ? prev : nextFooterH));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step.key, measureWidth]);

  useLayoutEffect(() => {
    if (!contentMinHeight) return;
    const h = shellRef.current?.getBoundingClientRect?.().height || 0;
    if (h > 0) actions.setShellMinHeight(h);
  }, [actions, contentMinHeight]);

  useEffect(() => {
    if (step.key !== "sound") actions.stopPreview();
  }, [actions, step.key]);

  useEffect(() => {
    if (step.key === "sound") actions.preloadCatalog({ backgrounds: true });
    if (step.key === "startBell" || step.key === "endBell" || step.key === "intervals" || step.key === "ready") {
      actions.preloadCatalog({ bells: true });
    }
  }, [actions, step.key]);

  function goNext() {
    const validation = actions.validateConfig();
    if (!validation.ok) {
      actions.showToast(validation.message);
      return;
    }
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div className="min-h-dvh overflow-hidden p-0 sm:p-10 flex sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div
          ref={shellRef}
          style={shellMinHeight ? { "--luucid-shell-min-h": `${shellMinHeight}px` } : undefined}
          className="relative w-full flex flex-col h-dvh sm:h-auto max-h-none sm:max-h-[calc(100dvh-4rem)] sm:min-h-(--luucid-shell-min-h)"
        >
          <div ref={topChromeRef} className="absolute inset-x-0 top-0 z-30 sm:static">
            <div className="px-6 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-8 sm:py-6 flex items-center justify-center">
              <ThemeLogo alt="Luucid" width={120} height={28} priority className="h-7 w-auto" />
            </div>

            <div className="px-6 pt-3 pb-6 sm:px-8 sm:pt-2 flex flex-col items-center justify-center gap-2">
              <StepIcon className="h-9 w-9 text-(--luucid-text)" aria-hidden="true" />
              <div className="text-xs font-medium tracking-wide text-(--luucid-muted)">{step.title}</div>
            </div>
          </div>

          <div
            ref={contentShellRef}
            style={!isDesktop ? { paddingTop: topChromeH, paddingBottom: footerH } : undefined}
            className={`absolute inset-0 z-0 px-6 overflow-x-hidden luucid-scroll-gutter sm:static sm:flex-1 sm:min-h-0 sm:px-8 sm:pt-2 sm:pb-8 sm:flex sm:flex-col ${
              contentCanScroll ? "overflow-y-auto" : "overflow-y-hidden"
            } sm:overflow-y-auto`}
          >
            <div className="w-full flex-1 min-h-0 flex justify-center pt-2 pb-4 sm:pt-0 sm:pb-0">
              <div
                style={isDesktop && contentMinHeight ? { minHeight: contentMinHeight } : undefined}
                className={`w-full flex flex-col items-center ${shouldCenterStep ? "justify-center" : "justify-start"}`}
              >
                <div key={step.key} className="w-full animate-[luucidStepIn_220ms_ease-out]">
                  {renderStepBody(step.key)}
                </div>
              </div>
            </div>

            {measureWidth ? (
              <div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 opacity-0"
                style={{ width: measureWidth, left: 0 }}
              >
                {steps.map((s) => {
                  return (
                    <div
                      key={s.key}
                      ref={(el) => {
                        if (el) measureRefs.current[s.key] = el;
                      }}
                      className="w-full"
                    >
                      {renderStepBody(s.key)}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div
            ref={footerRef}
            className="absolute inset-x-0 bottom-0 z-30 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:static sm:px-8 sm:pb-6 flex items-center justify-center"
          >
            <div className="w-full max-w-sm flex items-center gap-3">
              {!isFirst ? (
                <PrimaryButton type="button" variant="secondary" className="w-1/3" onClick={goBack}>
                  Back
                </PrimaryButton>
              ) : null}

              {isLast ? (
                <PrimaryButton type="button" className={isFirst ? "w-full" : "flex-1"} onClick={onBegin}>
                  Begin
                </PrimaryButton>
              ) : (
                <PrimaryButton type="button" className={isFirst ? "w-full" : "flex-1"} onClick={goNext}>
                  Next
                </PrimaryButton>
              )}
            </div>
          </div>

          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 luucid-fade-top sm:hidden z-10 ${
              fadeTop ? "" : "hidden"
            }`}
            style={{ height: topChromeH ? topChromeH + FADE_OVERLAP_PX : undefined }}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 luucid-fade-bottom sm:hidden z-10 ${
              fadeBottom ? "" : "hidden"
            }`}
            style={{ height: footerH ? footerH + FADE_OVERLAP_PX : undefined }}
          />
        </div>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={actions.dismissToast} />
    </div>
  );
}
