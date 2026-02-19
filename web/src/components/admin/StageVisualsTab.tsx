import { useState, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';
import VisualGallery from './overlays/VisualGallery';
import OverlayControls from './OverlayControls';

interface StageVisualsTabProps {
  onSend: (event: ControlEvent) => void;
}

export default function StageVisualsTab({ onSend }: StageVisualsTabProps) {
  const [debugOn, setDebugOn] = useState(false);

  const toggleDebug = useCallback(() => {
    const next = !debugOn;
    setDebugOn(next);
    // Tell the player iframe (separate React tree) to toggle debug zones
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Player Preview"]');
    iframe?.contentWindow?.postMessage({ type: 'debug.positions', enabled: next }, '*');
    // Also tell any standalone /player windows
    window.postMessage({ type: 'debug.positions', enabled: next }, '*');
  }, [debugOn]);

  return (
    <div className="space-y-5">
      <VisualGallery />

      {/* Glass separator */}
      <div
        className="h-px mx-2"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.12), transparent)',
        }}
      />

      {/* Position debug toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-header">Position Debug</h3>
          <p className="text-[11px] text-white/20 mt-0.5 leading-relaxed">
            Show overlay position zones on the player (left/right, 1/3 w × 1/8 h)
          </p>
        </div>
        <button
          type="button"
          onClick={toggleDebug}
          className={`glass-btn text-xs font-semibold ${
            debugOn ? 'text-[#007AFF]' : 'text-white/40'
          }`}
        >
          {debugOn ? 'Zones ON' : 'Zones OFF'}
        </button>
      </div>

      {/* Glass separator */}
      <div
        className="h-px mx-2"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.12), transparent)',
        }}
      />

      <OverlayControls onSend={onSend} />
    </div>
  );
}
