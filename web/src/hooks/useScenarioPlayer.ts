import { useState, useCallback, useRef } from 'react';
import type { ControlEvent, ScenarioDefinition } from '@shared/types';

export type PlaybackState = 'idle' | 'playing' | 'stopping';

interface ScenarioPlayerReturn {
  play: (scenario: ScenarioDefinition, onSend: (e: ControlEvent) => void) => void;
  stop: (onSend: (e: ControlEvent) => void) => void;
  playbackState: PlaybackState;
  currentStepIndex: number;
  activeScenarioId: string | null;
}

export function useScenarioPlayer(): ScenarioPlayerReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    cancelRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback((onSend: (e: ControlEvent) => void) => {
    cleanup();
    setPlaybackState('stopping');
    // Reset to IDLE and clear overlays
    onSend({ type: 'fsm.reset' });
    onSend({ type: 'overlay.clearAll' });
    setPlaybackState('idle');
    setCurrentStepIndex(-1);
    setActiveScenarioId(null);
  }, [cleanup]);

  const play = useCallback((scenario: ScenarioDefinition, onSend: (e: ControlEvent) => void) => {
    // If already playing, stop first
    cleanup();

    cancelRef.current = false;
    setPlaybackState('playing');
    setActiveScenarioId(scenario.id);
    setCurrentStepIndex(0);

    // Reset to IDLE before starting
    onSend({ type: 'fsm.reset' });
    onSend({ type: 'overlay.clearAll' });

    const executeStep = (index: number) => {
      if (cancelRef.current || index >= scenario.steps.length) {
        if (!cancelRef.current) {
          // Scenario completed naturally — reset to idle
          onSend({ type: 'fsm.reset' });
          onSend({ type: 'overlay.clearAll' });
          setPlaybackState('idle');
          setCurrentStepIndex(-1);
          setActiveScenarioId(null);
        }
        return;
      }

      const step = scenario.steps[index];
      setCurrentStepIndex(index);

      // Fire state transition if present
      if (step.state) {
        onSend({ type: 'fsm.manual', state: step.state });
      }

      // Fire overlay events if present
      if (step.overlays) {
        for (const overlay of step.overlays) {
          onSend(overlay);
        }
      }

      // Schedule next step
      timeoutRef.current = setTimeout(() => {
        executeStep(index + 1);
      }, step.delayMs);
    };

    // Small delay to let reset propagate before starting
    timeoutRef.current = setTimeout(() => {
      executeStep(0);
    }, 500);
  }, [cleanup]);

  return { play, stop, playbackState, currentStepIndex, activeScenarioId };
}
