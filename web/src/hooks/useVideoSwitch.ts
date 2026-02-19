import { useRef, useCallback, useState, useEffect } from 'react';

export interface QueueSnapshot {
  transitionActive: boolean;
  pendingClip: string | null;
  items: Array<{ bridge: string | null; target: string | null; targetState: string }>;
}

interface UseVideoSwitchOptions {
  clips: string[];
  onClipStarted?: (clip: string) => void;
  onClipEnded?: (clip: string) => void;
  onClipsChange?: (clips: string[]) => void;
  onQueueChange?: (snapshot: QueueSnapshot) => void;
}

interface QueuedTransition {
  bridge: string | null;
  target: string | null;
  clips: string[];
  targetState: string;
}

export function useVideoSwitch({ clips, onClipStarted, onClipEnded, onClipsChange, onQueueChange }: UseVideoSwitchOptions) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [currentClip, setCurrentClip] = useState<string | null>(null);

  const activeSlotRef = useRef<'A' | 'B'>('A');
  const clipsRef = useRef(clips);
  const onClipStartedRef = useRef(onClipStarted);
  const onClipEndedRef = useRef(onClipEnded);
  const onClipsChangeRef = useRef(onClipsChange);
  const onQueueChangeRef = useRef(onQueueChange);
  const standbyReadyRef = useRef(false);
  const swappingRef = useRef(false);
  const swapTriggeredRef = useRef(false);
  const pendingClipRef = useRef<string | null>(null);
  const queueRef = useRef<QueuedTransition[]>([]);
  const transitionActiveRef = useRef(false);

  clipsRef.current = clips;
  onClipStartedRef.current = onClipStarted;
  onClipEndedRef.current = onClipEnded;
  onClipsChangeRef.current = onClipsChange;
  onQueueChangeRef.current = onQueueChange;

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

  const notifyQueue = useCallback(() => {
    onQueueChangeRef.current?.({
      transitionActive: transitionActiveRef.current,
      pendingClip: pendingClipRef.current,
      items: queueRef.current.map(t => ({ bridge: t.bridge, target: t.target, targetState: t.targetState })),
    });
  }, []);

  // Pop the next queued transition if no transition is currently active
  const processQueue = useCallback(() => {
    if (transitionActiveRef.current) return;

    const next = queueRef.current.shift();
    if (!next) return;

    // Update clip pool immediately (both ref and React state)
    clipsRef.current = next.clips;
    onClipsChangeRef.current?.(next.clips);

    if (next.bridge && next.target) {
      pendingClipRef.current = next.target;
    } else {
      pendingClipRef.current = null;
    }

    const clipToPlay = next.bridge ?? next.target;
    if (!clipToPlay) return;

    transitionActiveRef.current = true;
    preloadOnStandby(clipToPlay);
    notifyQueue();
  }, [preloadOnStandby, notifyQueue]);

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

      // Bridge→action chain: pending clip goes next
      const pending = pendingClipRef.current;
      if (pending) {
        pendingClipRef.current = null;
        preloadOnStandby(pending);
        notifyQueue();
      } else {
        // Transition sequence complete — try next queued transition
        transitionActiveRef.current = false;
        if (queueRef.current.length > 0) {
          processQueue();
        } else {
          // No queued transitions — continue looping in current pool
          notifyQueue();
          const next = pickRandomClip(clipUrl);
          if (next) preloadOnStandby(next);
        }
      }
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
  }, [pickRandomClip, preloadOnStandby, processQueue, notifyQueue]);

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

  // Queue a transition. Multiple clicks append — play them in order.
  // The active clip finishes before the next queued transition starts.
  const playSequence = useCallback((
    bridgeClip: string | null,
    targetClip: string | null,
    clips: string[],
    targetState: string,
  ) => {
    if (!bridgeClip && !targetClip) {
      // No clips to play — just update the pool immediately
      clipsRef.current = clips;
      onClipsChangeRef.current?.(clips);
      return;
    }

    // Append to queue — each click adds a destination
    queueRef.current.push({ bridge: bridgeClip, target: targetClip, clips, targetState });
    processQueue();
    notifyQueue();
  }, [processQueue, notifyQueue]);

  // Clear all pending transitions. Current clip keeps playing, then loops.
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    pendingClipRef.current = null;
    transitionActiveRef.current = false;

    // Override standby with a random clip from current pool
    // (in case standby had a transition clip loaded)
    const active = el(activeSlotRef.current);
    const currentSrc = active?.src ?? '';
    const next = pickRandomClip(currentSrc);
    if (next) preloadOnStandby(next);

    notifyQueue();
  }, [pickRandomClip, preloadOnStandby, notifyQueue]);

  // Init: play first clip on A (only on first boot when nothing is playing)
  useEffect(() => {
    if (clips.length === 0) return;
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a) return;
    // Skip if any video is currently playing — swap logic handles clip pool changes
    if ((a.src && !a.paused) || (b?.src && !b.paused)) return;

    const firstClip = pickRandomClip();
    if (!firstClip) return;

    // Ensure A is on top
    a.style.zIndex = '2';
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
    clearQueue,
  };
}
