import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ClipManifest, ControlEvent, CharacterStateConfig } from '@shared/types';
import { useAppStore } from '../../stores/appStore';
import { useLogStore } from '../../stores/logStore';

// ── Color palette for auto-assigning state colors ──
const COLOR_PALETTE = [
  '#FF9500', // orange
  '#34C759', // green
  '#007AFF', // blue
  '#AF52DE', // purple
  '#5856D6', // indigo
  '#FF2D55', // pink
  '#FF3B30', // red
  '#00C7BE', // teal
  '#FFD60A', // yellow
  '#64D2FF', // cyan
];

const IDLE_COLOR = '#8E8E93';

interface StateStyle {
  label: string;
  color: string;
  fillBase: string;
  fillActive: string;
  strokeBase: string;
  strokeActive: string;
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function buildStateStyle(label: string, color: string): StateStyle {
  return {
    label,
    color,
    fillBase: hexToRgba(color, 0.08),
    fillActive: hexToRgba(color, 0.20),
    strokeBase: hexToRgba(color, 0.22),
    strokeActive: hexToRgba(color, 0.55),
  };
}

function buildStateConfig(
  fsmStates: string[],
  stateConfigs: Record<string, CharacterStateConfig>,
): Record<string, StateStyle> {
  const config: Record<string, StateStyle> = {};
  let paletteIdx = 0;
  for (const state of fsmStates) {
    const sc = stateConfigs[state];
    if (state === 'IDLE') {
      config[state] = buildStateStyle(sc?.label ?? 'Idle', IDLE_COLOR);
    } else {
      const color = sc?.color ?? COLOR_PALETTE[paletteIdx % COLOR_PALETTE.length];
      const label = sc?.label ?? state.charAt(0) + state.slice(1).toLowerCase();
      config[state] = buildStateStyle(label, color);
      paletteIdx++;
    }
  }
  return config;
}

function deriveClipCounts(
  manifest: ClipManifest,
  fsmStates: string[],
  stateConfigs: Record<string, CharacterStateConfig>,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (manifest.idle_loops.length > 0) counts.set('IDLE', manifest.idle_loops.length);
  for (const state of fsmStates) {
    if (state === 'IDLE') continue;
    const sc = stateConfigs[state];
    const prefix = sc?.actionPrefix ?? state.toLowerCase();
    let count = 0;
    for (const clip of manifest.actions) {
      const name = clip.filename.replace(/\.(mp4|webm)$/, '');
      if (name.startsWith(prefix + '_') || name === prefix) count++;
    }
    // Also count bridges that reference this state
    for (const bridge of manifest.bridges) {
      const bFrom = bridge.from.toLowerCase();
      const bTo = bridge.to.toLowerCase();
      const st = state.toLowerCase();
      if (bFrom === st || bFrom.startsWith(st + '_') || bTo === st || bTo.startsWith(st + '_')) {
        count++;
      }
    }
    if (count > 0) counts.set(state, count);
  }
  return counts;
}

interface FSMControlsProps {
  onSend: (event: ControlEvent) => void;
}

// ── Compact layout constants ──
const CX = 170;
const NODE_R = 28;
const TOP_CY = 135;
const TOP_RX = 95;
const TOP_RY = 68;
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

function StateBadge({ state, stateStyles }: { state: string | null; stateStyles: Record<string, StateStyle> }) {
  if (!state) return <span className="text-white/30 font-mono text-xs">---</span>;
  const config = stateStyles[state] ?? buildStateStyle(state, IDLE_COLOR);
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

  // Character/state info from store
  const fsmStates = useAppStore((s) => s.fsmStates);
  const stateConfigs = useAppStore((s) => s.stateConfigs);

  const transitionCount = useLogStore(
    useCallback((s) => s.entries.filter((e) => e.event.type === 'fsm.transition').length, []),
  );

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [clipCounts, setClipCounts] = useState<Map<string, number>>(new Map());

  // Build state styles dynamically from config
  const stateStyles = useMemo(
    () => buildStateConfig(fsmStates, stateConfigs),
    [fsmStates, stateConfigs],
  );

  // Fetch manifest for clip counts
  useEffect(() => {
    fetch('/manifest')
      .then((r) => r.json())
      .then((m: ClipManifest) => {
        setClipCounts(deriveClipCounts(m, fsmStates, stateConfigs));
      })
      .catch(() => {});
  }, [fsmStates, stateConfigs]);

  const handleClick = (state: string) => {
    setPendingState(state);
    onSend({ type: 'fsm.manual', state });
  };
  const handleReset = () => { setPendingState('IDLE'); onSend({ type: 'fsm.reset' }); };
  const handleClearQueue = () => { onSend({ type: 'queue.clear' }); };
  const queuePositions = new Map<string, number[]>();
  playerQueueItems.forEach((item, i) => {
    const s = item.targetState.toUpperCase();
    if (!queuePositions.has(s)) queuePositions.set(s, []);
    queuePositions.get(s)!.push(i + 1);
  });

  const activeConfig = stateStyles[currentState] ?? buildStateStyle(currentState, IDLE_COLOR);

  // All states from config go in the main ring — config is the source of truth
  const allStates = fsmStates;

  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodeRadii = new Map<string, number>();

  const positions = supportedPositions(allStates.length);
  allStates.forEach((state, i) => { nodePositions.set(state, positions[i]); nodeRadii.set(state, NODE_R); });

  const fromPos = previousState ? nodePositions.get(previousState) : undefined;
  const toPos = nodePositions.get(currentState);
  const showArc = previousState !== null && previousState !== currentState && fromPos && toPos;
  const arcPath = showArc ? transitionArcFromPoints(fromPos, toPos) : '';

  // Non-IDLE states for quick transition buttons
  const quickStates = fsmStates.filter((s) => s !== 'IDLE');

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
          <StateBadge state={currentState} stateStyles={stateStyles} />
        </div>
        {previousState && previousState !== currentState && (
          <div className="flex items-center gap-1 text-white/25">
            <span>from</span>
            <span style={{ color: stateStyles[previousState]?.color }}>{previousState}</span>
          </div>
        )}
        {pendingState && pendingState !== currentState && (
          <div className="flex items-center gap-1">
            <span className="text-white/25">→</span>
            <StateBadge state={pendingState} stateStyles={stateStyles} />
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
            {allStates.map((a, i) =>
              allStates.slice(i + 1).map((b) => {
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
              const chain: string[] = [currentState];
              for (const item of playerQueueItems) {
                chain.push(item.targetState.toUpperCase());
              }

              const edgeCounts = new Map<string, number>();
              const arcs: { step: number; d: string; mx: number; my: number }[] = [];

              for (let i = 0; i < chain.length - 1; i++) {
                const from = chain[i];
                const to = chain[i + 1];
                if (from === to) continue;
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
                playerQueueItems.map(item => item.targetState.toUpperCase())
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
                      <path d={d} fill="none" stroke="rgba(255,149,0,0.20)" strokeWidth="1.5"
                        strokeDasharray="4 3" markerEnd="url(#arr-q)" />
                      <circle r="2" fill="#FF9500" opacity="0.4">
                        <animateMotion dur={`${1.8 + step * 0.3}s`} repeatCount="indefinite" path={d} />
                        <animate attributeName="opacity" values="0.15;0.5;0.15" dur={`${1.8 + step * 0.3}s`} repeatCount="indefinite" />
                      </circle>
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

            {/* ── State Nodes ── */}
            {allStates.map((state) => {
              const pos = nodePositions.get(state);
              if (!pos) return null;
              const { x, y } = pos;
              const r = nodeRadii.get(state) ?? NODE_R;
              const config = stateStyles[state] ?? buildStateStyle(state, IDLE_COLOR);
              const isActive = currentState === state;
              const isPending = pendingState === state && !isActive;
              const isHovered = hoveredState === state;
              const count = clipCounts.get(state) ?? 0;

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
                    <circle cx={x} cy={y} r={r - 1} fill="url(#g-hi)" style={{ pointerEvents: 'none' }} />
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
                        x{count}
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
              {quickStates.map((state) => {
                const cfg = stateStyles[state] ?? buildStateStyle(state, IDLE_COLOR);
                const isActive = currentState === state;
                const qPos = queuePositions.get(state);
                return (
                  <button key={state} onClick={() => handleClick(state)}
                    className="relative flex items-center gap-0.5 px-1.5 py-1.5 sm:py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-[0.97]"
                    style={{ backgroundColor: isActive ? cfg.fillActive : cfg.fillBase, borderColor: isActive ? cfg.strokeActive : cfg.strokeBase, color: cfg.color }}
                  >
                    <span className="truncate">{state}</span>
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
