// Media device management — microphone access for WebRTC.
import type { MicPermission } from './types';

let cachedStream: MediaStream | null = null;

export async function requestMicPermission(): Promise<{ permission: MicPermission; stream: MediaStream | null }> {
  const existing = getCachedStream();
  if (existing) return { permission: 'GRANTED', stream: existing };
  if (!navigator.mediaDevices?.getUserMedia) {
    return { permission: 'NO_DEVICE', stream: null };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    cachedStream = stream;
    return { permission: 'GRANTED', stream };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
      return { permission: 'DENIED', stream: null };
    }
    if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
      return { permission: 'NO_DEVICE', stream: null };
    }
    return { permission: 'DENIED', stream: null };
  }
}

export function getCachedStream(): MediaStream | null {
  if (cachedStream?.getAudioTracks().some((track) => track.readyState === 'live')) return cachedStream;
  releaseStream();
  return null;
}

export function releaseStream(): void {
  if (cachedStream) {
    cachedStream.getTracks().forEach((t) => t.stop());
    cachedStream = null;
  }
}

/**
 * Measure signal energy without replacing or routing the WebRTC track.
 * Values are normalized to 0..1 and are diagnostic only: a non-zero level
 * proves browser-side capture/playback activity, not that a human understood
 * the call. The returned cleanup closes the analyser's AudioContext.
 */
export function watchAudioLevel(
  stream: MediaStream,
  onLevel: (level: number) => void,
): () => void {
  const AudioContextCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor || !stream.getAudioTracks().length) return () => {};

  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  try {
    context = new AudioContextCtor();
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    const sample = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const value of samples) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      onLevel(Math.min(1, Math.sqrt(sum / samples.length) * 4));
    };
    timer = setInterval(sample, 120);
    sample();
  } catch {
    onLevel(0);
  }

  return () => {
    if (timer) clearInterval(timer);
    timer = null;
    try { source?.disconnect(); } catch { /* already disconnected */ }
    try { analyser?.disconnect(); } catch { /* already disconnected */ }
    void context?.close().catch(() => {});
    source = null;
    analyser = null;
    context = null;
  };
}

// Listen for device removal (headset unplugged etc.).
export function watchDeviceRemoval(onRemove: () => void): () => void {
  const handler = () => {
    if (cachedStream) {
      const alive = cachedStream.getTracks().some((t) => t.readyState === 'live');
      if (!alive) {
        releaseStream();
        onRemove();
      }
    }
  };
  if (navigator.mediaDevices?.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
  }
  return () => {};
}
