import { useAppStore } from '../../stores/appStore';

export default function DebugHUD() {
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);

  return (
    <div
      className="absolute top-3 left-3 text-xs font-mono p-3 rounded-2xl space-y-0.5"
      style={{
        zIndex: 20,
        background: `linear-gradient(
          135deg,
          rgba(0, 0, 0, 0.45) 0%,
          rgba(0, 0, 0, 0.30) 50%,
          rgba(0, 0, 0, 0.40) 100%
        )`,
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 4px 16px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
      }}
    >
      <div>
        <span className="text-white/35">STATE:</span>{' '}
        <span className="text-[#64D2FF] font-bold">{currentState}</span>
      </div>
      <div>
        <span className="text-white/35">CLIP:</span>{' '}
        <span className="text-[#30D158]">{currentClip?.split('/').pop() ?? '—'}</span>
      </div>
      <div>
        <span className="text-white/35">WS:</span>{' '}
        <span className={wsConnected ? 'text-[#30D158]' : 'text-[#FF453A]'}>
          {wsConnected ? 'connected' : 'disconnected'}
        </span>
      </div>
      <div>
        <span className="text-white/35">ORCH:</span>{' '}
        <span className={orchestratorOnline ? 'text-[#30D158]' : 'text-[#FF453A]'}>
          {orchestratorOnline ? 'online' : 'offline'}
        </span>
      </div>
    </div>
  );
}
