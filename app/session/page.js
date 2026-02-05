"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import TimerDisplay from "../../components/TimerDisplay";
import PrimaryButton from "../../components/PrimaryButton";
import Toast from "../../components/Toast";
import ThemeLogo from "../../components/ThemeLogo";

import { useLuucidStore } from "../../store/useLuucidStore";
import { getBackgroundById } from "../../lib/constants";

function Body({ bgLabel, intervalText, runtime }) {
  const isComplete = runtime.status === "complete";

  return (
    <div className="w-full flex flex-col items-center justify-center gap-10">
      {!isComplete ? (
        <div className="text-center space-y-2">
          <div className="text-xs font-medium tracking-wide text-(--luucid-muted)">Session</div>
        </div>
      ) : null}

      {!isComplete ? (
        <TimerDisplay
          remainingSeconds={runtime.remainingSeconds}
          caption={runtime.mode === "warmup" ? "Warm up" : "Remaining"}
        />
      ) : (
        <div className="text-center">
          <div className="text-xl font-semibold text-(--luucid-text)">Session complete</div>
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  const router = useRouter();

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

  const config = useLuucidStore((s) => s.config);
  const audioCatalog = useLuucidStore((s) => s.audioCatalog);
  const runtime = useLuucidStore((s) => s.runtime);
  const toast = useLuucidStore((s) => s.toast);
  const actions = useLuucidStore((s) => s.actions);
  const shellMinHeight = useLuucidStore((s) => s.ui?.shellMinHeight || 0);

  const rafRef = useRef(0);
  const intervalRef = useRef(0);

  const contentShellRef = useRef(null);
  const scrollRef = useRef(null);
  const measureRefs = useRef({});
  const [measureWidth, setMeasureWidth] = useState(0);
  const [contentMinHeight, setContentMinHeight] = useState(0);

  const bg = useMemo(() => {
    if (config.backgroundId === "none") return { id: "none", label: "None" };
    return getBackgroundById(config.backgroundId, audioCatalog.backgrounds);
  }, [config.backgroundId, audioCatalog.backgrounds]);

  // Guard against refresh or direct navigation.
  useEffect(() => {
    const valid = actions.validateConfig();
    if (!valid.ok || runtime.status === "idle") {
      router.replace("/");
    }
  }, [actions, router, runtime.status]);

  // Drift-free ticking driven by a lightweight interval.
  useEffect(() => {
    if (runtime.status !== "running") return;

    function tick() {
      actions.tick();
      rafRef.current = window.requestAnimationFrame(() => {});
    }

    tick();
    intervalRef.current = window.setInterval(tick, 250);

    return () => {
      window.clearInterval(intervalRef.current);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [runtime.status, actions]);

  useEffect(() => {
    return () => {
      window.clearInterval(intervalRef.current);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function onRestart() {
    actions.restartSession();
    const result = await actions.beginSession();
    if (!result.ok) router.replace("/");
  }

  function intervalLabel() {
    if (!config.intervalEnabled) return "Intervals off";
    return `Every ${config.intervalMinutes} min`;
  }

  const intervalText = intervalLabel();
  const bgLabel = bg.label;

  const showSkipWarmup = runtime.status !== "idle" && runtime.status !== "complete" && runtime.mode === "warmup";
  const viewKey = runtime.status === "complete" ? "complete" : "active";

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!isDesktop && contentMinHeight) setContentMinHeight(0);
      return;
    }
    const activeEl = measureRefs.current.active;
    const completeEl = measureRefs.current.complete;
    const h1 = activeEl?.getBoundingClientRect?.().height || activeEl?.offsetHeight || 0;
    const h2 = completeEl?.getBoundingClientRect?.().height || completeEl?.offsetHeight || 0;
    const maxH = Math.max(h1, h2);
    if (maxH > 0) setContentMinHeight(Math.ceil(maxH));
  }, [measureWidth, isDesktop, contentMinHeight, bgLabel, intervalText]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const next = el.scrollHeight - el.clientHeight > 1;
    if (next !== contentCanScroll) setContentCanScroll(next);
  }, [contentCanScroll, viewKey, measureWidth, isDesktop, contentMinHeight]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || isDesktop || !contentCanScroll) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (fadeTop) setFadeTop(false);
      if (fadeBottom) setFadeBottom(false);
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
  }, [contentCanScroll, fadeTop, fadeBottom, isDesktop, viewKey]);

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
  }, [viewKey, measureWidth]);

  useLayoutEffect(() => {
    if (!contentMinHeight) return;
    const h = shellRef.current?.getBoundingClientRect?.().height || 0;
    if (h > 0) actions.setShellMinHeight(h);
  }, [actions, contentMinHeight, viewKey]);

  return (
    <div className="min-h-dvh overflow-hidden p-0 sm:p-10 flex sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div
          ref={shellRef}
          style={shellMinHeight ? { "--luucid-shell-min-h": `${shellMinHeight}px` } : undefined}
          className="relative w-full flex flex-col h-dvh sm:h-auto max-h-none sm:max-h-[calc(100dvh-4rem)] sm:min-h-(--luucid-shell-min-h)"
        >
          <div
            ref={topChromeRef}
            className="absolute inset-x-0 top-0 z-30 px-6 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:static sm:px-8 sm:py-6 flex items-center justify-center"
          >
            <ThemeLogo alt="Luucid" width={120} height={28} priority className="h-7 w-auto" />
          </div>

          <div
            ref={scrollRef}
            style={!isDesktop ? { paddingTop: topChromeH, paddingBottom: footerH } : undefined}
            className={`absolute inset-0 z-0 px-6 overflow-x-hidden luucid-scroll-gutter sm:static sm:flex-1 sm:min-h-0 sm:px-8 sm:py-8 sm:flex sm:flex-col ${
              contentCanScroll ? "overflow-y-auto" : "overflow-y-hidden"
            } sm:overflow-y-auto`}
          >
            <div className="w-full flex-1 min-h-0 flex items-center justify-center py-4 sm:py-0">
              <div ref={contentShellRef} className="w-full flex items-center justify-center">
                <div
                  style={isDesktop && contentMinHeight ? { minHeight: contentMinHeight } : undefined}
                  className="w-full flex items-center justify-center"
                >
                  <div
                    key={viewKey}
                    className="w-full flex items-center justify-center animate-[luucidStepIn_220ms_ease-out]"
                  >
                    <Body bgLabel={bgLabel} intervalText={intervalText} runtime={runtime} />
                  </div>
                </div>
              </div>
            </div>

            {measureWidth ? (
              <div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 opacity-0"
                style={{ width: measureWidth, left: 0 }}
              >
                <div
                  ref={(el) => {
                    if (el) measureRefs.current.active = el;
                  }}
                >
                  <Body
                    bgLabel={bgLabel}
                    intervalText={intervalText}
                    runtime={{ ...runtime, status: "running" }}
                  />
                </div>
                <div
                  ref={(el) => {
                    if (el) measureRefs.current.complete = el;
                  }}
                >
                  <Body
                    bgLabel={bgLabel}
                    intervalText={intervalText}
                    runtime={{ ...runtime, status: "complete" }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div
            ref={footerRef}
            className="absolute inset-x-0 bottom-0 z-30 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:static sm:px-8 sm:pb-6 flex items-center justify-center"
          >
            <div className="w-full max-w-sm">
              {runtime.status === "complete" ? (
                <PrimaryButton
                  type="button"
                  className="w-full"
                  onClick={() => {
                    actions.resetAll();
                    router.replace("/");
                  }}
                >
                  Exit
                </PrimaryButton>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {runtime.status === "paused" ? (
                      <PrimaryButton type="button" variant="white" className="flex-1" onClick={() => actions.resume()}>
                        Play
                      </PrimaryButton>
                    ) : (
                      <PrimaryButton type="button" variant="white" className="flex-1" onClick={() => actions.pause()}>
                        Pause
                      </PrimaryButton>
                    )}
                    <PrimaryButton
                      type="button"
                      variant="danger"
                      className="flex-1"
                      onClick={() => actions.endSession({ completedNaturally: false })}
                    >
                      End session
                    </PrimaryButton>
                  </div>

                  {showSkipWarmup ? (
                    <PrimaryButton type="button" variant="secondary" className="w-full" onClick={() => actions.skipWarmup()}>
                      Skip warm up
                    </PrimaryButton>
                  ) : null}
                </div>
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
