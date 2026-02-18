import { useState, useEffect, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';
import { useWebSocket } from '../hooks/useWebSocket';
import SystemStatus from '../components/admin/SystemStatus';
import FSMControls from '../components/admin/FSMControls';
import OverlayControls from '../components/admin/OverlayControls';
import EventLog from '../components/admin/EventLog';

type Tab = 'general' | 'fsm' | 'overlays' | 'logs';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: '📡 Live Status' },
  { key: 'fsm', label: '🎭 Character Behavior' },
  { key: 'overlays', label: '🎨 Stage Visuals' },
  { key: 'logs', label: '📜 Activity Stream' },
];

export default function AdminPage() {
  const { send } = useWebSocket();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');

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
    <div className="h-screen w-screen grid grid-cols-2 bg-gray-950">
      {/* Left: Player Preview */}
      <div className="relative flex items-center justify-center bg-black border-r border-glass-border">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">✨ Loading Player...</div>
          </div>
        )}
        <iframe
          src="/player?mode=preview"
          className="w-full h-full border-0"
          title="Player Preview"
          allow="autoplay"
          onLoad={() => setIframeLoaded(true)}
        />
        <span className="absolute top-3 left-3 glass-badge pointer-events-none">
          👁️ PREVIEW
        </span>
        <a
          href="/player"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 glass-badge hover:text-white transition-colors"
        >
          🔗 Open Fullscreen
        </a>
      </div>

      {/* Right: Admin Panel */}
      <div className="admin-bg flex flex-col p-5 overflow-hidden">
        <div className="flex items-center justify-between px-1 mb-4">
          <h1 className="shimmer-text text-lg font-bold tracking-wide">
            ✦ HoloBox Control ✦
          </h1>
          <span className="text-xs text-gray-600">⌨️ Keyboard shortcuts active</span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`glass-tab ${activeTab === key ? 'glass-tab-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="glass-card flex-1 min-h-0 overflow-y-auto p-4 rounded-t-none glass-scroll flex flex-col">
          {activeTab === 'general' && <SystemStatus />}
          {activeTab === 'fsm' && <FSMControls onSend={handleSend} />}
          {activeTab === 'overlays' && <OverlayControls onSend={handleSend} />}
          {activeTab === 'logs' && <EventLog />}
        </div>
      </div>
    </div>
  );
}
