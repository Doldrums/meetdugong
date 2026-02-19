import { useState, useEffect, useCallback, useRef } from 'react';
import type { FSMTransitionEvent, CharacterSwitchedEvent, PlaybackStartedEvent, PlaybackEndedEvent, PlaybackQueueEvent } from '@shared/types';
import VideoLayer from '../components/player/VideoLayer';
import OverlayLayer from '../components/player/OverlayLayer';
import DebugHUD from '../components/player/DebugHUD';
import { useVideoSwitch } from '../hooks/useVideoSwitch';
import { useWebSocket } from '../hooks/useWebSocket';

export default function PlayerPage() {
  const [clips, setClips] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  });

  const idleClipsRef = useRef<string[]>([]);
  const sendRef = useRef<((e: PlaybackStartedEvent | PlaybackEndedEvent | PlaybackQueueEvent) => void) | null>(null);

  const vs = useVideoSwitch({
    clips,
    onClipStarted: (clip: string) => {
      sendRef.current?.({ type: 'playback.started', clip });
    },
    onClipEnded: (clip: string) => {
      sendRef.current?.({ type: 'playback.ended', clip });
    },
    onClipsChange: setClips,
    onQueueChange: (snapshot) => {
      sendRef.current?.({ type: 'playback.queue', ...snapshot });
    },
  });

  const playSequenceRef = useRef(vs.playSequence);
  playSequenceRef.current = vs.playSequence;
  const clearQueueRef = useRef(vs.clearQueue);
  clearQueueRef.current = vs.clearQueue;

  const onTransition = useCallback((event: FSMTransitionEvent) => {
    const newClips = event.stateClips.length > 0 ? event.stateClips : idleClipsRef.current;
    playSequenceRef.current(event.bridgeClip, event.nextClip, newClips, event.to);
  }, []);

  const onQueueClear = useCallback(() => {
    clearQueueRef.current();
  }, []);

  const onCharacterSwitched = useCallback((event: CharacterSwitchedEvent) => {
    const idleClips = event.manifest.idle_loops?.map((c) => c.path) ?? [];
    idleClipsRef.current = idleClips;
    setClips(idleClips);
  }, []);

  const { send } = useWebSocket(onTransition, onQueueClear, onCharacterSwitched);
  sendRef.current = send;

  useEffect(() => {
    fetch('/manifest')
      .then((r) => r.json())
      .then((manifest) => {
        const idleClips =
          manifest.idle_loops?.map((c: { path: string }) => c.path) ?? [];
        idleClipsRef.current = idleClips;
        setClips(idleClips);
      })
      .catch(() => {
        idleClipsRef.current = [];
        setClips([]);
      });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toUpperCase()) {
        case 'D': setShowDebug((v) => !v); break;
        case 'R': send({ type: 'fsm.reset' }); break;
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
