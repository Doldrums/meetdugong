import { useEffect, useRef } from 'react';
import { useLogStore } from '../../stores/logStore';
import type { LogEntry } from '@shared/types';

const TYPE_COLORS: Record<string, string> = {
  'status': 'text-gray-400',
  'fsm.transition': 'text-cyan-400',
  'fsm.manual': 'text-cyan-300',
  'fsm.reset': 'text-yellow-400',
  'playback.started': 'text-green-400',
  'playback.ended': 'text-green-300',
  'overlay.applied': 'text-purple-400',
  'overlay.subtitle.set': 'text-purple-300',
  'overlay.subtitle.clear': 'text-purple-300',
  'overlay.card.show': 'text-purple-300',
  'overlay.card.hide': 'text-purple-300',
  'overlay.clearAll': 'text-purple-300',
  'overlay.qr.show': 'text-purple-300',
  'overlay.qr.hide': 'text-purple-300',
  'error': 'text-red-400',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 } as Intl.DateTimeFormatOptions);
}

function summarize(entry: LogEntry): string {
  const e = entry.event;
  switch (e.type) {
    case 'fsm.transition':
      return `${e.from} → ${e.to}${e.bridgeClip ? ` (bridge: ${e.bridgeClip.split('/').pop()})` : ''}`;
    case 'fsm.manual':
      return `→ ${e.state}`;
    case 'fsm.reset':
      return 'reset';
    case 'playback.started':
    case 'playback.ended':
      return e.clip.split('/').pop() ?? e.clip;
    case 'status':
      return `${e.currentState} | ${e.orchestrator}`;
    case 'error':
      return `[${e.code}] ${e.message}`;
    case 'overlay.applied':
      return `${e.name}: ${JSON.stringify(e.details).substring(0, 60)}`;
    default:
      return JSON.stringify(e).substring(0, 80);
  }
}

export default function EventLog() {
  const entries = useLogStore((s) => s.entries);
  const autoScroll = useLogStore((s) => s.autoScroll);
  const setAutoScroll = useLogStore((s) => s.setAutoScroll);
  const clear = useLogStore((s) => s.clear);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Event Log <span className="text-gray-600">({entries.length})</span>
        </h2>
        <div className="flex gap-2 text-xs">
          <label className="flex items-center gap-1 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          <button onClick={clear} className="text-gray-500 hover:text-gray-300">
            Clear
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto bg-gray-950 rounded p-2 font-mono text-xs space-y-0.5"
      >
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-2 leading-relaxed">
            <span className="text-gray-600 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className="text-gray-600 shrink-0">
              {entry.direction === 'outbound' ? '→' : '←'}
            </span>
            <span className={`shrink-0 ${TYPE_COLORS[entry.event.type] ?? 'text-gray-300'}`}>
              {entry.event.type}
            </span>
            <span className="text-gray-400 truncate">{summarize(entry)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-gray-600 text-center py-4">No events yet</div>
        )}
      </div>
    </div>
  );
}
