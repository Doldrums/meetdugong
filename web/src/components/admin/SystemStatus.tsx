import { useAppStore } from '../../stores/appStore';

export default function SystemStatus() {
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const queueLength = useAppStore((s) => s.queueLength);
  const lastError = useAppStore((s) => s.lastError);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">System Status</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <StatusBadge
          label="Orchestrator"
          value={orchestratorOnline ? 'Online' : 'Offline'}
          ok={orchestratorOnline}
        />
        <StatusBadge
          label="WebSocket"
          value={wsConnected ? 'Connected' : 'Disconnected'}
          ok={wsConnected}
        />
        <div className="col-span-2 flex justify-between bg-gray-800 rounded px-3 py-1.5">
          <span className="text-gray-400">FSM State</span>
          <span className="font-mono font-bold text-white">{currentState}</span>
        </div>
        <div className="col-span-2 flex justify-between bg-gray-800 rounded px-3 py-1.5">
          <span className="text-gray-400">Clip</span>
          <span className="font-mono text-gray-300 truncate ml-2 max-w-48">
            {currentClip ? currentClip.split('/').pop() : '—'}
          </span>
        </div>
        <div className="flex justify-between bg-gray-800 rounded px-3 py-1.5">
          <span className="text-gray-400">Queue</span>
          <span className="text-gray-300">{queueLength}</span>
        </div>
        {lastError && (
          <div className="col-span-2 bg-red-900/50 text-red-300 rounded px-3 py-1.5 text-xs">
            {lastError}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex justify-between items-center bg-gray-800 rounded px-3 py-1.5">
      <span className="text-gray-400">{label}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
        />
        <span className={ok ? 'text-green-300' : 'text-red-300'}>{value}</span>
      </span>
    </div>
  );
}
