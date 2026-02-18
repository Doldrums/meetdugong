import { useState, useEffect, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';
import { useWebSocket } from '../hooks/useWebSocket';
import SystemStatus from '../components/admin/SystemStatus';
import FSMControls from '../components/admin/FSMControls';
import StageVisualsTab from '../components/admin/StageVisualsTab';
import EventLog from '../components/admin/EventLog';

type Tab = 'general' | 'fsm' | 'overlays' | 'logs';

const TABS: { key: Tab; label: string; shortLabel: string }[] = [
  { key: 'general', label: 'Live Status', shortLabel: 'Status' },
  { key: 'fsm', label: 'Character', shortLabel: 'FSM' },
  { key: 'overlays', label: 'Stage Visuals', shortLabel: 'Visuals' },
  { key: 'logs', label: 'Activity', shortLabel: 'Logs' },
];

export default function AdminPage() {
  const { send } = useWebSocket();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const handleTabClick = (key: Tab) => {
    if (activeTab === key && sheetOpen) {
      setSheetOpen(false);
    } else {
      setActiveTab(key);
      setSheetOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen md:grid md:grid-cols-2 bg-gray-950 relative">
      {/* Left: Player Preview */}
      <div className="absolute inset-0 md:relative flex items-center justify-center bg-black md:border-r md:border-glass-border">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">Loading Player...</div>
          </div>
        )}
        <iframe
          src="/player?mode=preview"
          className="w-full h-full border-0"
          title="Dugong Preview"
          allow="autoplay"
          onLoad={() => setIframeLoaded(true)}
        />
        <span className="absolute top-3 left-3 glass-badge pointer-events-none text-xs font-medium">
          PREVIEW
        </span>
        <a
          href="/player"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 glass-badge hover:text-white transition-colors text-xs"
        >
          Open Fullscreen
        </a>
      </div>

      {/* Right: Admin Panel — bottom sheet on mobile */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-50 h-[85vh] rounded-t-2xl
          md:relative md:z-auto md:h-auto md:rounded-none
          admin-bg flex flex-col overflow-hidden
          transition-transform duration-300 ease-out
          md:translate-y-0
          ${sheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle — mobile only */}
        <div
          className="md:hidden flex justify-center pt-2 pb-1 cursor-pointer"
          onClick={() => setSheetOpen((o) => !o)}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title bar — desktop only */}
        <div className="hidden md:block px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-white font-semibold text-lg tracking-tight">
              Dugong Control
            </h1>
            <span className="text-xs text-white/30">Keyboard shortcuts active</span>
          </div>
          <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
            Embodied K2 Agent — spatial interface generation for physical and digital surfaces
          </p>
        </div>

        {/* Segmented tab bar */}
        <div className="segment-control mx-2 md:mx-6 mb-2">
          <div className="flex">
            {TABS.map(({ key, label, shortLabel }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={`segment-item flex-1 text-center truncate ${activeTab === key ? 'segment-active' : ''}`}
              >
                <span className="md:hidden">{shortLabel}</span>
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="glass-card flex-1 min-h-0 overflow-y-auto p-2.5 md:p-4 rounded-t-none glass-scroll flex flex-col mx-2 md:mx-5 mb-2 md:mb-5">
          {activeTab === 'general' && <SystemStatus />}
          {activeTab === 'fsm' && <FSMControls onSend={handleSend} />}
          {activeTab === 'overlays' && <StageVisualsTab onSend={handleSend} />}
          {activeTab === 'logs' && <EventLog />}
        </div>
      </div>
    </div>
  );
}
