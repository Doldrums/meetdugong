import { useEffect, useRef } from 'react';
import { useLogStore } from '../../stores/logStore';
import type { LogEntry } from '@shared/types';

const TYPE_EMOJI: Record<string, string> = {
  'status': '📊',
  'fsm.transition': '🔀',
  'fsm.manual': '🎯',
  'fsm.reset': '🔄',
  'playback.started': '▶️',
  'playback.ended': '⏹️',
  'overlay.applied': '🎨',
  'overlay.subtitle.set': '💬',
  'overlay.subtitle.clear': '🧹',
  'overlay.card.show': '🃏',
  'overlay.card.hide': '🙈',
  'overlay.clearAll': '💥',
  'overlay.qr.show': '📱',
  'overlay.qr.hide': '🙈',
  'error': '🚨',
};

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
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {entries.length === 0 ? '🕳️ empty' : `${entries.length} event${entries.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-1 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            📌 Auto-scroll
          </label>
          <button onClick={clear} className="text-gray-500 hover:text-gray-300 transition-colors">
            🗑️ Clear
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto glass-scroll bg-black/20 border border-glass-border rounded-xl p-2 font-mono text-xs"
      >
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex flex-wrap gap-x-2 gap-y-0.5 leading-relaxed px-2 py-1 rounded-lg transition-all hover:bg-white/[0.07] hover:shadow-[inset_0_0_12px_oklch(1_0_0_/_3%)] ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
          >
            <span className="text-gray-600 shrink-0">{formatTime(entry.timestamp)}</span>
            <span className="shrink-0 text-[10px]">{TYPE_EMOJI[entry.event.type] ?? '❓'}</span>
            <span className={`shrink-0 font-semibold ${entry.direction === 'outbound' ? 'text-accent-cyan' : 'text-accent-blue'}`}>
              {entry.direction === 'outbound' ? '⬆' : '⬇'}
            </span>
            <span className={`shrink-0 ${TYPE_COLORS[entry.event.type] ?? 'text-gray-300'}`}>
              {entry.event.type}
            </span>
            <span className="text-gray-400 break-all min-w-0">{summarize(entry)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-gray-600 text-center py-8 space-y-1">
            <div className="text-2xl" style={{ animation: 'float 3s ease-in-out infinite' }}>👻</div>
            <div>No events yet — trigger something!</div>
          </div>
        )}
      </div>
    </div>
  );
}
