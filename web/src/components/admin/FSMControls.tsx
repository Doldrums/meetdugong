import { useState, useCallback, useEffect } from 'react';
import type { ClipManifest, ControlEvent, FSMState } from '@shared/types';
import { useAppStore } from '../../stores/appStore';
import { useLogStore } from '../../stores/logStore';

// All FSM state names in lowercase for matching
const FSM_STATES_LIST: FSMState[] = ['IDLE', 'AWARE', 'GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW', 'GOODBYE'];

/** Find which FSM state a bridge field (e.g. "show_right") or action prefix belongs to */
function matchFSMState(value: string): FSMState | null {
  const lower = value.toLowerCase();
  for (const state of FSM_STATES_LIST) {
    if (lower === state.toLowerCase() || lower.startsWith(state.toLowerCase() + '_')) {
      return state;
    }
  }
  return null;
}

function deriveSupportedStates(manifest: ClipManifest): Set<FSMState> {
  const supported = new Set<FSMState>();

  // IDLE is always supported if idle_loops exist
  if (manifest.idle_loops.length > 0) supported.add('IDLE');

  // States mentioned as from/to in bridge clips (e.g. "show_right" → SHOW)
  for (const bridge of manifest.bridges) {
    const fromState = matchFSMState(bridge.from);
    const toState = matchFSMState(bridge.to);
    if (fromState) supported.add(fromState);
    if (toState) supported.add(toState);
  }

  // States matching action clip filename prefix (e.g. listen_0.mp4 → LISTEN)
  for (const clip of manifest.actions) {
    const name = clip.filename.replace(/\.(mp4|webm)$/, '');
    // Take the part before the first underscore-digit sequence
    const prefix = name.split('_')[0];
    const state = matchFSMState(prefix);
    if (state) supported.add(state);
  }

  return supported;
}

function deriveClipCounts(manifest: ClipManifest): Map<FSMState, number> {
  const counts = new Map<FSMState, number>();

  // IDLE gets count of idle loops
  if (manifest.idle_loops.length > 0) {
    counts.set('IDLE', manifest.idle_loops.length);
  }

  // Action clips: prefix before first underscore-digit → state
  for (const clip of manifest.actions) {
    const name = clip.filename.replace(/\.(mp4|webm)$/, '');
    const prefix = name.split('_')[0];
    const state = matchFSMState(prefix);
    if (state) {
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
  }

  // Bridge clips count toward both from and to states
  for (const bridge of manifest.bridges) {
    const fromState = matchFSMState(bridge.from);
    const toState = matchFSMState(bridge.to);
    if (fromState) counts.set(fromState, (counts.get(fromState) ?? 0) + 1);
    if (toState) counts.set(toState, (counts.get(toState) ?? 0) + 1);
  }

  return counts;
}

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

// Layout constants
const CX = 200;
const CY_FALLBACK = 185;
const RADIUS_FALLBACK = 140;
const NODE_R_SUPPORTED = 42;
const NODE_R_UNSUPPORTED = 22;
const COUNT = 8;

// Top zone: supported states arranged on an ellipse
const TOP_CY = 175;
const TOP_RX = 115;
const TOP_RY = 90;

function supportedPositions(n: number): { x: number; y: number }[] {
  if (n === 0) return [];
  if (n === 1) return [{ x: CX, y: TOP_CY }];
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: Math.round(CX + TOP_RX * Math.cos(angle)),
      y: Math.round(TOP_CY + TOP_RY * Math.sin(angle)),
    };
  });
}

// Bottom row Y for unsupported states
const BOTTOM_ROW_Y = 390;

function fallbackPosition(index: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / COUNT - Math.PI / 2;
  return {
    x: CX + RADIUS_FALLBACK * Math.cos(angle),
    y: CY_FALLBACK + RADIUS_FALLBACK * Math.sin(angle),
  };
}

function transitionArcFromPoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const cx = 200;

  let dx = mx - cx;
  let dy = my - (from.y + to.y) / 2;
  // Use perpendicular for midpoint offset
  const pmx = mx - cx;
  const pmy = my - 200;
  const dist = Math.sqrt(pmx * pmx + pmy * pmy);

  if (dist < 1) {
    dx = -(from.y - to.y);
    dy = from.x - to.x;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    dx /= d2;
    dy /= d2;
  } else {
    dx = pmx / dist;
    dy = pmy / dist;
  }

  const bulge = 40;
  const cpx = mx + dx * bulge;
  const cpy = my + dy * bulge;

  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;
}

/** Self-loop path (right side of node) — classic CS automaton arrow from state to itself */
function selfLoopPath(x: number, y: number, r: number): string {
  const bulge = r * 0.7;
  return `M ${x + r} ${y - 8} C ${x + r + bulge} ${y - 22}, ${x + r + bulge} ${y + 22}, ${x + r} ${y + 8}`;
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
  const clipPlaying = useAppStore((s) => s.clipPlaying);
  const playerTransitionActive = useAppStore((s) => s.playerTransitionActive);
  const playerPendingClip = useAppStore((s) => s.playerPendingClip);
  const playerQueueItems = useAppStore((s) => s.playerQueueItems);

  const transitionCount = useLogStore(
    useCallback((s) => s.entries.filter((e) => e.event.type === 'fsm.transition').length, []),
  );

  const [hoveredState, setHoveredState] = useState<FSMState | null>(null);
  const [supportedStates, setSupportedStates] = useState<Set<FSMState> | null>(null);
  const [clipCounts, setClipCounts] = useState<Map<FSMState, number>>(new Map());

  useEffect(() => {
    fetch('/manifest')
      .then((r) => r.json())
      .then((m: ClipManifest) => {
        setSupportedStates(deriveSupportedStates(m));
        setClipCounts(deriveClipCounts(m));
      })
      .catch(() => {/* manifest unavailable — treat all as supported */});
  }, []);

  const handleClick = (state: FSMState) => {
    setPendingState(state);
    onSend({ type: 'fsm.manual', state });
  };

  const handleReset = () => {
    setPendingState('IDLE');
    onSend({ type: 'fsm.reset' });
  };

  const handleClearQueue = () => {
    onSend({ type: 'queue.clear' });
  };

  // Build map: state → queue positions (1-based) for SVG badges
  const queuePositions = new Map<string, number[]>();
  playerQueueItems.forEach((item, i) => {
    const s = item.targetState;
    if (!queuePositions.has(s)) queuePositions.set(s, []);
    queuePositions.get(s)!.push(i + 1);
  });

  const activeConfig = STATE_CONFIG[currentState] ?? STATE_CONFIG.IDLE;

  // Compute node positions: two-zone layout when manifest loaded, fallback to circular
  const manifestLoaded = supportedStates !== null;
  const supportedList = manifestLoaded
    ? NODE_ORDER.filter((s) => supportedStates.has(s))
    : [];
  const unsupportedList = manifestLoaded
    ? NODE_ORDER.filter((s) => !supportedStates.has(s))
    : [];

  const nodePositions = new Map<FSMState, { x: number; y: number }>();
  const nodeRadii = new Map<FSMState, number>();

  if (manifestLoaded) {
    // Supported states arranged on ellipse
    const positions = supportedPositions(supportedList.length);
    supportedList.forEach((state, i) => {
      nodePositions.set(state, positions[i]);
      nodeRadii.set(state, NODE_R_SUPPORTED);
    });
    // Unsupported states in bottom row
    const count = unsupportedList.length;
    const totalWidth = 320;
    const startX = CX - totalWidth / 2;
    unsupportedList.forEach((state, i) => {
      const x = count === 1 ? CX : startX + (totalWidth / (count - 1)) * i;
      nodePositions.set(state, { x, y: BOTTOM_ROW_Y });
      nodeRadii.set(state, NODE_R_UNSUPPORTED);
    });
  } else {
    // Fallback: circular layout
    NODE_ORDER.forEach((state, i) => {
      nodePositions.set(state, fallbackPosition(i));
      nodeRadii.set(state, NODE_R_SUPPORTED);
    });
  }

  // Transition arc
  const fromPos = previousState ? nodePositions.get(previousState) : undefined;
  const toPos = nodePositions.get(currentState);
  const showArc = previousState !== null && previousState !== currentState && fromPos && toPos;
  const arcPath = showArc ? transitionArcFromPoints(fromPos, toPos) : '';

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

      {/* ── Player Queue ── */}
      <div className="bg-glass-light border border-glass-border rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-gray-500">Player Queue</span>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              playerTransitionActive
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15'
            }`}
          >
            {playerTransitionActive ? 'TRANSITION' : 'IDLE'}
          </span>
        </div>
        {playerPendingClip && (
          <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
            <span className="text-amber-400/70">pending:</span>
            <span className="text-gray-300 truncate">{playerPendingClip.split('/').pop()}</span>
          </div>
        )}
        {playerQueueItems.length > 0 ? (
          <div className="space-y-1">
            {playerQueueItems.map((item, i) => (
              <div key={i} className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <span className="text-gray-600">[{i}]</span>
                {item.bridge && (
                  <>
                    <span className="text-cyan-400/70">bridge:</span>
                    <span className="text-gray-300 truncate max-w-[100px]">{item.bridge.split('/').pop()}</span>
                  </>
                )}
                {item.bridge && item.target && <span className="text-gray-600">→</span>}
                {item.target && (
                  <>
                    <span className="text-purple-400/70">target:</span>
                    <span className="text-gray-300 truncate max-w-[100px]">{item.target.split('/').pop()}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] font-mono text-gray-600">
            {playerTransitionActive ? 'queue empty — transition playing' : 'queue empty — looping'}
          </div>
        )}
      </div>

      {/* ── Error Banner ── */}
      {lastError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[11px] text-red-300 font-mono shadow-[0_0_12px_rgba(239,68,68,0.15)]">
          <span className="text-red-400 font-bold">ERR</span> {lastError}
        </div>
      )}

      {/* ── State Machine Graph + Action Buttons ── */}
      <div className="flex gap-1.5 items-start">
      <svg
        viewBox="0 0 400 440"
        className="w-[60%]"
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

          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" floodOpacity="0.4" />
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

        {/* Initial state arrow (q₀ convention) — points to IDLE */}
        {(() => {
          const idlePos = nodePositions.get('IDLE');
          if (!idlePos) return null;
          const r = nodeRadii.get('IDLE') ?? NODE_R_SUPPORTED;
          const tipY = idlePos.y - r;
          const startY = tipY - 30;
          return (
            <line
              x1={idlePos.x} y1={startY}
              x2={idlePos.x} y2={tipY}
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

        {/* Zone divider */}
        {manifestLoaded && unsupportedList.length > 0 && (
          <g>
            <line
              x1="40" y1="340"
              x2="360" y2="340"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="200" y="352"
              textAnchor="middle"
              fontSize="7"
              fontFamily="monospace"
              fill="rgba(255,255,255,0.15)"
              style={{ pointerEvents: 'none' }}
            >
              MISSING CONTENT
            </text>
          </g>
        )}

        {/* Supported Nodes */}
        {(manifestLoaded ? supportedList : NODE_ORDER).map((state) => {
          const pos = nodePositions.get(state);
          if (!pos) return null;
          const { x, y } = pos;
          const r = nodeRadii.get(state) ?? NODE_R_SUPPORTED;
          const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
          const isActive = currentState === state;
          const isPending = pendingState === state && !isActive;
          const isHovered = hoveredState === state;
          const shortcut = SHORTCUT_KEYS[state];
          const count = clipCounts.get(state) ?? 0;

          const fill = isActive || isHovered ? config.fillActive : config.fillBase;
          const stroke = isActive || isHovered ? config.strokeActive : config.strokeBase;

          return (
            <g
              key={state}
              style={{ cursor: 'pointer' }}
              filter="url(#node-shadow)"
              onClick={() => handleClick(state)}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
            >
              {/* Double-ring outer glow for glass depth */}
              <circle
                cx={x} cy={y}
                r={r + 2}
                fill="none"
                stroke={config.strokeBase}
                strokeWidth="1"
                strokeOpacity="0.15"
              />

              {isActive && (
                <circle cx={x} cy={y} r={r + 6} fill="none" stroke={config.color} strokeWidth="2" filter="url(#node-glow)">
                  <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {isPending && (
                <circle
                  cx={x} cy={y}
                  r={r + 4}
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
                r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 2 : 1.5}
              />

              <circle
                cx={x} cy={y}
                r={r - 2}
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
                  {clipPlaying ? 'PLAYING' : 'ACTIVE'}
                </text>
              )}

              {/* Self-loop arrow (CS automaton: state → itself) */}
              {isActive && (() => {
                const loopPath = selfLoopPath(x, y, r);
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <path
                      d={loopPath}
                      fill="none"
                      stroke={config.color}
                      strokeWidth="1.5"
                      strokeOpacity={clipPlaying ? 0.6 : 0.25}
                      markerEnd="url(#arrowhead)"
                    />
                    {clipPlaying && (
                      <circle r="3" fill={config.color} opacity="0.9">
                        <animateMotion
                          dur="1.5s"
                          repeatCount="indefinite"
                          path={loopPath}
                        />
                        <animate
                          attributeName="opacity"
                          values="0.4;1;0.4"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })()}

              {/* Progress spinner ring while playing */}
              {isActive && clipPlaying && (
                <circle
                  cx={x} cy={y}
                  r={r + 3}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="1.5"
                  strokeDasharray={`${(r + 3) * 0.8} ${(r + 3) * 5.5}`}
                  strokeLinecap="round"
                  opacity="0.5"
                  style={{ pointerEvents: 'none' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${x} ${y}`}
                    to={`360 ${x} ${y}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Clip count badge */}
              {count > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={x - r + 2}
                    y={y - r - 11}
                    width={count >= 10 ? 28 : 22}
                    height="14"
                    rx="7"
                    fill={config.fillActive}
                    stroke={config.strokeBase}
                    strokeWidth="0.5"
                  />
                  <text
                    x={x - r + (count >= 10 ? 16 : 13)}
                    y={y - r - 4}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill={config.color}
                  >
                    ×{count}
                  </text>
                </g>
              )}

              {/* Keyboard shortcut badge */}
              {shortcut && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={x + r - 16}
                    y={y - r - 2}
                    width="16"
                    height="14"
                    rx="3"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={x + r - 8}
                    y={y - r + 5}
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

              {/* Queue position badge */}
              {queuePositions.has(state) && (() => {
                const positions = queuePositions.get(state)!;
                const label = positions.join(',');
                const badgeW = label.length * 6 + 10;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={x + r - badgeW + 4}
                      y={y + r - 8}
                      width={badgeW}
                      height="14"
                      rx="7"
                      fill="rgba(234,179,8,0.25)"
                      stroke="rgba(234,179,8,0.5)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x + r - badgeW / 2 + 4}
                      y={y + r - 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="rgba(234,179,8,0.9)"
                    >
                      Q{label}
                    </text>
                  </g>
                );
              })()}

              {/* Hover tooltip */}
              {isHovered && count > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={x - 40}
                    y={y + r + 6}
                    width="80"
                    height="16"
                    rx="4"
                    fill="rgba(0,0,0,0.6)"
                    stroke={config.strokeBase}
                    strokeWidth="0.5"
                  />
                  <text
                    x={x}
                    y={y + r + 14}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="7"
                    fontFamily="monospace"
                    fill="rgba(255,255,255,0.8)"
                  >
                    {count} clips available
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Unsupported Nodes (only when manifest loaded) */}
        {manifestLoaded && unsupportedList.map((state) => {
          const pos = nodePositions.get(state);
          if (!pos) return null;
          const { x, y } = pos;
          const r = NODE_R_UNSUPPORTED;
          const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
          const isActive = currentState === state;
          const isPending = pendingState === state && !isActive;

          return (
            <g
              key={state}
              style={{ cursor: 'pointer' }}
              onClick={() => handleClick(state)}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
            >
              {isActive && (
                <circle cx={x} cy={y} r={r + 4} fill="none" stroke={config.color} strokeWidth="1.5" filter="url(#node-glow)">
                  <animate attributeName="r" values={`${r + 3};${r + 7};${r + 3}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {isPending && (
                <circle
                  cx={x} cy={y}
                  r={r + 3}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.5"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${x} ${y}`}
                    to={`360 ${x} ${y}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              <circle
                cx={x} cy={y}
                r={r}
                fill="rgba(75,85,99,0.10)"
                stroke="rgba(75,85,99,0.25)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              <text
                x={x} y={y - 3}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                style={{ pointerEvents: 'none', opacity: 0.2 }}
              >
                {config.emoji}
              </text>

              <text
                x={x} y={y + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7"
                fill="rgba(255,255,255,0.35)"
                style={{ pointerEvents: 'none' }}
              >
                {state}
              </text>

              {isActive ? (
                <text
                  x={x} y={y + 19}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="6"
                  fill="rgba(255,255,255,0.5)"
                  style={{ pointerEvents: 'none' }}
                >
                  ACTIVE
                </text>
              ) : (
                <text
                  x={x} y={y + 19}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="6"
                  fill="rgba(255,255,255,0.2)"
                  style={{ pointerEvents: 'none' }}
                >
                  no clips
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Controls Panel (right of graph) ── */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Now playing */}
        <div className="bg-glass-light border border-glass-border rounded-lg px-2.5 py-2">
          <div className="text-[8px] uppercase tracking-wider text-gray-500 mb-1">Now Playing</div>
          <div className="flex items-center gap-1.5">
            {clipPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)] animate-pulse" />
            )}
            <span className="text-[10px] font-mono text-gray-300 truncate">
              {currentClip ? currentClip.split('/').pop() : '---'}
            </span>
          </div>
        </div>

        {/* Quick state buttons */}
        <div className="bg-glass-light border border-glass-border rounded-lg px-2.5 py-2">
          <div className="text-[8px] uppercase tracking-wider text-gray-500 mb-1.5">Quick Transition</div>
          <div className="grid grid-cols-2 gap-1">
            {(['GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW'] as FSMState[]).map((state) => {
              const cfg = STATE_CONFIG[state];
              const key = SHORTCUT_KEYS[state];
              const isActive = currentState === state;
              const qPos = queuePositions.get(state);
              return (
                <button
                  key={state}
                  onClick={() => handleClick(state)}
                  className="relative flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-bold border transition-all hover:scale-[1.03] active:scale-100"
                  style={{
                    backgroundColor: isActive ? cfg.fillActive : cfg.fillBase,
                    borderColor: isActive ? cfg.strokeActive : cfg.strokeBase,
                    color: cfg.color,
                  }}
                >
                  <span className="text-[10px]">{cfg.emoji}</span>
                  <span className="truncate">{state}</span>
                  {key && (
                    <span className="ml-auto text-[7px] text-gray-500 font-mono bg-black/20 rounded px-0.5">{key}</span>
                  )}
                  {qPos && (
                    <span className="absolute -top-1 -right-1 bg-amber-500/80 text-black text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                      {qPos[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleReset}
            className="w-full px-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Reset</span>
            <span className="bg-glass-heavy border border-glass-border-mid text-[8px] text-gray-400 rounded px-1 font-mono font-normal">R</span>
          </button>
          <button
            onClick={handleClearQueue}
            disabled={playerQueueItems.length === 0 && !playerTransitionActive}
            className="w-full px-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500/25 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span>Clear Queue</span>
            {(playerQueueItems.length > 0 || playerTransitionActive) && (
              <span className="bg-amber-500/20 text-amber-400 text-[9px] font-mono rounded-full px-1.5 min-w-[16px] text-center">
                {playerQueueItems.length + (playerTransitionActive ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
