import { useState, useEffect, useRef } from 'react';

/* ── Particle types ── */

interface ConvergeParticle {
  kind: 'converge';
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  dur: number;
  delay: number;
  streak: boolean;
  rot: number;
}

interface SparkleParticle {
  kind: 'sparkle';
  id: number;
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
}

interface ScatterParticle {
  kind: 'scatter';
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  dur: number;
  delay: number;
  streak: boolean;
  rot: number;
}

type Particle = ConvergeParticle | SparkleParticle | ScatterParticle;

/* ── Random helpers ── */
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Random point along panel perimeter (0-100%) */
function edgePoint() {
  const edge = pick(['top', 'bottom', 'left', 'right'] as const);
  if (edge === 'top') return { x: rand(5, 95), y: rand(0, 5) };
  if (edge === 'bottom') return { x: rand(5, 95), y: rand(95, 100) };
  if (edge === 'left') return { x: rand(0, 5), y: rand(5, 95) };
  return { x: rand(95, 100), y: rand(5, 95) };
}

function generateParticles(): Particle[] {
  const particles: Particle[] = [];
  let id = 0;

  // Phase 1: converge — start spread across panel, fly to edges
  for (let i = 0; i < 24; i++) {
    const end = edgePoint();
    // Start from a random interior/mid-panel area
    const startX = clamp(rand(15, 85), 0, 100);
    const startY = clamp(rand(15, 85), 0, 100);

    particles.push({
      kind: 'converge',
      id: id++,
      startX, startY,
      endX: end.x, endY: end.y,
      size: rand(2, 5),
      dur: rand(350, 600),
      delay: rand(0, 180),
      streak: Math.random() > 0.5,
      rot: rand(0, 360),
    });
  }

  // Phase 2: sparkles — twinkle along panel edges
  for (let i = 0; i < 12; i++) {
    const pt = edgePoint();
    particles.push({
      kind: 'sparkle',
      id: id++,
      x: pt.x, y: pt.y,
      size: rand(2, 6),
      dur: rand(300, 600),
      delay: rand(200, 450),
    });
  }

  // Phase 3: scatter — burst from center outward but stay in panel
  for (let i = 0; i < 16; i++) {
    const startX = rand(30, 70);
    const startY = rand(30, 70);
    const angle = rand(0, Math.PI * 2);
    const dist = rand(15, 35);
    const endX = clamp(startX + Math.cos(angle) * dist, 2, 98);
    const endY = clamp(startY + Math.sin(angle) * dist, 2, 98);

    particles.push({
      kind: 'scatter',
      id: id++,
      startX, startY,
      endX, endY,
      size: rand(1.5, 4),
      dur: rand(400, 800),
      delay: rand(300, 550),
      streak: Math.random() > 0.6,
      rot: rand(0, 360),
    });
  }

  return particles;
}

/**
 * Multi-phase particle entrance — all particles stay within panel bounds.
 *  1. Converge — particles from panel interior fly to edges
 *  2. Sparkle — twinkling points along edges as panel materializes
 *  3. Scatter — particles burst from center outward within panel
 */
export default function ParticleBurst({
  trigger,
  color = 'rgba(255, 255, 255, 0.9)',
}: {
  trigger: boolean;
  color?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flash, setFlash] = useState(false);
  const prevTrigger = useRef(false);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setParticles(generateParticles());
      const flashTimer = setTimeout(() => setFlash(true), 280);
      const flashOff = setTimeout(() => setFlash(false), 580);
      const cleanup = setTimeout(() => setParticles([]), 1600);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(flashOff);
        clearTimeout(cleanup);
      };
    }
    prevTrigger.current = trigger;
  }, [trigger]);

  if (particles.length === 0 && !flash) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 50, borderRadius: 'inherit' }}
    >
      {/* Flash glow when panel materializes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: color.replace(/[\d.]+\)$/, '0.12)'),
          boxShadow: `inset 0 0 30px ${color.replace(/[\d.]+\)$/, '0.2)')}`,
          opacity: flash ? 1 : 0,
          transition: 'opacity 300ms ease-out',
        }}
      />

      {particles.map((p) => {
        if (p.kind === 'converge') return <ConvergeDot key={p.id} p={p} color={color} />;
        if (p.kind === 'sparkle') return <SparkleDot key={p.id} p={p} color={color} />;
        return <ScatterDot key={p.id} p={p} color={color} />;
      })}
    </div>
  );
}

/* ── Converge: flies from panel interior to edge ── */
function ConvergeDot({ p, color }: { p: ConvergeParticle; color: string }) {
  const w = p.streak ? p.size * 8 : p.size;
  const h = p.size;
  const travelAngle = Math.atan2(p.endY - p.startY, p.endX - p.startX) * (180 / Math.PI);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${p.startX}%`,
        top: `${p.startY}%`,
        width: w,
        height: h,
        borderRadius: p.streak ? h / 2 : '50%',
        background: color,
        boxShadow: `0 0 ${p.size * 3}px ${color}, 0 0 ${p.size * 6}px ${color}`,
        opacity: 0,
        transform: `translate(-50%, -50%) rotate(${p.streak ? travelAngle : p.rot}deg)`,
        animation: `particle-fly-in ${p.dur}ms ${p.delay}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        '--end-x': `${p.endX}%`,
        '--end-y': `${p.endY}%`,
      } as React.CSSProperties}
    />
  );
}

/* ── Sparkle: twinkles at panel edge ── */
function SparkleDot({ p, color }: { p: SparkleParticle; color: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: `0 0 ${p.size * 2}px #fff, 0 0 ${p.size * 5}px ${color}, 0 0 ${p.size * 10}px ${color}`,
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0)',
        animation: `particle-sparkle ${p.dur}ms ${p.delay}ms ease-out forwards`,
      }}
    />
  );
}

/* ── Scatter: bursts outward within panel ── */
function ScatterDot({ p, color }: { p: ScatterParticle; color: string }) {
  const w = p.streak ? p.size * 5 : p.size;
  const h = p.size;
  const angle = Math.atan2(p.endY - p.startY, p.endX - p.startX) * (180 / Math.PI);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${p.startX}%`,
        top: `${p.startY}%`,
        width: w,
        height: h,
        borderRadius: p.streak ? h / 2 : '50%',
        background: color,
        boxShadow: `0 0 ${p.size * 2}px ${color}, 0 0 ${p.size * 4}px ${color}`,
        opacity: 0,
        transform: `translate(-50%, -50%) rotate(${p.streak ? angle : p.rot}deg)`,
        animation: `particle-scatter ${p.dur}ms ${p.delay}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        '--end-x': `${p.endX}%`,
        '--end-y': `${p.endY}%`,
      } as React.CSSProperties}
    />
  );
}
