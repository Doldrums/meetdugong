import { useState, useCallback, useEffect } from 'react';
import type { ClipManifest, ControlEvent, FSMState } from '@shared/types';
import { useAppStore } from '../../stores/appStore';
import { useLogStore } from '../../stores/logStore';

const FSM_STATES_LIST: FSMState[] = ['IDLE', 'AWARE', 'GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW', 'GOODBYE'];

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
  if (manifest.idle_loops.length > 0) supported.add('IDLE');
  for (const bridge of manifest.bridges) {
    const fromState = matchFSMState(bridge.from);
    const toState = matchFSMState(bridge.to);
    if (fromState) supported.add(fromState);
    if (toState) supported.add(toState);
  }
  for (const clip of manifest.actions) {
    const name = clip.filename.replace(/\.(mp4|webm)$/, '');
    const prefix = name.split('_')[0];
    const state = matchFSMState(prefix);
    if (state) supported.add(state);
  }
  return supported;
}

function deriveClipCounts(manifest: ClipManifest): Map<FSMState, number> {
  const counts = new Map<FSMState, number>();
  if (manifest.idle_loops.length > 0) counts.set('IDLE', manifest.idle_loops.length);
  for (const clip of manifest.actions) {
    const name = clip.filename.replace(/\.(mp4|webm)$/, '');
    const prefix = name.split('_')[0];
    const state = matchFSMState(prefix);
    if (state) counts.set(state, (counts.get(state) ?? 0) + 1);
  }
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

const NODE_ORDER: FSMState[] = [
  'IDLE', 'AWARE', 'GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW', 'GOODBYE',
];

interface StateStyle {
  label: string;
  color: string;
  fillBase: string;
  fillActive: string;
  strokeBase: string;
  strokeActive: string;
}

const STATE_CONFIG: Record<string, StateStyle> = {
  IDLE:    { label: 'Idle',    color: '#8E8E93', fillBase: 'rgba(142,142,147,0.08)', fillActive: 'rgba(142,142,147,0.20)', strokeBase: 'rgba(142,142,147,0.22)', strokeActive: 'rgba(142,142,147,0.55)' },
  AWARE:   { label: 'Aware',   color: '#FF9500', fillBase: 'rgba(255,149,0,0.08)',   fillActive: 'rgba(255,149,0,0.20)',   strokeBase: 'rgba(255,149,0,0.22)',   strokeActive: 'rgba(255,149,0,0.55)' },
  GREET:   { label: 'Greet',   color: '#34C759', fillBase: 'rgba(52,199,89,0.08)',   fillActive: 'rgba(52,199,89,0.20)',   strokeBase: 'rgba(52,199,89,0.22)',   strokeActive: 'rgba(52,199,89,0.55)' },
  LISTEN:  { label: 'Listen',  color: '#007AFF', fillBase: 'rgba(0,122,255,0.08)',   fillActive: 'rgba(0,122,255,0.20)',   strokeBase: 'rgba(0,122,255,0.22)',   strokeActive: 'rgba(0,122,255,0.55)' },
  THINK:   { label: 'Think',   color: '#AF52DE', fillBase: 'rgba(175,82,222,0.08)',  fillActive: 'rgba(175,82,222,0.20)',  strokeBase: 'rgba(175,82,222,0.22)',  strokeActive: 'rgba(175,82,222,0.55)' },
  SPEAK:   { label: 'Speak',   color: '#5856D6', fillBase: 'rgba(88,86,214,0.08)',   fillActive: 'rgba(88,86,214,0.20)',   strokeBase: 'rgba(88,86,214,0.22)',   strokeActive: 'rgba(88,86,214,0.55)' },
  SHOW:    { label: 'Show',    color: '#FF9500', fillBase: 'rgba(255,149,0,0.08)',   fillActive: 'rgba(255,149,0,0.20)',   strokeBase: 'rgba(255,149,0,0.22)',   strokeActive: 'rgba(255,149,0,0.55)' },
  GOODBYE: { label: 'Goodbye', color: '#FF2D55', fillBase: 'rgba(255,45,85,0.08)',   fillActive: 'rgba(255,45,85,0.20)',   strokeBase: 'rgba(255,45,85,0.22)',   strokeActive: 'rgba(255,45,85,0.55)' },
};

const SHORTCUT_KEYS: Record<string, string> = {
  GREET: 'G', LISTEN: 'L', THINK: 'T', SPEAK: 'S',
};

// ── Compact layout constants ──
const CX = 170;
const CY_FALLBACK = 145;
const RADIUS_FALLBACK = 105;
const NODE_R = 28;
const NODE_R_UNSUPPORTED = 14;
const COUNT = 8;
const TOP_CY = 135;
const TOP_RX = 95;
const TOP_RY = 68;
const BOTTOM_ROW_Y = 270;
const SF = '-apple-system, BlinkMacSystemFont, sans-serif';

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
  const pmx = mx - CX;
  const pmy = my - TOP_CY;
  const dist = Math.sqrt(pmx * pmx + pmy * pmy);
  let dx: number, dy: number;
  if (dist < 1) {
    dx = -(from.y - to.y);
    dy = from.x - to.x;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    dx /= d2; dy /= d2;
  } else {
    dx = pmx / dist; dy = pmy / dist;
  }
  const bulge = 30;
  return `M ${from.x} ${from.y} Q ${mx + dx * bulge} ${my + dy * bulge} ${to.x} ${to.y}`;
}

