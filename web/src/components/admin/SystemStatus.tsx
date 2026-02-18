import { useAppStore } from '../../stores/appStore';

const STATE_EMOJI: Record<string, string> = {
  IDLE: '😴',
  AWARE: '👀',
  GREET: '👋',
  LISTEN: '👂',
  THINK: '🧠',
  SPEAK: '🗣️',
  SHOW: '🎬',
  GOODBYE: '👋',
};

export default function SystemStatus() {
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const queueLength = useAppStore((s) => s.queueLength);
  const lastError = useAppStore((s) => s.lastError);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <StatusBadge
          label="🖥️ Orchestrator"
          value={orchestratorOnline ? 'Online' : 'Offline'}
          ok={orchestratorOnline}
        />
        <StatusBadge
          label="🔌 WebSocket"
          value={wsConnected ? 'Connected' : 'Disconnected'}
          ok={wsConnected}
        />
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2 shadow-glass-inset">
          <span className="text-gray-400">🎯 FSM State</span>
          <span className="font-mono font-bold text-white flex items-center gap-1.5">
            <span>{STATE_EMOJI[currentState] ?? '❓'}</span>
            <span>{currentState}</span>
          </span>
        </div>
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2 shadow-glass-inset">
          <span className="text-gray-400">🎞️ Clip</span>
          <span className="font-mono text-gray-300 truncate ml-2 max-w-48">
            {currentClip ? currentClip.split('/').pop() : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2 shadow-glass-inset">
          <span className="text-gray-400">📦 Queue</span>
          <span className="text-gray-300 font-mono">{queueLength}</span>
        </div>
        {lastError && (
          <div className="sm:col-span-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-3 py-2 text-xs shadow-glow-red flex items-center gap-2">
            <span className="text-sm">🚨</span>
            <span className="truncate">{lastError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2 shadow-glass-inset">
      <span className="text-gray-400">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block ${ok ? 'status-dot-ok' : 'status-dot-err'}`} />
        <span className={ok ? 'text-green-300' : 'text-red-300'}>{value}</span>
      </span>
    </div>
  );
}
