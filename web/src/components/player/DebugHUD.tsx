import { useAppStore } from '../../stores/appStore';

export default function DebugHUD() {
  const currentState = useAppStore((s) => s.currentState);
  const currentClip = useAppStore((s) => s.currentClip);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);

  return (
    <div
      className="absolute top-2 left-2 bg-black/80 text-white text-xs font-mono p-2 rounded space-y-0.5"
      style={{ zIndex: 20 }}
    >
      <div>
        <span className="text-gray-400">STATE:</span>{' '}
        <span className="text-cyan-400 font-bold">{currentState}</span>
      </div>
      <div>
        <span className="text-gray-400">CLIP:</span>{' '}
        <span className="text-green-400">{currentClip?.split('/').pop() ?? '—'}</span>
      </div>
      <div>
        <span className="text-gray-400">WS:</span>{' '}
        <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
          {wsConnected ? 'connected' : 'disconnected'}
        </span>
      </div>
      <div>
        <span className="text-gray-400">ORCH:</span>{' '}
        <span className={orchestratorOnline ? 'text-green-400' : 'text-red-400'}>
          {orchestratorOnline ? 'online' : 'offline'}
        </span>
      </div>
    </div>
  );
}
