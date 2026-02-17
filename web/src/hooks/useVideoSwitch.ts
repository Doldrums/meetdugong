import { useRef, useCallback, useState, useEffect } from 'react';

interface UseVideoSwitchOptions {
  clips: string[];
  onClipStarted?: (clip: string) => void;
  onClipEnded?: (clip: string) => void;
}

export function useVideoSwitch({ clips, onClipStarted, onClipEnded }: UseVideoSwitchOptions) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [currentClip, setCurrentClip] = useState<string | null>(null);

  const activeSlotRef = useRef<'A' | 'B'>('A');
  const clipsRef = useRef(clips);
  const onClipStartedRef = useRef(onClipStarted);
  const onClipEndedRef = useRef(onClipEnded);
  const standbyReadyRef = useRef(false);
  const swappingRef = useRef(false);
  const swapTriggeredRef = useRef(false);

  clipsRef.current = clips;
  onClipStartedRef.current = onClipStarted;
  onClipEndedRef.current = onClipEnded;

  const el = (slot: 'A' | 'B') => (slot === 'A' ? videoARef.current : videoBRef.current);
  const other = (slot: 'A' | 'B'): 'A' | 'B' => (slot === 'A' ? 'B' : 'A');

  const pickRandomClip = useCallback((exclude?: string): string => {
    const available = clipsRef.current;
    if (available.length === 0) return '';
    if (available.length === 1) return available[0];
    const filtered = exclude ? available.filter(c => c !== exclude) : available;
    const pool = filtered.length > 0 ? filtered : available;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const preloadOnStandby = useCallback((clipUrl: string) => {
    const standbyEl = el(other(activeSlotRef.current));
    if (!standbyEl) return;
    standbyReadyRef.current = false;
    standbyEl.preload = 'auto';
    standbyEl.src = clipUrl;
    standbyEl.load();
    standbyEl.addEventListener('canplaythrough', () => {
      standbyReadyRef.current = true;
    }, { once: true });
  }, []);

  // Instant swap using direct DOM style — no React render delay
  const doSwap = useCallback(() => {
    if (swappingRef.current) return;
    swappingRef.current = true;

    const oldSlot = activeSlotRef.current;
    const newSlot = other(oldSlot);
    const newEl = el(newSlot);
    const oldEl = el(oldSlot);

    if (!newEl?.src) {
      swappingRef.current = false;
      return;
    }

    const clipUrl = newEl.src;

    const finish = () => {
      // Direct DOM: promote new, demote old — instant, no render cycle
      newEl.style.zIndex = '2';
      if (oldEl) oldEl.style.zIndex = '1';

      activeSlotRef.current = newSlot;
      setActiveSlot(newSlot);
      setCurrentClip(clipUrl);
      onClipStartedRef.current?.(clipUrl);
      swappingRef.current = false;
      swapTriggeredRef.current = false;

      if (oldEl) oldEl.pause();

      // Preload next idle clip
      const next = pickRandomClip(clipUrl);
      if (next) preloadOnStandby(next);
    };

    // If already playing (preemptive swap), finish immediately
    if (!newEl.paused && newEl.readyState >= 3) {
      finish();
      return;
    }

    newEl.addEventListener('playing', () => finish(), { once: true });
    newEl.play().catch(() => {
      // Fallback so we don't get stuck
      finish();
    });
  }, [pickRandomClip, preloadOnStandby]);

  // Called on 'ended' — only as a fallback if timeupdate swap didn't fire
  const handleEnded = useCallback((slot: 'A' | 'B') => {
    if (activeSlotRef.current !== slot) return;
    if (swappingRef.current) return; // already swapping

    const active = el(slot);
    if (active) onClipEndedRef.current?.(active.src);

    if (standbyReadyRef.current) {
      doSwap();
    } else {
      // Wait for standby
      const standbyEl = el(other(slot));
      if (standbyEl) {
        standbyEl.addEventListener('canplaythrough', () => {
          standbyReadyRef.current = true;
          doSwap();
        }, { once: true });
      }
    }
  }, [doSwap]);

  // Preemptive swap: on timeupdate, when near end, start standby early
  const handleTimeUpdate = useCallback((slot: 'A' | 'B') => {
    if (activeSlotRef.current !== slot) return;
    if (swapTriggeredRef.current) return;

    const active = el(slot);
    if (!active || !active.duration) return;

    const remaining = active.duration - active.currentTime;
    if (remaining < 0.15 && remaining > 0 && standbyReadyRef.current) {
      swapTriggeredRef.current = true;
      onClipEndedRef.current?.(active.src);

      // Start playing standby NOW while active still shows its last frames
      const standbyEl = el(other(slot));
      if (standbyEl) {
        standbyEl.play().then(() => {
          doSwap();
        }).catch(() => {
          doSwap();
        });
      }
    }
  }, [doSwap]);

  // Play a sequence: optional bridge → target clip
  const playSequence = useCallback((bridgeClip: string | null, targetClip: string | null) => {
    const clipToPlay = bridgeClip ?? targetClip;
    if (!clipToPlay) return;

    const standbyEl = el(other(activeSlotRef.current));
    if (!standbyEl) return;

    standbyReadyRef.current = false;
    standbyEl.src = clipToPlay;
    standbyEl.load();
    standbyEl.addEventListener('canplaythrough', () => {
      standbyReadyRef.current = true;
      doSwap();
    }, { once: true });
  }, [doSwap]);

  // Init: play first clip on A
  useEffect(() => {
    if (clips.length === 0) return;
    const a = videoARef.current;
    if (!a) return;
    if (a.src && !a.paused) return;

    const firstClip = pickRandomClip();
    if (!firstClip) return;

    // Ensure A is on top
    a.style.zIndex = '2';
    const b = videoBRef.current;
    if (b) b.style.zIndex = '1';

    a.preload = 'auto';
    a.src = firstClip;
    a.load();
    a.addEventListener('canplaythrough', () => {
      a.play().then(() => {
        setCurrentClip(firstClip);
        onClipStartedRef.current?.(firstClip);
        const next = pickRandomClip(firstClip);
        if (next) preloadOnStandby(next);
      }).catch(err => console.warn('[video] autoplay failed:', err));
    }, { once: true });
  }, [clips, pickRandomClip, preloadOnStandby]);

  return {
    videoARef,
    videoBRef,
    activeSlot,
    currentClip,
    handleEnded,
    handleTimeUpdate,
    playSequence,
  };
}
