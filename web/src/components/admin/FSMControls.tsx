import { useState, useCallback } from 'react';
import type { ControlEvent, FSMState } from '@shared/types';
import { useAppStore } from '../../stores/appStore';
import { useLogStore } from '../../stores/logStore';

interface FSMControlsProps {
  onSend: (event: ControlEvent) => void;
}

// Node order: clockwise from 12 o'clock
const NODE_ORDER: FSMState[] = [
  'IDLE', 'AWARE', 'GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW', 'GOODBYE',
];

interface StateStyle {
  emoji: string;
  color: string;
  fillBase: string;
  fillActive: string;
  strokeBase: string;
  strokeActive: string;
}

const STATE_CONFIG: Record<string, StateStyle> = {
  IDLE:    { emoji: '😴', color: '#6b7280', fillBase: 'rgba(107,114,128,0.15)', fillActive: 'rgba(107,114,128,0.30)', strokeBase: 'rgba(107,114,128,0.40)', strokeActive: 'rgba(107,114,128,0.80)' },
  AWARE:   { emoji: '👀', color: '#eab308', fillBase: 'rgba(234,179,8,0.15)',   fillActive: 'rgba(234,179,8,0.30)',   strokeBase: 'rgba(234,179,8,0.40)',   strokeActive: 'rgba(234,179,8,0.80)' },
  GREET:   { emoji: '👋', color: '#22c55e', fillBase: 'rgba(34,197,94,0.15)',   fillActive: 'rgba(34,197,94,0.30)',   strokeBase: 'rgba(34,197,94,0.40)',   strokeActive: 'rgba(34,197,94,0.80)' },
  LISTEN:  { emoji: '👂', color: '#3b82f6', fillBase: 'rgba(59,130,246,0.15)',  fillActive: 'rgba(59,130,246,0.30)',  strokeBase: 'rgba(59,130,246,0.40)',  strokeActive: 'rgba(59,130,246,0.80)' },
  THINK:   { emoji: '🧠', color: '#a855f7', fillBase: 'rgba(168,85,247,0.15)',  fillActive: 'rgba(168,85,247,0.30)',  strokeBase: 'rgba(168,85,247,0.40)',  strokeActive: 'rgba(168,85,247,0.80)' },
  SPEAK:   { emoji: '🗣️', color: '#6366f1', fillBase: 'rgba(99,102,241,0.15)',  fillActive: 'rgba(99,102,241,0.30)',  strokeBase: 'rgba(99,102,241,0.40)',  strokeActive: 'rgba(99,102,241,0.80)' },
  SHOW:    { emoji: '🎬', color: '#f97316', fillBase: 'rgba(249,115,22,0.15)',  fillActive: 'rgba(249,115,22,0.30)',  strokeBase: 'rgba(249,115,22,0.40)',  strokeActive: 'rgba(249,115,22,0.80)' },
  GOODBYE: { emoji: '🫡', color: '#ec4899', fillBase: 'rgba(236,72,153,0.15)',  fillActive: 'rgba(236,72,153,0.30)',  strokeBase: 'rgba(236,72,153,0.40)',  strokeActive: 'rgba(236,72,153,0.80)' },
};

const SHORTCUT_KEYS: Record<string, string> = {
  GREET: 'G',
  LISTEN: 'L',
  THINK: 'T',
  SPEAK: 'S',
};

const CX = 200;
const CY = 185;
const RADIUS = 140;
const NODE_R = 36;
const COUNT = 8;

function nodePosition(index: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / COUNT - Math.PI / 2;
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
  };
}

function transitionArc(fromIdx: number, toIdx: number): string {
  const { x: x1, y: y1 } = nodePosition(fromIdx);
  const { x: x2, y: y2 } = nodePosition(toIdx);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  let dx = mx - CX;
  let dy = my - CY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) {
    dx = -(y1 - CY);
    dy = x1 - CX;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    dx /= d2;
    dy /= d2;
  } else {
    dx /= dist;
    dy /= dist;
  }

  const bulge = RADIUS * 0.35;
  const cpx = mx + dx * bulge;
  const cpy = my + dy * bulge;

  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

function StateBadge({ state }: { state: FSMState | null }) {
  if (!state) return <span className="text-gray-500 font-mono text-xs">---</span>;
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border"
      style={{
        backgroundColor: config.fillActive,
        borderColor: config.strokeBase,
        color: config.color,
      }}
    >
      <span className="text-xs">{config.emoji}</span>
      {state}
    </span>
  );
}

