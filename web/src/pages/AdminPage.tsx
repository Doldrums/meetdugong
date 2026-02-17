import { useState, useEffect, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';
import { useWebSocket } from '../hooks/useWebSocket';
import SystemStatus from '../components/admin/SystemStatus';
import FSMControls from '../components/admin/FSMControls';
import OverlayControls from '../components/admin/OverlayControls';
import EventLog from '../components/admin/EventLog';

export default function AdminPage() {
  const { send } = useWebSocket();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleSend = useCallback((event: ControlEvent) => {
    send(event);
  }, [send]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key.toUpperCase()) {
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
    <div className="h-screen w-screen grid grid-cols-2 bg-gray-900">
      {/* Left: Player Preview */}
      <div className="relative flex items-center justify-center bg-black border-r border-gray-700">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">Loading Player...</div>
          </div>
        )}
        <iframe
          src="/player?mode=preview"
          className="w-full h-full border-0"
          title="Player Preview"
          allow="autoplay"
          onLoad={() => setIframeLoaded(true)}
        />
        <span className="absolute top-2 left-2 text-xs bg-gray-800/80 text-gray-400 px-2 py-0.5 rounded pointer-events-none">
          PREVIEW
        </span>
        <a
          href="/player"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 text-xs bg-gray-800/80 text-gray-400 hover:text-white px-2 py-0.5 rounded transition-colors"
        >
          Open Fullscreen
        </a>
      </div>

      {/* Right: Admin Panel */}
      <div className="flex flex-col gap-4 p-4 overflow-hidden">
        <SystemStatus />
        <FSMControls onSend={handleSend} />
        <OverlayControls onSend={handleSend} />
        <EventLog />
      </div>
    </div>
  );
}
