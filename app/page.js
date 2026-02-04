"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

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
import { useLucentStore } from "../store/useLucentStore";

export default function Home() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);

  const contentShellRef = useRef(null);
  const measureRefs = useRef({});
  const [measureWidth, setMeasureWidth] = useState(0);
  const [contentMinHeight, setContentMinHeight] = useState(0);

  const config = useLucentStore((s) => s.config);
  const audioCatalog = useLucentStore((s) => s.audioCatalog);
  const preview = useLucentStore((s) => s.preview);
  const toast = useLucentStore((s) => s.toast);
  const actions = useLucentStore((s) => s.actions);

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

  function renderStepBody(key) {
    if (key === "duration") {
      return (
        <div className="w-full max-w-sm">
          <DurationPicker valueMinutes={config.durationMinutes} onChange={actions.setDurationMinutes} mode="minimal" />
        </div>
      );
    }

    if (key === "sound") {
      return (
        <div className="w-full max-w-3xl">
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
        <div className="w-full max-w-3xl">
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
        <div className="w-full max-w-3xl">
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
        <div className="w-full max-w-xl rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-zinc-100">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Duration</dt>
              <dd className="font-medium text-zinc-900">{config.durationMinutes} min</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Background</dt>
              <dd className="font-medium text-zinc-900">
                {audioCatalog.backgrounds.find((b) => b.id === config.backgroundId)?.label || config.backgroundId}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Start bell</dt>
              <dd className="font-medium text-zinc-900">
                {audioCatalog.bells.find((b) => b.id === config.startBellId)?.label || config.startBellId}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">End bell</dt>
              <dd className="font-medium text-zinc-900">
                {audioCatalog.bells.find((b) => b.id === config.endBellId)?.label || config.endBellId}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Intervals</dt>
              <dd className="font-medium text-zinc-900">
                {config.intervalEnabled ? `Every ${config.intervalMinutes} min` : "Off"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Volume</dt>
              <dd className="font-medium text-zinc-900">
                Background {Math.round(config.backgroundVolume * 100)}%, Bells {Math.round(config.bellVolume * 100)}%
              </dd>
            </div>
          </dl>
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

  useLayoutEffect(() => {
    if (!measureWidth) return;

    // Measure all step heights at the current width and reserve the tallest.
    let maxH = 0;
    for (const s of steps) {
      const el = measureRefs.current[s.key];
      if (!el) continue;
      const h = el.getBoundingClientRect?.().height || el.offsetHeight || 0;
      if (h > maxH) maxH = h;
    }

    if (maxH > 0) setContentMinHeight(Math.ceil(maxH));
  }, [measureWidth, steps, audioCatalog.backgrounds?.length, audioCatalog.bells?.length, config.intervalEnabled]);

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
    <div className="min-h-dvh overflow-hidden bg-linear-to-b from-zinc-50 to-white p-6 sm:p-10 flex items-center justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col">
          <div className="px-6 py-6 sm:px-8 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Lucent"
              width={120}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
            <div ref={contentShellRef} className="w-full flex items-center justify-center">
              <div
                style={contentMinHeight ? { minHeight: contentMinHeight } : undefined}
                className="w-full flex items-center justify-center"
              >
                <div
                  key={step.key}
                  className="w-full flex flex-col items-center justify-center gap-10 animate-[lucentStepIn_220ms_ease-out]"
                >
                  <div className="flex items-center justify-center" aria-hidden="true">
                    <StepIcon className="h-10 w-10 text-zinc-900" />
                  </div>
                  {renderStepBody(step.key)}
                </div>
              </div>
            </div>

            {measureWidth ? (
              <div
                aria-hidden="true"
                className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
                style={{ width: measureWidth }}
              >
                {steps.map((s) => {
                  const Icon = s.Icon;
                  return (
                    <div
                      key={s.key}
                      ref={(el) => {
                        if (el) measureRefs.current[s.key] = el;
                      }}
                      className="w-full flex flex-col items-center justify-center gap-10"
                    >
                      <div className="flex items-center justify-center" aria-hidden="true">
                        <Icon className="h-10 w-10 text-zinc-900" />
                      </div>
                      {renderStepBody(s.key)}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="px-6 pb-6 sm:px-8 flex items-center justify-center">
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
        </div>
      </div>

      <Toast open={toast.open} message={toast.message} onClose={actions.dismissToast} />
    </div>
  );
}