function selfLoopPath(x: number, y: number, r: number): string {
  const b = r * 0.65;
  return `M ${x + r} ${y - 6} C ${x + r + b} ${y - 18}, ${x + r + b} ${y + 18}, ${x + r} ${y + 6}`;
}

/** Compute a curved arc between two node positions, with offset for parallel edges */
function queueArcPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  offsetIndex: number = 0,
): { d: string; mx: number; my: number } {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const pmx = midX - CX;
  const pmy = midY - TOP_CY;
  const dist = Math.sqrt(pmx * pmx + pmy * pmy);
  let dx: number, dy: number;
  if (dist < 1) {
    dx = -(from.y - to.y);
    dy = from.x - to.x;
    const d2 = Math.sqrt(dx * dx + dy * dy);
    dx /= d2; dy /= d2;
  } else {
    dx = pmx / dist; dy = pmy / dist;
  }
  const bulge = 38 + offsetIndex * 14;
  const cpx = midX + dx * bulge;
  const cpy = midY + dy * bulge;
  return {
    d: `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`,
    mx: 0.25 * from.x + 0.5 * cpx + 0.25 * to.x,
    my: 0.25 * from.y + 0.5 * cpy + 0.25 * to.y,
  };
}

function StateBadge({ state }: { state: FSMState | null }) {
  if (!state) return <span className="text-white/30 font-mono text-xs">---</span>;
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono border"
      style={{ backgroundColor: config.fillActive, borderColor: config.strokeBase, color: config.color }}
    >
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
      .catch(() => {});
  }, []);

  const handleClick = (state: FSMState) => {
    setPendingState(state);
    onSend({ type: 'fsm.manual', state });
  };
  const handleReset = () => { setPendingState('IDLE'); onSend({ type: 'fsm.reset' }); };
  const handleClearQueue = () => { onSend({ type: 'queue.clear' }); };

  const queuePositions = new Map<string, number[]>();
  playerQueueItems.forEach((item, i) => {
    const s = item.targetState;
    if (!queuePositions.has(s)) queuePositions.set(s, []);
    queuePositions.get(s)!.push(i + 1);
  });

  const activeConfig = STATE_CONFIG[currentState] ?? STATE_CONFIG.IDLE;
  const manifestLoaded = supportedStates !== null;
  const supportedList = manifestLoaded ? NODE_ORDER.filter((s) => supportedStates.has(s)) : [];
  const unsupportedList = manifestLoaded ? NODE_ORDER.filter((s) => !supportedStates.has(s)) : [];

  const nodePositions = new Map<FSMState, { x: number; y: number }>();
  const nodeRadii = new Map<FSMState, number>();

  if (manifestLoaded) {
    const positions = supportedPositions(supportedList.length);
    supportedList.forEach((state, i) => { nodePositions.set(state, positions[i]); nodeRadii.set(state, NODE_R); });
    const count = unsupportedList.length;
    const totalWidth = 260;
    const startX = CX - totalWidth / 2;
    unsupportedList.forEach((state, i) => {
      const x = count === 1 ? CX : startX + (totalWidth / (count - 1)) * i;
      nodePositions.set(state, { x, y: BOTTOM_ROW_Y });
      nodeRadii.set(state, NODE_R_UNSUPPORTED);
    });
  } else {
    NODE_ORDER.forEach((state, i) => { nodePositions.set(state, fallbackPosition(i)); nodeRadii.set(state, NODE_R); });
  }

  const fromPos = previousState ? nodePositions.get(previousState) : undefined;
  const toPos = nodePositions.get(currentState);
  const showArc = previousState !== null && previousState !== currentState && fromPos && toPos;
  const arcPath = showArc ? transitionArcFromPoints(fromPos, toPos) : '';

  // Compute connector lines between all supported nodes
  const allNodes = manifestLoaded ? supportedList : NODE_ORDER;

  return (
    <div className="space-y-2.5">
      {/* ── Header row ── */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="section-header">Agent FSM</h3>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${orchestratorOnline ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`} />
            <span className="text-[9px] text-white/35 font-mono">{orchestratorOnline ? 'ONLINE' : 'OFFLINE'}</span>
            <span className="text-white/10 text-[9px]">|</span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-[#007AFF]' : 'bg-white/20'}`} />
            <span className="text-[9px] text-white/35 font-mono">WS</span>
          </div>
        </div>
        <p className="text-[11px] text-white/25 mt-1 leading-relaxed">
          Behavioral state graph for the embodied agent. Click nodes to trigger transitions, queue multiple to chain them.
        </p>
      </div>

      {/* ── Compact status strip ── */}
      <div className="flex items-center gap-2 text-[10px] font-mono bg-glass-light border border-glass-border rounded-lg px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-white/25">state:</span>
          <StateBadge state={currentState} />
        </div>
        {previousState && previousState !== currentState && (
          <div className="flex items-center gap-1 text-white/25">
            <span>from</span>
            <span style={{ color: STATE_CONFIG[previousState]?.color }}>{previousState}</span>
          </div>
        )}
        {pendingState && pendingState !== currentState && (
          <div className="flex items-center gap-1">
            <span className="text-white/25">→</span>
            <StateBadge state={pendingState} />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-white/25">
          <span>T:{transitionCount}</span>
          <span>Q:{queueLength}</span>
        </div>
      </div>

      {/* ── Graph + Controls side by side ── */}
      <div className="flex flex-col md:flex-row gap-2 items-stretch">
        {/* Graph container with glass background */}
        <div className="bg-glass-light border border-glass-border rounded-xl p-1 md:w-[55%] flex-shrink-0">
          <svg viewBox="0 0 340 300" className="w-full">
            <defs>
              {/* Soft drop shadow for nodes */}
              <filter id="n-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" floodOpacity="0.4" />
              </filter>
              {/* Subtle inner glow for glass effect */}
              <filter id="n-glass" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                <feOffset dy="-1" result="offset" />
                <feFlood floodColor="white" floodOpacity="0.12" result="color" />
                <feComposite in="color" in2="offset" operator="in" result="highlight" />
                <feMerge>
                  <feMergeNode in="SourceGraphic" />
                  <feMergeNode in="highlight" />
                </feMerge>
              </filter>
              <marker id="arr" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 6 2.5, 0 5" fill="rgba(255,255,255,0.4)" />
              </marker>
              <marker id="arr-q" markerWidth="5" markerHeight="4" refX="4.5" refY="2" orient="auto" markerUnits="userSpaceOnUse">
                <polygon points="0 0, 5 2, 0 4" fill="rgba(255,149,0,0.45)" />
              </marker>
              {/* Glass node gradient: bright top edge → transparent */}
              <linearGradient id="g-hi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.04)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              {/* Radial vignette for graph background */}
              <radialGradient id="g-bg" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* Background vignette */}
            <rect x="0" y="0" width="340" height="300" rx="10" fill="url(#g-bg)" />

            {/* Subtle connector mesh between all supported nodes */}
            {allNodes.map((a, i) =>
              allNodes.slice(i + 1).map((b) => {
                const pa = nodePositions.get(a);
                const pb = nodePositions.get(b);
                if (!pa || !pb) return null;
                return (
                  <line key={`${a}-${b}`}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"
                  />
                );
              })
            )}

            {/* Initial state arrow → IDLE */}
            {(() => {
              const p = nodePositions.get('IDLE');
              if (!p) return null;
              const r = nodeRadii.get('IDLE') ?? NODE_R;
              return (
                <line x1={p.x} y1={p.y - r - 22} x2={p.x} y2={p.y - r}
                  stroke="rgba(255,255,255,0.25)" strokeWidth="1" markerEnd="url(#arr)" />
              );
            })()}

            {/* Transition arc */}
            {showArc && (
              <g>
                <path d={arcPath} fill="none" stroke={activeConfig.color} strokeWidth="1.5" strokeOpacity="0.12" />
                <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" markerEnd="url(#arr)" />
                <circle r="2.5" fill={activeConfig.color} opacity="0.6">
                  <animateMotion dur="1.2s" repeatCount="indefinite" path={arcPath} />
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.2s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* ── Queue path visualization ── */}
            {playerQueueItems.length > 0 && (() => {
              // Build ordered chain: currentState → q0 → q1 → …
              const chain: FSMState[] = [currentState];
              for (const item of playerQueueItems) {
                const st = matchFSMState(item.targetState);
                if (st) chain.push(st);
              }

              const edgeCounts = new Map<string, number>();
              const arcs: { step: number; d: string; mx: number; my: number }[] = [];

              for (let i = 0; i < chain.length - 1; i++) {
                const from = chain[i];
                const to = chain[i + 1];
                if (from === to) continue; // self-loop shown on node badge
                const pFrom = nodePositions.get(from);
                const pTo = nodePositions.get(to);
                if (!pFrom || !pTo) continue;

                const edgeKey = `${from}-${to}`;
                const cnt = edgeCounts.get(edgeKey) ?? 0;
                edgeCounts.set(edgeKey, cnt + 1);

                const arc = queueArcPath(pFrom, pTo, cnt);
                arcs.push({ step: i + 1, d: arc.d, mx: arc.mx, my: arc.my });
              }

              // Unique set of queued target states for glow rings
              const queuedStates = new Set(
                playerQueueItems.map(item => matchFSMState(item.targetState)).filter((s): s is FSMState => s !== null)
              );

              return (
                <g>
                  {/* Orange glow rings on queued destination nodes */}
                  {Array.from(queuedStates).map(st => {
                    const pos = nodePositions.get(st);
                    const r = nodeRadii.get(st) ?? NODE_R;
                    if (!pos) return null;
                    return (
                      <circle key={`qring-${st}`} cx={pos.x} cy={pos.y} r={r + 5}
                        fill="none" stroke="rgba(255,149,0,0.12)" strokeWidth="1" strokeDasharray="3 2">
                        <animate attributeName="stroke-opacity" values="0.08;0.20;0.08" dur="2.5s" repeatCount="indefinite" />
                      </circle>
                    );
                  })}

                  {/* Queue transition arcs */}
                  {arcs.map(({ step, d, mx, my }) => (
                    <g key={`qarc-${step}`}>
                      {/* Dashed path with arrowhead */}
                      <path d={d} fill="none" stroke="rgba(255,149,0,0.20)" strokeWidth="1.5"
                        strokeDasharray="4 3" markerEnd="url(#arr-q)" />
                      {/* Traveling dot */}
                      <circle r="2" fill="#FF9500" opacity="0.4">
                        <animateMotion dur={`${1.8 + step * 0.3}s`} repeatCount="indefinite" path={d} />
                        <animate attributeName="opacity" values="0.15;0.5;0.15" dur={`${1.8 + step * 0.3}s`} repeatCount="indefinite" />
                      </circle>
                      {/* Step number badge at arc midpoint */}
                      <circle cx={mx} cy={my} r="6.5"
                        fill="rgba(255,149,0,0.12)" stroke="rgba(255,149,0,0.30)" strokeWidth="0.5" />
                      <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                        fontSize="6.5" fontWeight="bold" fontFamily={SF} fill="rgba(255,149,0,0.75)">
                        {step}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* Zone divider */}
            {manifestLoaded && unsupportedList.length > 0 && (
              <g>
                <line x1="30" y1="245" x2="310" y2="245" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="170" y="255" textAnchor="middle" fontSize="6" fontFamily={SF} fill="rgba(255,255,255,0.10)" style={{ pointerEvents: 'none' }}>
                  NO CONTENT
                </text>
              </g>
            )}

            {/* ── Supported Nodes ── */}
            {(manifestLoaded ? supportedList : NODE_ORDER).map((state) => {
              const pos = nodePositions.get(state);
              if (!pos) return null;
              const { x, y } = pos;
              const r = nodeRadii.get(state) ?? NODE_R;
              const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
              const isActive = currentState === state;
              const isPending = pendingState === state && !isActive;
              const isHovered = hoveredState === state;
              const count = clipCounts.get(state) ?? 0;
              const shortcut = SHORTCUT_KEYS[state];

              const fill = isActive || isHovered ? config.fillActive : config.fillBase;
              const stroke = isActive || isHovered ? config.strokeActive : config.strokeBase;

              return (
                <g key={state} style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(state)}
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  {/* Active pulse ring */}
                  {isActive && (
                    <circle cx={x} cy={y} r={r + 4} fill="none" stroke={config.color} strokeWidth="1" strokeOpacity="0.18">
                      <animate attributeName="r" values={`${r + 2};${r + 7};${r + 2}`} dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0.06;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Pending dashed ring */}
                  {isPending && (
                    <circle cx={x} cy={y} r={r + 3} fill="none" stroke={config.color} strokeWidth="0.75" strokeDasharray="5 3" opacity="0.35">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Glass node body */}
                  <g filter="url(#n-shadow)">
                    <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={isActive ? 1.5 : 0.75} />
                    {/* Specular top highlight */}
                    <circle cx={x} cy={y} r={r - 1} fill="url(#g-hi)" style={{ pointerEvents: 'none' }} />
                    {/* Inner top edge — bright specular line */}
                    <path
                      d={`M ${x - r + 6} ${y - r + 3} A ${r - 2} ${r - 2} 0 0 1 ${x + r - 6} ${y - r + 3}`}
                      fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>

                  {/* State label */}
                  <text x={x} y={isActive ? y - 2 : y + 1} textAnchor="middle" dominantBaseline="central"
                    fontSize="8.5" fontWeight="600" fill="white" fontFamily={SF} letterSpacing="0.02em"
                    style={{ pointerEvents: 'none' }}
                  >
                    {state}
                  </text>

                  {/* Active sub-label */}
                  {isActive && (
                    <text x={x} y={y + 10} textAnchor="middle" dominantBaseline="central"
                      fontSize="6" fill="rgba(255,255,255,0.35)" fontFamily={SF} style={{ pointerEvents: 'none' }}
                    >
                      {clipPlaying ? 'PLAYING' : 'ACTIVE'}
                    </text>
                  )}

                  {/* Self-loop */}
                  {isActive && (() => {
                    const lp = selfLoopPath(x, y, r);
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <path d={lp} fill="none" stroke={config.color} strokeWidth="1" strokeOpacity={clipPlaying ? 0.4 : 0.15} markerEnd="url(#arr)" />
                        {clipPlaying && (
                          <circle r="2" fill={config.color} opacity="0.6">
                            <animateMotion dur="1.5s" repeatCount="indefinite" path={lp} />
                            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    );
                  })()}

                  {/* Spinner ring while playing */}
                  {isActive && clipPlaying && (
                    <circle cx={x} cy={y} r={r + 2} fill="none" stroke={config.color} strokeWidth="1"
                      strokeDasharray={`${(r + 2) * 0.7} ${(r + 2) * 5}`} strokeLinecap="round" opacity="0.3"
                      style={{ pointerEvents: 'none' }}
                    >
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Clip count pill */}
                  {count > 0 && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect x={x - r + 1} y={y - r - 9} width={count >= 10 ? 24 : 18} height="12" rx="6"
                        fill={config.fillActive} stroke={config.strokeBase} strokeWidth="0.5" />
                      <text x={x - r + (count >= 10 ? 13 : 10)} y={y - r - 3} textAnchor="middle" dominantBaseline="central"
                        fontSize="7" fontWeight="bold" fontFamily={SF} fill={config.color}>
                        ×{count}
                      </text>
                    </g>
                  )}

                  {/* Keyboard shortcut key cap */}
                  {shortcut && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect x={x + r - 12} y={y - r - 1} width="13" height="11" rx="3"
                        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
                      <text x={x + r - 5.5} y={y - r + 4.5} textAnchor="middle" dominantBaseline="central"
                        fontSize="7.5" fill="rgba(255,255,255,0.35)" fontFamily={SF}>
                        {shortcut}
                      </text>
                    </g>
                  )}

                  {/* Queue badge */}
                  {queuePositions.has(state) && (() => {
                    const ps = queuePositions.get(state)!;
                    const label = ps.join(',');
                    const w = label.length * 5 + 9;
                    return (
                      <g style={{ pointerEvents: 'none' }}>
                        <rect x={x + r - w + 3} y={y + r - 6} width={w} height="11" rx="5.5"
                          fill="rgba(255,149,0,0.18)" stroke="rgba(255,149,0,0.30)" strokeWidth="0.5" />
                        <text x={x + r - w / 2 + 3} y={y + r + 0.5} textAnchor="middle" dominantBaseline="central"
                          fontSize="6.5" fontWeight="bold" fontFamily={SF} fill="rgba(255,149,0,0.80)">
                          Q{label}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Hover tooltip */}
                  {isHovered && count > 0 && (
                    <g style={{ pointerEvents: 'none' }}>
                      <rect x={x - 32} y={y + r + 5} width="64" height="14" rx="5"
                        fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                      <text x={x} y={y + r + 12} textAnchor="middle" dominantBaseline="central"
                        fontSize="6" fontFamily={SF} fill="rgba(255,255,255,0.6)">
                        {count} clips
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ── Unsupported Nodes ── */}
            {manifestLoaded && unsupportedList.map((state) => {
              const pos = nodePositions.get(state);
              if (!pos) return null;
              const { x, y } = pos;
              const r = NODE_R_UNSUPPORTED;
              const config = STATE_CONFIG[state] ?? STATE_CONFIG.IDLE;
              const isActive = currentState === state;
              const isPending = pendingState === state && !isActive;

              return (
                <g key={state} style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(state)}
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  {isActive && (
                    <circle cx={x} cy={y} r={r + 3} fill="none" stroke={config.color} strokeWidth="0.75" strokeOpacity="0.15">
                      <animate attributeName="r" values={`${r + 2};${r + 5};${r + 2}`} dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isPending && (
                    <circle cx={x} cy={y} r={r + 2} fill="none" stroke={config.color} strokeWidth="0.75" strokeDasharray="3 2" opacity="0.3">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={r} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" strokeDasharray="2 2" />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="5.5" fontWeight="600"
                    fill="rgba(255,255,255,0.20)" fontFamily={SF} style={{ pointerEvents: 'none' }}>
                    {state}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Controls panel ── */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Now playing — current clip being rendered on screen */}
          <div className="bg-glass-light border border-glass-border rounded-xl px-2.5 py-1.5">
            <div className="text-[7px] uppercase tracking-wider text-white/25 mb-0.5">Now Playing</div>
            <div className="text-[8px] text-white/15 mb-0.5">Active clip on the embodiment surface</div>
            <div className="flex items-center gap-1.5">
              {clipPlaying && <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />}
              <span className="text-[9px] font-mono text-white/55 truncate">
                {currentClip ? currentClip.split('/').pop() : '---'}
              </span>
            </div>
          </div>

          {/* Player queue — pending transitions lined up for execution */}
          <div className="bg-glass-light border border-glass-border rounded-xl px-2.5 py-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] uppercase tracking-wider text-white/25">Transition Queue</span>
              <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded ${
                playerTransitionActive
                  ? 'bg-[#FF9500]/12 text-[#FF9500] border border-[#FF9500]/20'
                  : 'bg-[#34C759]/8 text-[#34C759]/60 border border-[#34C759]/12'
              }`}>
                {playerTransitionActive ? 'TRANSITION' : 'IDLE'}
              </span>
            </div>
            {playerPendingClip && (
              <div className="text-[9px] font-mono text-white/30 flex items-center gap-1">
                <span className="text-[#FF9500]/60">pending:</span>
                <span className="text-white/50 truncate">{playerPendingClip.split('/').pop()}</span>
              </div>
            )}
            {playerQueueItems.length > 0 ? (
              <div className="space-y-0.5">
                {playerQueueItems.map((item, i) => (
                  <div key={i} className="text-[9px] font-mono text-white/30 flex flex-wrap items-center gap-1">
                    <span className="text-white/15">[{i}]</span>
                    {item.bridge && <span className="text-white/45 truncate max-w-[80px]">{item.bridge.split('/').pop()}</span>}
                    {item.bridge && item.target && <span className="text-white/15">→</span>}
                    {item.target && <span className="text-white/45 truncate max-w-[80px]">{item.target.split('/').pop()}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[9px] font-mono text-white/15">
                {playerTransitionActive ? 'playing transition' : 'idle loop'}
              </div>
            )}
          </div>

          {/* Quick transitions — direct state change buttons */}
          <div className="bg-glass-light border border-glass-border rounded-xl px-2.5 py-1.5">
            <div className="text-[7px] uppercase tracking-wider text-white/25 mb-0.5">Quick Transition</div>
            <div className="text-[8px] text-white/15 mb-1">Trigger a state change or queue it behind active transitions</div>
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-1">
              {(['GREET', 'LISTEN', 'THINK', 'SPEAK', 'SHOW'] as FSMState[]).map((state) => {
                const cfg = STATE_CONFIG[state];
                const key = SHORTCUT_KEYS[state];
                const isActive = currentState === state;
                const qPos = queuePositions.get(state);
                return (
                  <button key={state} onClick={() => handleClick(state)}
                    className="relative flex items-center gap-0.5 px-1.5 py-1.5 sm:py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-[0.97]"
                    style={{ backgroundColor: isActive ? cfg.fillActive : cfg.fillBase, borderColor: isActive ? cfg.strokeActive : cfg.strokeBase, color: cfg.color }}
                  >
                    <span className="truncate">{state}</span>
                    {key && <span className="ml-auto text-[6px] text-white/20 font-mono bg-black/20 rounded px-0.5">{key}</span>}
                    {qPos && (
                      <span className="absolute -top-1 -right-1 bg-[#FF9500]/80 text-black text-[6px] font-bold rounded-full w-2.5 h-2.5 flex items-center justify-center">
                        {qPos[0]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button onClick={handleReset}
              className="flex-1 px-2 py-1.5 rounded-xl text-[9px] font-bold text-white bg-[#FF3B30]/12 border border-[#FF3B30]/20 hover:bg-[#FF3B30]/22 active:scale-[0.98] transition-all flex items-center justify-center gap-1">
              <span>Reset</span>
              <span className="bg-white/5 border border-white/10 text-[7px] text-white/25 rounded px-0.5 font-mono font-normal">R</span>
            </button>
            <button onClick={handleClearQueue}
              disabled={playerQueueItems.length === 0 && !playerTransitionActive}
              className="flex-1 px-2 py-1.5 rounded-xl text-[9px] font-bold text-white bg-[#FF9500]/12 border border-[#FF9500]/20 hover:bg-[#FF9500]/22 active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-1">
              <span>Clear Q</span>
              {(playerQueueItems.length > 0 || playerTransitionActive) && (
                <span className="bg-[#FF9500]/15 text-[#FF9500] text-[8px] font-mono rounded-full px-1 min-w-[14px] text-center">
                  {playerQueueItems.length + (playerTransitionActive ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {lastError && (
        <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl px-2.5 py-1.5 text-[10px] text-[#FF6961] font-mono">
          <span className="text-[#FF3B30] font-bold">ERR</span> {lastError}
        </div>
      )}
    </div>
  );
}
