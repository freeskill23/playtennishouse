import { useEffect, useRef } from 'react';

const DEFAULT_IDLE_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

/**
 * Calls `onIdle` once after `idleMs` of no user activity.
 * Resets the timer on any input event. No-op when `enabled` is false.
 * Also checks elapsed time when the tab becomes visible again,
 * so background-tab timer throttling doesn't prevent logout.
 */
export function useIdleLogout(onIdle: () => void, enabled: boolean, idleMs: number = DEFAULT_IDLE_MS) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const cbRef = useRef(onIdle);
  cbRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    const fire = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cbRef.current();
    };

    const reset = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(fire, idleMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastActivityRef.current >= idleMs) {
          fire();
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(fire, idleMs - (Date.now() - lastActivityRef.current));
        }
      }
    };

    reset();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, idleMs]);
}
