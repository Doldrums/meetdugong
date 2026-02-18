import { useAppStore } from '../../stores/appStore';

export default function SystemStatus() {
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const queueLength = useAppStore((s) => s.queueLength);
  const lastError = useAppStore((s) => s.lastError);

  return (
    <div className="space-y-3">
      {/* Section intro */}
      <div>
        <h3 className="section-header">System Health</h3>
        <p className="text-[11px] text-white/25 mt-1 leading-relaxed">
          Real-time connection status and agent runtime state. OpenClaw orchestrates tool routing, plan execution, and scene command dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <StatusBadge
          label="OpenClaw"
          value={orchestratorOnline ? 'Online' : 'Offline'}
          ok={orchestratorOnline}
        />
        <StatusBadge
          label="WebSocket"
          value={wsConnected ? 'Connected' : 'Disconnected'}
          ok={wsConnected}
        />
        {/* Agent state */}
        <div className="sm:col-span-2 mt-1 mb-0.5">
          <span className="text-[10px] text-white/20 uppercase tracking-wider font-medium">Agent State</span>
        </div>
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
          <span className="text-white/40 text-xs">FSM State</span>
          <span className="font-mono font-bold text-white">
            {currentState}
          </span>
        </div>
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
          <span className="text-white/40 text-xs">Clip</span>
          <span className="font-mono text-white/70 truncate ml-2 max-w-48 text-xs">
            {currentClip ? currentClip.split('/').pop() : '—'}
          </span>
        </div>
        {/* Playback */}
        <div className="sm:col-span-2 mt-1 mb-0.5">
          <span className="text-[10px] text-white/20 uppercase tracking-wider font-medium">Playback</span>
        </div>
        <div className="flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
          <span className="text-white/40 text-xs">Queue</span>
          <span className="text-white/70 font-mono text-xs">{queueLength}</span>
        </div>
        {lastError && (
          <div className="sm:col-span-2 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF6961] rounded-xl px-3 py-2.5 text-xs flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
            <span className="truncate">{lastError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
      <span className="text-white/40 text-xs">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block ${ok ? 'status-dot-ok' : 'status-dot-err'}`} />
        <span className={`text-xs ${ok ? 'text-[#34C759]' : 'text-[#FF6961]'}`}>{value}</span>
      </span>
    </div>
  );
}
