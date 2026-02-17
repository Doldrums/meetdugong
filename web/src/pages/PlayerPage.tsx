import { useState, useEffect, useCallback, useRef } from 'react';
import type { FSMTransitionEvent, PlaybackStartedEvent, PlaybackEndedEvent } from '@shared/types';
import VideoLayer from '../components/player/VideoLayer';
import OverlayLayer from '../components/player/OverlayLayer';
import DebugHUD from '../components/player/DebugHUD';
import { useVideoSwitch } from '../hooks/useVideoSwitch';
import { useWebSocket } from '../hooks/useWebSocket';

const IDLE_CLIPS = [
  '/content/idle_loops/idle_0.mp4',
  '/content/idle_loops/idle_1.mp4',
  '/content/idle_loops/idle_2.mp4',
  '/content/idle_loops/idle_3.mp4',
  '/content/idle_loops/idle_4.mp4',
];

export default function PlayerPage() {
  const [clips, setClips] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  });

  const sendRef = useRef<((e: PlaybackStartedEvent | PlaybackEndedEvent) => void) | null>(null);

  const vs = useVideoSwitch({
    clips,
    onClipStarted: (clip: string) => {
      sendRef.current?.({ type: 'playback.started', clip });
    },
    onClipEnded: (clip: string) => {
      sendRef.current?.({ type: 'playback.ended', clip });
    },
  });

  const playSequenceRef = useRef(vs.playSequence);
  playSequenceRef.current = vs.playSequence;

  const onTransition = useCallback((event: FSMTransitionEvent) => {
    playSequenceRef.current(event.bridgeClip, event.nextClip);
  }, []);

  const { send } = useWebSocket(onTransition);
  sendRef.current = send;

  useEffect(() => {
    fetch('/manifest')
      .then((r) => r.json())
      .then((manifest) => {
        const idleClips =
          manifest.idle_loops?.map((c: { path: string }) => c.path) ?? [];
        setClips(idleClips.length > 0 ? idleClips : IDLE_CLIPS);
      })
      .catch(() => {
        setClips(IDLE_CLIPS);
      });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toUpperCase()) {
        case 'D':
          setShowDebug((v) => !v);
          break;
        case 'R':
          send({ type: 'fsm.reset' });
          break;
        case 'G':
          send({ type: 'fsm.manual', state: 'GREET' });
          break;
        case 'L':
          send({ type: 'fsm.manual', state: 'LISTEN' });
          break;
        case 'T':
          send({ type: 'fsm.manual', state: 'THINK' });
          break;
        case 'S':
          send({ type: 'fsm.manual', state: 'SPEAK' });
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [send]);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: '100vmin', height: '100vmin' }}>
        {clips.length > 0 && (
          <VideoLayer clips={clips} onVideoSwitch={vs} />
        )}
        <OverlayLayer />
        {showDebug && <DebugHUD />}
      </div>
    </div>
  );
}
