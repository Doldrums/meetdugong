import { useEffect, useRef } from 'react';
import { useLogStore } from '../../stores/logStore';
import type { LogEntry } from '@shared/types';

const TYPE_DOT_COLORS: Record<string, string> = {
  'status': '#8E8E93',
  'fsm.transition': '#007AFF',
  'fsm.manual': '#5AC8FA',
  'fsm.reset': '#FF9500',
  'playback.started': '#34C759',
  'playback.ended': '#30D158',
  'overlay.applied': '#AF52DE',
  'overlay.subtitle.set': '#BF5AF2',
  'overlay.subtitle.clear': '#BF5AF2',
  'overlay.card.show': '#BF5AF2',
  'overlay.card.hide': '#BF5AF2',
  'overlay.clearAll': '#BF5AF2',
  'overlay.qr.show': '#BF5AF2',
  'overlay.qr.hide': '#BF5AF2',
  'error': '#FF3B30',
};

const TYPE_COLORS: Record<string, string> = {
  'status': 'text-white/35',
  'fsm.transition': 'text-[#007AFF]',
  'fsm.manual': 'text-[#5AC8FA]',
  'fsm.reset': 'text-[#FF9500]',
  'playback.started': 'text-[#34C759]',
  'playback.ended': 'text-[#30D158]',
  'overlay.applied': 'text-[#AF52DE]',
  'overlay.subtitle.set': 'text-[#BF5AF2]',
  'overlay.subtitle.clear': 'text-[#BF5AF2]',
  'overlay.card.show': 'text-[#BF5AF2]',
  'overlay.card.hide': 'text-[#BF5AF2]',
  'overlay.clearAll': 'text-[#BF5AF2]',
  'overlay.qr.show': 'text-[#BF5AF2]',
  'overlay.qr.hide': 'text-[#BF5AF2]',
  'error': 'text-[#FF3B30]',
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
      {/* Section intro */}
      <div className="mb-2">
        <h3 className="section-header">Activity Log</h3>
        <p className="text-[11px] text-white/20 mt-1 leading-relaxed">
          Real-time stream of agent actions, scene transitions, and overlay commands dispatched through OpenClaw.
        </p>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30">
          {entries.length === 0 ? 'No events' : `${entries.length} event${entries.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-1 text-white/35 cursor-pointer hover:text-white/55 transition-colors">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          <button onClick={clear} className="text-white/30 hover:text-white/55 transition-colors">
            Clear
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
            className={`flex flex-wrap gap-x-2 gap-y-0.5 leading-relaxed px-2 py-1 rounded-lg transition-all hover:bg-white/[0.05] ${i !== 0 ? 'border-t border-white/[0.04]' : ''}`}
          >
            <span className="text-white/25 shrink-0">{formatTime(entry.timestamp)}</span>
            <span
              className="shrink-0 inline-block w-1.5 h-1.5 rounded-full mt-1.5"
              style={{ backgroundColor: TYPE_DOT_COLORS[entry.event.type] ?? '#8E8E93' }}
            />
            <span className={`shrink-0 font-semibold ${entry.direction === 'outbound' ? 'text-[#007AFF]' : 'text-[#5856D6]'}`}>
              {entry.direction === 'outbound' ? '↑' : '↓'}
            </span>
            <span className={`shrink-0 ${TYPE_COLORS[entry.event.type] ?? 'text-white/50'}`}>
              {entry.event.type}
            </span>
            <span className="text-white/40 break-all min-w-0">{summarize(entry)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-white/25 text-center py-8">
            <div>No events yet</div>
            <div className="text-[11px] text-white/15 mt-1">Trigger a state transition or send an overlay to see events here</div>
          </div>
        )}
      </div>
    </div>
  );
}
