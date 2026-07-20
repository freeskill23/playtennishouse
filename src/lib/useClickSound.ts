import { useEffect } from 'react';

let ctx: AudioContext | null = null;

function playClick() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;

    // Samsung Galaxy dial keypad tone: a clean, short sine beep around 1000Hz
    // with a fast attack and ~120ms exponential decay.
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // audio not available — silent no-op
  }
}

/**
 * Installs a single capture-phase document listener that plays a
 * Samsung Galaxy dial keypad-style beep whenever a <button> (or
 * [role=button]) is pressed.
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
