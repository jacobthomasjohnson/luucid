"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import TimerDisplay from "../../components/TimerDisplay";
import PrimaryButton from "../../components/PrimaryButton";
import Toast from "../../components/Toast";

import { useLucentStore } from "../../store/useLucentStore";
import { getBackgroundById } from "../../lib/constants";

function Body({ bgLabel, intervalText, runtime }) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-10">
      <div className="text-center space-y-2">
        <div className="text-sm font-medium text-zinc-700">Session</div>
        <div className="text-xs text-zinc-500">
          {bgLabel} · {intervalText}
        </div>
      </div>

      <TimerDisplay
        remainingSeconds={runtime.remainingSeconds}
        caption={runtime.mode === "warmup" ? "Warm up" : "Remaining"}
      />

      {runtime.status === "complete" ? (
        <div className="text-center">
          <div className="text-sm font-medium text-zinc-900">Session complete</div>
          <div className="mt-1 text-sm text-zinc-500">Take a moment to notice how you feel.</div>
        </div>
      ) : null}
    </div>
  );
}

export default function SessionPage() {
  const router = useRouter();

  const config = useLucentStore((s) => s.config);
  const audioCatalog = useLucentStore((s) => s.audioCatalog);
  const runtime = useLucentStore((s) => s.runtime);
  const toast = useLucentStore((s) => s.toast);
  const actions = useLucentStore((s) => s.actions);

  const rafRef = useRef(0);
  const intervalRef = useRef(0);

  const contentShellRef = useRef(null);
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

  useLayoutEffect(() => {
    function updateWidth() {
      const w = contentShellRef.current?.getBoundingClientRect?.().width || 0;
      setMeasureWidth(w);
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useLayoutEffect(() => {
    if (!measureWidth) return;
    const activeEl = measureRefs.current.active;
    const completeEl = measureRefs.current.complete;
    const h1 = activeEl?.getBoundingClientRect?.().height || activeEl?.offsetHeight || 0;
    const h2 = completeEl?.getBoundingClientRect?.().height || completeEl?.offsetHeight || 0;
    const maxH = Math.max(h1, h2);
    if (maxH > 0) setContentMinHeight(Math.ceil(maxH));
  }, [measureWidth, bgLabel, intervalText]);

  const viewKey = runtime.status === "complete" ? "complete" : "active";

  return (
    <div className="min-h-dvh overflow-hidden bg-linear-to-b from-zinc-50 to-white p-6 sm:p-10 flex items-center justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col">
          <div className="px-6 py-6 sm:px-8 flex items-center justify-center">
            <Image src="/logo.svg" alt="Lucent" width={120} height={28} priority className="h-7 w-auto" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div ref={contentShellRef} className="w-full flex items-center justify-center">
              <div
                style={contentMinHeight ? { minHeight: contentMinHeight } : undefined}
                className="w-full flex items-center justify-center"
              >
                <div
                  key={viewKey}
                  className="w-full flex items-center justify-center animate-[lucentStepIn_220ms_ease-out]"
                >
                  <Body bgLabel={bgLabel} intervalText={intervalText} runtime={runtime} />
                </div>
              </div>
            </div>

            {measureWidth ? (
              <div
                aria-hidden="true"
                className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
                style={{ width: measureWidth }}
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

          <div className="px-6 pb-6 sm:px-8 flex items-center justify-center">
            <div className="w-full max-w-sm flex items-center gap-3">
              {runtime.status === "complete" ? (
                <>
                  <PrimaryButton type="button" className="flex-1" onClick={onRestart}>
                    Restart
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      actions.resetAll();
                      router.replace("/");
                    }}
                  >
                    Exit
                  </PrimaryButton>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={actions.dismissToast} />
    </div>
  );
}
