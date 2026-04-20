/**
 * Diagnostic overlay toggle gesture.
 *
 * Five taps on the header/logo within 2 seconds flips the field-test overlay
 * on or off. Gated on `ENV.DIAG_TOGGLE_ENABLED` — when the flag is off (store
 * builds), the hook returns a no-op so there is zero cost for end users.
 */

import { useCallback, useRef } from 'react';
import ENV from '@/src/config/env';
import { toggleOverlayVisible } from '@/src/services/diagnostics.service';

const REQUIRED_TAPS = 5;
const WINDOW_MS = 2000;

export const useDiagTapToggle = (): (() => void) => {
  const tapsRef = useRef<number[]>([]);

  return useCallback(() => {
    if (!ENV.DIAG_TOGGLE_ENABLED) return;

    const now = Date.now();
    // Drop taps that fell outside the rolling window.
    const fresh = tapsRef.current.filter((t) => now - t <= WINDOW_MS);
    fresh.push(now);
    tapsRef.current = fresh;

    if (fresh.length >= REQUIRED_TAPS) {
      tapsRef.current = [];
      toggleOverlayVisible();
    }
  }, []);
};
