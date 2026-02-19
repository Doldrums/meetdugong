import type { ControlEvent } from '@shared/types';
import { useAppStore } from '../../stores/appStore';

interface SystemStatusProps {
  onSend: (event: ControlEvent) => void;
}

export default function SystemStatus({ onSend }: SystemStatusProps) {
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const queueLength = useAppStore((s) => s.queueLength);
  const lastError = useAppStore((s) => s.lastError);
  const activeCharacter = useAppStore((s) => s.activeCharacter);
  const characters = useAppStore((s) => s.characters);

  const handleCharacterSwitch = (characterId: string) => {
    onSend({ type: 'character.switch', characterId });
  };

  return (
    <div className="space-y-3">
      {/* ── Character Selection ── */}
      {characters.length > 1 && (
        <div>
          <h3 className="section-header">Active Character</h3>
          <p className="text-[11px] text-white/25 mt-1 mb-2 leading-relaxed">
            Select which character to control. Switching resets the FSM and clears overlays.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {characters.map((c) => {
              const isActive = c.id === activeCharacter;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCharacterSwitch(c.id)}
                  className={`relative flex flex-col items-start px-3 py-2.5 rounded-xl text-left border transition-all active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#007AFF]/15 border-[#007AFF]/40'
                      : 'bg-glass-light border-glass-border hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-[#007AFF]' : 'bg-white/10'}`} />
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-white/25 mt-0.5 ml-4">{c.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── System Health ── */}
      <div>
        <h3 className="section-header">System Health</h3>
        <p className="text-[11px] text-white/25 mt-1 leading-relaxed">
          Real-time connection status and agent runtime state. OpenClaw orchestrates tool routing, plan execution, and scene command dispatch.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <StatusBadge label="OpenClaw" value={orchestratorOnline ? 'Online' : 'Offline'} ok={orchestratorOnline} />
        <StatusBadge label="WebSocket" value={wsConnected ? 'Connected' : 'Disconnected'} ok={wsConnected} />
        <div className="sm:col-span-2 mt-1 mb-0.5">
          <span className="text-[10px] text-white/20 uppercase tracking-wider font-medium">Agent State</span>
        </div>
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
          <span className="text-white/40 text-xs">FSM State</span>
          <span className="font-mono font-bold text-white">{currentState}</span>
        </div>
        <div className="sm:col-span-2 flex justify-between items-center bg-glass-light border border-glass-border rounded-xl px-3 py-2.5">
          <span className="text-white/40 text-xs">Clip</span>
          <span className="font-mono text-white/70 truncate ml-2 max-w-48 text-xs">
            {currentClip ? currentClip.split('/').pop() : '—'}
          </span>
        </div>
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