export default function FSMControls({ onSend }: FSMControlsProps) {
  const currentState = useAppStore((s) => s.currentState);
  const previousState = useAppStore((s) => s.previousState);
  const pendingState = useAppStore((s) => s.pendingState);
  const setPendingState = useAppStore((s) => s.setPendingState);
  const currentClip = useAppStore((s) => s.currentClip);
  const queueLength = useAppStore((s) => s.queueLength);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const orchestratorOnline = useAppStore((s) => s.orchestratorOnline);
  const lastError = useAppStore((s) => s.lastError);

  const transitionCount = useLogStore(
    useCallback((s) => s.entries.filter((e) => e.event.type === 'fsm.transition').length, []),
  );

  const [hoveredState, setHoveredState] = useState<FSMState | null>(null);

  const handleClick = (state: FSMState) => {
    setPendingState(state);
    onSend({ type: 'fsm.manual', state });
  };

  const handleReset = () => {
    setPendingState('IDLE');
    onSend({ type: 'fsm.reset' });
  };

  // Transition arc indices
  const fromIdx = previousState ? NODE_ORDER.indexOf(previousState) : -1;
  const toIdx = NODE_ORDER.indexOf(currentState);
  const showArc = previousState !== null && previousState !== currentState && fromIdx >= 0 && toIdx >= 0;
  const arcPath = showArc ? transitionArc(fromIdx, toIdx) : '';

  const activeConfig = STATE_CONFIG[currentState] ?? STATE_CONFIG.IDLE;

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="section-header">State Machine</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${orchestratorOnline ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]'}`} />
          <span className="text-[10px] text-gray-400 font-mono">
            {orchestratorOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className="text-gray-600 text-[10px]">|</span>
          <span className={`inline-block w-2 h-2 rounded-full ${wsConnected ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'bg-gray-500'}`} />
          <span className="text-[10px] text-gray-400 font-mono">
            WS
          </span>
        </div>
      </div>

      {/* ── Debug Info Panel ── */}
      <div className="bg-glass-light border border-glass-border rounded-xl p-3 space-y-2">
        {/* Current / Previous / Pending row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Current</div>
            <StateBadge state={currentState} />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Previous</div>
            <StateBadge state={previousState} />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Pending</div>
            {pendingState && pendingState !== currentState
              ? <StateBadge state={pendingState} />
              : <span className="text-gray-600 font-mono text-[10px]">---</span>
            }
          </div>
        </div>

        {/* Transition arrow readout */}
        {previousState && previousState !== currentState && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono pt-1 border-t border-glass-border">
            <span className="text-gray-500">Last transition:</span>
            <span style={{ color: STATE_CONFIG[previousState]?.color }}>{previousState}</span>
            <span className="text-gray-600">-&gt;</span>
            <span style={{ color: activeConfig.color }}>{currentState}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono pt-1 border-t border-glass-border">
          <span title="Total transitions this session">
            transitions: <span className="text-gray-300">{transitionCount}</span>
          </span>
          <span className="text-gray-700">|</span>
          <span title="Clips queued">
            queue: <span className="text-gray-300">{queueLength}</span>
          </span>
          {currentClip && (
            <>
              <span className="text-gray-700">|</span>
              <span title="Currently playing clip" className="truncate max-w-[140px]">
                clip: <span className="text-gray-300">{currentClip.split('/').pop()}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {lastError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[11px] text-red-300 font-mono shadow-[0_0_12px_rgba(239,68,68,0.15)]">
          <span className="text-red-400 font-bold">ERR</span> {lastError}
        </div>
      )}

      {/* ── State Machine Graph ── */}
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-md mx-auto"
        style={{ filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.05))' }}
      >
        <defs>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.6)" />
          </marker>

          <linearGradient id="glass-highlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Initial state arrow (q₀ convention) */}
        {(() => {
          const { x, y } = nodePosition(0);
          const tipY = y - NODE_R;
          const startY = tipY - 30;
          return (
            <line
              x1={x} y1={startY}
              x2={x} y2={tipY}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })()}

        {/* Transition arc */}
        {showArc && (
          <g>
            <path
              d={arcPath}
              fill="none"
              stroke={activeConfig.color}
              strokeWidth="4"
              strokeOpacity="0.2"
              filter="url(#arc-glow)"
            />
            <path
              d={arcPath}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
            <circle r="4" fill={activeConfig.color}>
              <animateMotion
                dur="1.2s"
                repeatCount="indefinite"
                path={arcPath}
              />
              <animate
                attributeName="opacity"
                values="0.4;1;0.4"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Nodes */}
        {NODE_ORDER.map((state, i) => {
          const { x, y } = nodePosition(i);
          const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
          const isActive = currentState === state;
          const isPending = pendingState === state && !isActive;
          const isHovered = hoveredState === state;
          const shortcut = SHORTCUT_KEYS[state];

          const fill = isActive || isHovered ? config.fillActive : config.fillBase;
          const stroke = isActive || isHovered ? config.strokeActive : config.strokeBase;

          return (
            <g
              key={state}
              style={{ cursor: 'pointer' }}
              onClick={() => handleClick(state)}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
            >
              {isActive && (
                <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={config.color} strokeWidth="2" filter="url(#node-glow)">
                  <animate attributeName="r" values={`${NODE_R + 4};${NODE_R + 10};${NODE_R + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {isPending && (
                <circle
                  cx={x} cy={y}
                  r={NODE_R + 4}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.6"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${x} ${y}`}
                    to={`360 ${x} ${y}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              <circle
                cx={x} cy={y}
                r={NODE_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 2 : 1.5}
              />

              <circle
                cx={x} cy={y}
                r={NODE_R - 2}
                fill="url(#glass-highlight)"
                style={{ pointerEvents: 'none' }}
              />

              <text
                x={x} y={y - 5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="18"
                style={{ pointerEvents: 'none' }}
              >
                {config.emoji}
              </text>

              <text
                x={x} y={y + 14}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontWeight="bold"
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                {state}
              </text>

              {isActive && (
                <text
                  x={x} y={y + 24}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  fill="rgba(255,255,255,0.5)"
                  style={{ pointerEvents: 'none' }}
                >
                  ACTIVE
                </text>
              )}

              {shortcut && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={x + NODE_R - 16}
                    y={y - NODE_R - 2}
                    width="16"
                    height="14"
                    rx="3"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={x + NODE_R - 8}
                    y={y - NODE_R + 5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fill="rgba(156,163,175,1)"
                    fontFamily="monospace"
                  >
                    {shortcut}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Reset Button ── */}
      <button
        onClick={handleReset}
        className="relative w-full px-3 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 hover:scale-[1.02] active:scale-100 transition-all"
      >
        🔄 RESET
        <span className="absolute top-1.5 right-2 bg-glass-heavy border border-glass-border-mid text-[9px] text-gray-400 rounded px-1 leading-relaxed">
          R
        </span>
      </button>
    </div>
  );
}
