"use client";

import { useMemo, useRef, useState } from "react";

import { getAudioEngine } from "../lib/audioEngine";

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function supportsVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function maybeVibrate(ms) {
  if (!supportsVibrate()) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // ignore
  }
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const delta = Math.abs(endAngle - startAngle);
  const largeArcFlag = delta > 180 ? 1 : 0;
  // Sweep clockwise (increasing angle).
  const sweepFlag = 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function KnobRow({
  label,
  value,
  onChange,
  preview,
}) {
  const percent = Math.round(clamp01(Number(value)) * 100);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const lastHapticAtRef = useRef(0);
  const lastHapticPercentRef = useRef(percent);

  const angle = useMemo(() => {
    // Map 0..1 to a friendly knob sweep.
    const minDeg = -135;
    const maxDeg = 135;
    return minDeg + clamp01(Number(value)) * (maxDeg - minDeg);
  }, [value]);

  const arc = useMemo(() => {
    const minDeg = -135;
    const maxDeg = 135;
    const endDeg = minDeg + clamp01(Number(value)) * (maxDeg - minDeg);

    const cx = 50;
    const cy = 50;
    const r = 42;

    const trackPath = describeArc(cx, cy, r, minDeg, maxDeg);
    const valuePath = describeArc(cx, cy, r, minDeg, endDeg);
    const startPt = polarToCartesian(cx, cy, r, minDeg);
    const endPt = polarToCartesian(cx, cy, r, maxDeg);

    return {
      trackPath,
      valuePath,
      startPt,
      endPt,
    };
  }, [value]);

  function setPreviewVolume(v) {
    if (!preview?.kind) return;
    getAudioEngine().setPreviewVolume({ kind: preview.kind, volume: v });
  }

  async function startPreview() {
    if (!preview?.src) return;

    const audio = getAudioEngine();
    if (preview.kind === "background") audio.setBackgroundVolume(value);
    if (preview.kind === "bell") audio.setBellVolume(value);

    await audio.startPreview({
      src: preview.src,
      kind: preview.kind,
      loop: true,
      fadeInSeconds: 0.08,
      fadeOutSeconds: 0.12,
      loopStart: preview.loopStart ?? null,
      loopEnd: preview.loopEnd ?? null,
    });
  }

  function stopPreview() {
    getAudioEngine().stopPreview({ fadeOutSeconds: 0.12 });
  }

  function applyNextValue(nextValue, { withPreview = false } = {}) {
    const v = clamp01(nextValue);
    onChange(v);

    if (withPreview && draggingRef.current) setPreviewVolume(v);

    const nextPercent = Math.round(v * 100);
    if (nextPercent !== lastHapticPercentRef.current) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      // Throttle haptics; only on meaningful % changes.
      if (now - lastHapticAtRef.current > 55) {
        maybeVibrate(6);
        lastHapticAtRef.current = now;
      }
      lastHapticPercentRef.current = nextPercent;
    }
  }

  return (
    <div className="py-2">
      <div className="text-sm font-medium text-(--luucid-text) text-center">{label}</div>

      <div className="mt-3 flex items-center justify-center">
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}%`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.05 : 0.02;
            if (e.key === "ArrowUp" || e.key === "ArrowRight") {
              e.preventDefault();
              applyNextValue(Number(value) + step);
            } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
              e.preventDefault();
              applyNextValue(Number(value) - step);
            } else if (e.key === "PageUp") {
              e.preventDefault();
              applyNextValue(Number(value) + 0.1);
            } else if (e.key === "PageDown") {
              e.preventDefault();
              applyNextValue(Number(value) - 0.1);
            } else if (e.key === "Home") {
              e.preventDefault();
              applyNextValue(0);
            } else if (e.key === "End") {
              e.preventDefault();
              applyNextValue(1);
            }
          }}
          onPointerDown={(e) => {
            draggingRef.current = true;
            setIsDragging(true);
            startYRef.current = e.clientY;
            startValueRef.current = clamp01(Number(value));

            try {
              e.currentTarget.setPointerCapture?.(e.pointerId);
            } catch {
              // ignore
            }

            startPreview();
            setPreviewVolume(value);
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current) return;
            // Drag up = louder, down = quieter. Roughly ~220px for full range.
            const dy = startYRef.current - e.clientY;
            const sensitivity = 1 / 220;
            const next = startValueRef.current + dy * sensitivity;
            applyNextValue(next, { withPreview: true });
          }}
          onPointerUp={() => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            setIsDragging(false);
            stopPreview();
          }}
          onPointerCancel={() => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            setIsDragging(false);
            stopPreview();
          }}
          onLostPointerCapture={() => {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            setIsDragging(false);
            stopPreview();
          }}
          className={`relative h-24 w-24 select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
            isDragging ? "" : ""
          }`}
          style={{ touchAction: "none" }}
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0"
            aria-hidden="true"
          >
            <path
              d={arc.trackPath}
              className="text-(--luucid-muted)"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d={arc.valuePath}
              className="text-(--luucid-text)"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>

          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="absolute left-1/2 top-3 h-5 w-0.75 -translate-x-1/2 rounded-full bg-(--luucid-text) opacity-90" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="text-xs font-semibold tabular-nums text-(--luucid-text)">{percent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VolumeControls({
  backgroundVolume,
  bellVolume,
  onChangeBackground,
  onChangeBell,
  previewBackground,
  previewBell,
}) {
  return (
    <div className="mx-auto w-full max-w-xl sm:max-w-3xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <KnobRow
          label="Background"
          value={backgroundVolume}
          onChange={onChangeBackground}
          preview={previewBackground}
        />
        <KnobRow
          label="Bell"
          value={bellVolume}
          onChange={onChangeBell}
          preview={previewBell}
        />
      </div>
    </div>
  );
}
