import { useEffect } from 'react';

let ctx: AudioContext | null = null;

function playClick() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // audio not available — silent no-op
  }
}

/**
 * Installs a single capture-phase document listener that plays a subtle
 * click tone whenever a <button> (or [role=button]) is pressed. No per-button
 * wiring required.
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
