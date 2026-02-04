"use client";

import { useRef } from "react";

import { getAudioEngine } from "../lib/audioEngine";

function SliderRow({
  label,
  value,
  onChange,
  helpText,
  preview,
}) {
  const percent = Math.round(Number(value) * 100);
  const draggingRef = useRef(false);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-(--luucid-text)">{label}</div>
          <div className="text-xs text-(--luucid-muted)">{helpText}</div>
        </div>
        <div className="text-sm font-medium tabular-nums text-(--luucid-text)" aria-label={`${label} ${percent} percent`}>
          {percent}%
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(v);
          if (draggingRef.current) setPreviewVolume(v);
        }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
          } catch {
            // ignore
          }
          startPreview();
          setPreviewVolume(value);
        }}
        onPointerUp={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          stopPreview();
        }}
        onPointerCancel={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          stopPreview();
        }}
        onLostPointerCapture={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          stopPreview();
        }}
        className="w-full accent-sky-500"
      />
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
    <div className="mx-auto w-full max-w-xl space-y-8">
      <SliderRow
        label="Background volume"
        value={backgroundVolume}
        onChange={onChangeBackground}
        helpText="Affects the looping sound"
        preview={previewBackground}
      />
      <SliderRow
        label="Bell volume"
        value={bellVolume}
        onChange={onChangeBell}
        helpText="Affects start, interval, and end bells"
        preview={previewBell}
      />
    </div>
  );
}
