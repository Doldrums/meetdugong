import { useState, useEffect, useCallback } from 'react';
import type { ControlEvent, ScenarioDefinition } from '@shared/types';
import { useAppStore } from '../../stores/appStore';
import { useScenarioPlayer } from '../../hooks/useScenarioPlayer';
import { useVideoExport } from '../../hooks/useVideoExport';

interface ScenariosTabProps {
  onSend: (event: ControlEvent) => void;
}

export default function ScenariosTab({ onSend }: ScenariosTabProps) {
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const activeCharacter = useAppStore((s) => s.activeCharacter);
  const fsmStates = useAppStore((s) => s.fsmStates);

  const { play, stop, playbackState, currentStepIndex, activeScenarioId } = useScenarioPlayer();
  const { startRecording, stopRecording, isRecording } = useVideoExport();

  // Fetch scenarios when character changes
  useEffect(() => {
    setLoading(true);
    fetch('/scenarios')
      .then((r) => r.json())
      .then((data: ScenarioDefinition[]) => setScenarios(data))
      .catch(() => setScenarios([]))
      .finally(() => setLoading(false));
  }, [activeCharacter]);

  // Auto-stop on character switch
  useEffect(() => {
    if (playbackState === 'playing') {
      stop(onSend);
      if (isRecording) stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCharacter]);

  const checkCompatibility = useCallback(
    (scenario: ScenarioDefinition): boolean => {
      if (!scenario.requiredStates) return true;
      return scenario.requiredStates.every((s) => fsmStates.includes(s));
    },
    [fsmStates],
  );

  const handlePlay = useCallback(
    (scenario: ScenarioDefinition) => {
      play(scenario, onSend);
    },
    [play, onSend],
  );

  const handleStop = useCallback(() => {
    if (isRecording) stopRecording();
    stop(onSend);
  }, [stop, onSend, isRecording, stopRecording]);

  const handleRecord = useCallback(
    (scenario: ScenarioDefinition) => {
      const started = startRecording();
      if (started) {
        // Play and auto-stop recording when done
        const wrappedOnSend = (e: ControlEvent) => onSend(e);
        play(scenario, wrappedOnSend);
      }
    },
    [startRecording, play, onSend],
  );

  // Stop recording when playback ends naturally
  useEffect(() => {
    if (playbackState === 'idle' && isRecording) {
      stopRecording();
    }
  }, [playbackState, isRecording, stopRecording]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/30 text-sm animate-pulse">Loading scenarios...</span>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/30 text-sm">No scenarios defined for this character.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => {
        const compatible = checkCompatibility(scenario);
        const isActive = activeScenarioId === scenario.id;
        const isPlaying = isActive && playbackState === 'playing';
        const progress = isActive && scenario.steps.length > 0
          ? ((currentStepIndex + 1) / scenario.steps.length) * 100
          : 0;

        return (
          <div
            key={scenario.id}
            className={`glass-card p-3 space-y-2 ${!compatible ? 'opacity-50' : ''}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{scenario.name}</h3>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
              <span className="text-[10px] text-white/20 whitespace-nowrap">
                {scenario.steps.length} steps
              </span>
            </div>

            {/* Progress bar (visible during playback) */}
            {isPlaying && (
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {currentStepIndex >= 0 && scenario.steps[currentStepIndex] && (
                  <p className="text-[10px] text-white/30">
                    Step {currentStepIndex + 1}/{scenario.steps.length}
                    {scenario.steps[currentStepIndex].label
                      ? ` — ${scenario.steps[currentStepIndex].label}`
                      : ''}
                  </p>
                )}
              </div>
            )}

            {/* Step timeline (collapsed when not active) */}
            {isPlaying && (
              <div className="flex gap-0.5 flex-wrap">
                {scenario.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full flex-1 min-w-[4px] max-w-[12px] transition-colors ${
                      i < currentStepIndex
                        ? 'bg-[#007AFF]'
                        : i === currentStepIndex
                          ? 'bg-[#007AFF] animate-pulse'
                          : 'bg-white/10'
                    }`}
                    title={step.label ?? `Step ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="glass-btn text-xs font-semibold text-red-400 flex-1"
                >
                  Stop
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handlePlay(scenario)}
                    disabled={!compatible || (playbackState === 'playing' && !isActive)}
                    className="glass-btn text-xs font-semibold text-[#007AFF] flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => handleRecord(scenario)}
                    disabled={!compatible || playbackState === 'playing'}
                    className="glass-btn text-xs font-semibold text-red-400 flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isRecording && isActive ? 'Rec...' : 'Record'}
                  </button>
                </>
              )}
            </div>

            {/* Compatibility warning */}
            {!compatible && (
              <p className="text-[10px] text-yellow-400/60">
                Missing states: {scenario.requiredStates?.filter((s) => !fsmStates.includes(s)).join(', ')}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
