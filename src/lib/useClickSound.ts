import { useEffect } from 'react';

let ctx: AudioContext | null = null;

function playClick() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;

    // Short noise burst through a bandpass — gives the crisp "tick" of a phone tap.
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1800;
    bandpass.Q.value = 1.2;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.08, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    noise.connect(bandpass).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);

    // A quick high sine "pop" for body, like a mobile keyboard click.
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.05, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // audio not available — silent no-op
  }
}

/**
 * Installs a single capture-phase document listener that plays a subtle
 * phone-style click tick whenever a <button> (or [role=button]) is pressed.
 */
export function useClickSound() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = e.target as Element | null;
      if (!el || !el.closest) return;
      const btn = el.closest('button, [role="button"]');
      if (btn) playClick();
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);
}
