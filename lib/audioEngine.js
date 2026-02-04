let singleton;

function createEngine() {
  let audioContext = null;

  let masterBgGain = null;
  let masterBellGain = null;

  let bgBufferCache = new Map();
  let bellBufferCache = new Map();

  let bgSource = null;
  let bgBuffer = null;
  let bgLoop = true;
  let bgStartedAt = 0;
  let bgOffset = 0;

  let preview = null;

  const state = {
    backgroundVolume: 0.6,
    bellVolume: 0.8,
  };

  function canUseWebAudio() {
    return typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  }

  function getCtx() {
    if (!canUseWebAudio()) return null;

    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctx();

      masterBgGain = audioContext.createGain();
      masterBellGain = audioContext.createGain();

      masterBgGain.gain.value = state.backgroundVolume;
      masterBellGain.gain.value = state.bellVolume;

      masterBgGain.connect(audioContext.destination);
      masterBellGain.connect(audioContext.destination);
    }

    return audioContext;
  }

  async function unlock() {
    const ctx = getCtx();
    if (!ctx) return { ok: false, reason: "unsupported" };

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return { ok: false, reason: "resume-failed" };
      }
    }

    return { ok: true };
  }

  async function fetchAndDecode(src) {
    const ctx = getCtx();
    if (!ctx) throw new Error("unsupported");

    const res = await fetch(src);
    if (!res.ok) throw new Error(`fetch-failed:${res.status}`);
    const data = await res.arrayBuffer();

    try {
      return await ctx.decodeAudioData(data);
    } catch {
      throw new Error("decode-failed");
    }
  }

  async function loadBackground(src) {
    if (bgBufferCache.has(src)) return bgBufferCache.get(src);
    const buffer = await fetchAndDecode(src);
    bgBufferCache.set(src, buffer);
    return buffer;
  }

  async function loadBell(src) {
    if (bellBufferCache.has(src)) return bellBufferCache.get(src);
    const buffer = await fetchAndDecode(src);
    bellBufferCache.set(src, buffer);
    return buffer;
  }

  async function preload({ src, kind }) {
    const ctx = getCtx();
    if (!ctx) return { ok: false, reason: "unsupported" };

    try {
      if (kind === "background") await loadBackground(src);
      else await loadBell(src);
    } catch (error) {
      return { ok: false, reason: "audio-unavailable", error };
    }

    return { ok: true };
  }

  function setBackgroundVolume(volume) {
    state.backgroundVolume = Math.max(0, Math.min(1, Number(volume)));
    if (masterBgGain) masterBgGain.gain.value = state.backgroundVolume;
  }

  function setBellVolume(volume) {
    state.bellVolume = Math.max(0, Math.min(1, Number(volume)));
    if (masterBellGain) masterBellGain.gain.value = state.bellVolume;
  }

  function stopSource(source) {
    if (!source) return;
    try {
      source.stop();
    } catch {
      // ignore
    }
    try {
      source.disconnect();
    } catch {
      // ignore
    }
  }

  function stopBackground() {
    stopSource(bgSource);
    bgSource = null;
    bgBuffer = null;
    bgOffset = 0;
    bgStartedAt = 0;
  }

  function stopPreview({ fadeOutSeconds = 0 } = {}) {
    const ctx = getCtx();
    if (!preview) return;

    const current = preview;
    preview = null;

    if (!ctx || !current.gainNode) {
      stopSource(current.source);
      try {
        current.gainNode?.disconnect();
      } catch {
        // ignore
      }
      return;
    }

    if (fadeOutSeconds > 0) {
      fadeGain(current.gainNode, 0, fadeOutSeconds);
      const stopAt = ctx.currentTime + Math.max(0.02, fadeOutSeconds) + 0.02;
      try {
        current.source.stop(stopAt);
      } catch {
        // ignore
      }

      setTimeout(() => {
        stopSource(current.source);
        try {
          current.gainNode.disconnect();
        } catch {
          // ignore
        }
      }, Math.round((fadeOutSeconds + 0.1) * 1000));
      return;
    }

    stopSource(current.source);
    try {
      current.gainNode.disconnect();
    } catch {
      // ignore
    }
  }

  function stopAll() {
    stopPreview();
    stopBackground();
  }

  function fadeGain(gainNode, toValue, durationSeconds) {
    const ctx = getCtx();
    if (!ctx || !gainNode) return;

    const now = ctx.currentTime;
    const current = gainNode.gain.value;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(current, now);
    gainNode.gain.linearRampToValueAtTime(toValue, now + Math.max(0.01, durationSeconds));
  }

  async function startBackground({
    src,
    loop = true,
    fadeInSeconds = 1.5,
    loopStart = null,
    loopEnd = null,
  }) {
    const ctx = getCtx();
    if (!ctx) return { ok: false, reason: "unsupported" };

    const unlockResult = await unlock();
    if (!unlockResult.ok) return { ok: false, reason: "locked" };

    stopBackground();

    try {
      bgBuffer = await loadBackground(src);
    } catch (error) {
      return { ok: false, reason: "audio-unavailable", error };
    }

    bgLoop = Boolean(loop);

    bgSource = ctx.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop = bgLoop;
    if (bgLoop) {
      if (Number.isFinite(loopStart) && loopStart >= 0) bgSource.loopStart = loopStart;
      if (Number.isFinite(loopEnd) && loopEnd > 0) bgSource.loopEnd = loopEnd;
    }
    bgSource.connect(masterBgGain);

    // Start silent, then fade to the current configured volume.
    const targetVolume = state.backgroundVolume;
    masterBgGain.gain.value = 0;

    bgOffset = 0;
    bgStartedAt = ctx.currentTime;

    try {
      bgSource.start(0, bgOffset);
    } catch (error) {
      stopBackground();
      return { ok: false, reason: "start-failed", error };
    }

    fadeGain(masterBgGain, targetVolume, fadeInSeconds);
    return { ok: true };
  }

  function pauseBackground() {
    const ctx = getCtx();
    if (!ctx || !bgSource || !bgBuffer) return;

    const elapsed = ctx.currentTime - bgStartedAt;
    const duration = bgBuffer.duration || 1;
    bgOffset = (bgOffset + elapsed) % duration;

    stopSource(bgSource);
    bgSource = null;
  }

  async function resumeBackground({ fadeInSeconds = 0.5, loopStart = null, loopEnd = null } = {}) {
    const ctx = getCtx();
    if (!ctx || !bgBuffer) return { ok: false, reason: "no-buffer" };

    const unlockResult = await unlock();
    if (!unlockResult.ok) return { ok: false, reason: "locked" };

    if (bgSource) return { ok: true };

    bgSource = ctx.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop = bgLoop;
    if (bgLoop) {
      if (Number.isFinite(loopStart) && loopStart >= 0) bgSource.loopStart = loopStart;
      if (Number.isFinite(loopEnd) && loopEnd > 0) bgSource.loopEnd = loopEnd;
    }
    bgSource.connect(masterBgGain);

    const targetVolume = state.backgroundVolume;
    masterBgGain.gain.value = 0;

    bgStartedAt = ctx.currentTime;

    try {
      bgSource.start(0, bgOffset);
    } catch (error) {
      stopBackground();
      return { ok: false, reason: "start-failed", error };
    }

    fadeGain(masterBgGain, targetVolume, fadeInSeconds);
    return { ok: true };
  }

  async function fadeOutAndStopBackground({ fadeOutSeconds = 4 } = {}) {
    const ctx = getCtx();
    if (!ctx || !bgSource) {
      stopBackground();
      return { ok: true };
    }

    fadeGain(masterBgGain, 0, fadeOutSeconds);

    const stopAt = ctx.currentTime + Math.max(0.05, fadeOutSeconds) + 0.02;
    try {
      bgSource.stop(stopAt);
    } catch {
      // ignore
    }

    setTimeout(() => {
      stopBackground();
      // Restore gain to configured volume for next start.
      if (masterBgGain) masterBgGain.gain.value = state.backgroundVolume;
    }, Math.round((fadeOutSeconds + 0.1) * 1000));

    return { ok: true };
  }

  async function playBell({ src }) {
    const ctx = getCtx();
    if (!ctx) return { ok: false, reason: "unsupported" };

    const unlockResult = await unlock();
    if (!unlockResult.ok) return { ok: false, reason: "locked" };

    let buffer;
    try {
      buffer = await loadBell(src);
    } catch (error) {
      return { ok: false, reason: "audio-unavailable", error };
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(masterBellGain);

    try {
      source.start();
    } catch (error) {
      stopSource(source);
      return { ok: false, reason: "start-failed", error };
    }

    source.onended = () => stopSource(source);
    return { ok: true };
  }

  async function startPreview({
    src,
    kind,
    loop = false,
    fadeInSeconds = 0.25,
    fadeOutSeconds = 0.25,
    loopStart = null,
    loopEnd = null,
  }) {
    const ctx = getCtx();
    if (!ctx) return { ok: false, reason: "unsupported" };

    const unlockResult = await unlock();
    if (!unlockResult.ok) return { ok: false, reason: "locked" };

    // Crossfade by fading out the current preview while starting the next.
    stopPreview({ fadeOutSeconds });

    let buffer;
    try {
      buffer = kind === "background" ? await loadBackground(src) : await loadBell(src);
    } catch (error) {
      return { ok: false, reason: "audio-unavailable", error };
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = Boolean(loop);
    if (loop) {
      if (Number.isFinite(loopStart) && loopStart >= 0) source.loopStart = loopStart;
      if (Number.isFinite(loopEnd) && loopEnd > 0) source.loopEnd = loopEnd;
    }

    const gainNode = ctx.createGain();
  const target = kind === "background" ? state.backgroundVolume : state.bellVolume;
    gainNode.gain.value = 0;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    try {
      source.start();
    } catch (error) {
      stopSource(source);
      try {
        gainNode.disconnect();
      } catch {
        // ignore
      }
      return { ok: false, reason: "start-failed", error };
    }

    preview = { source, gainNode, kind, src };
    fadeGain(gainNode, target, fadeInSeconds);

    source.onended = () => {
      // If the ended source is still the active preview, clear it.
      if (preview?.source === source) preview = null;
      stopSource(source);
      try {
        gainNode.disconnect();
      } catch {
        // ignore
      }
    };

    return { ok: true };
  }

  function setPreviewVolume({ kind, volume }) {
    const ctx = getCtx();
    if (!ctx || !preview || !preview.gainNode) return;
    if (kind && preview.kind !== kind) return;

    const v = Math.max(0, Math.min(1, Number(volume)));
    // Fast ramp to avoid zipper noise while dragging.
    fadeGain(preview.gainNode, v, 0.03);
  }

  async function playPreview({ src, kind }) {
    // Back-compat: a one-shot preview. Background is looped by callers now.
    return startPreview({ src, kind, loop: false, fadeInSeconds: 0.06, fadeOutSeconds: 0.2 });
  }

  function getPreviewState() {
    if (!preview) return { active: false };
    return { active: true, kind: preview.kind, src: preview.src };
  }

  return {
    unlock,
    setBackgroundVolume,
    setBellVolume,
    preload,
    startBackground,
    pauseBackground,
    resumeBackground,
    fadeOutAndStopBackground,
    playBell,
    startPreview,
    playPreview,
    stopPreview,
    setPreviewVolume,
    getPreviewState,
    stopAll,
  };
}

export function getAudioEngine() {
  if (!singleton) singleton = createEngine();
  return singleton;
}
