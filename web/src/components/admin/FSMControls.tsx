import type { ControlEvent, FSMState } from '@shared/types';
import { FSM_STATES } from '@shared/constants';
import { useAppStore } from '../../stores/appStore';

interface FSMControlsProps {
  onSend: (event: ControlEvent) => void;
}

const STATE_COLORS: Record<string, string> = {
  IDLE: 'bg-gray-600 hover:bg-gray-500',
  AWARE: 'bg-yellow-700 hover:bg-yellow-600',
  GREET: 'bg-green-700 hover:bg-green-600',
  LISTEN: 'bg-blue-700 hover:bg-blue-600',
  THINK: 'bg-purple-700 hover:bg-purple-600',
  SPEAK: 'bg-indigo-700 hover:bg-indigo-600',
  SHOW: 'bg-orange-700 hover:bg-orange-600',
  GOODBYE: 'bg-pink-700 hover:bg-pink-600',
};

const ACTIVE_RING = 'ring-2 ring-white ring-offset-1 ring-offset-gray-900';
const PENDING_RING = 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-gray-900 animate-pulse';

export default function FSMControls({ onSend }: FSMControlsProps) {
  const currentState = useAppStore((s) => s.currentState);
  const pendingState = useAppStore((s) => s.pendingState);
  const setPendingState = useAppStore((s) => s.setPendingState);

  const handleClick = (state: FSMState) => {
    setPendingState(state);
    onSend({ type: 'fsm.manual', state });
  };

  const handleReset = () => {
    setPendingState('IDLE');
    onSend({ type: 'fsm.reset' });
  };

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">FSM Controls</h2>
      <div className="grid grid-cols-4 gap-2">
        {FSM_STATES.map((state) => {
          const isActive = currentState === state;
          const isPending = pendingState === state && !isActive;
          const base = STATE_COLORS[state] ?? 'bg-gray-600 hover:bg-gray-500';
          const ring = isActive ? ACTIVE_RING : isPending ? PENDING_RING : '';

          return (
            <button
              key={state}
              onClick={() => handleClick(state)}
              className={`px-2 py-2 rounded text-xs font-bold text-white transition-all ${base} ${ring}`}
            >
              {state}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleReset}
        className="w-full px-3 py-2 rounded text-sm font-bold text-white bg-red-700 hover:bg-red-600 transition-colors"
      >
        RESET
      </button>
    </div>
  );
}
