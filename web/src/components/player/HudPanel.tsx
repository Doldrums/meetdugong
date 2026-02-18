import type { ReactNode, CSSProperties } from 'react';

interface HudPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label?: string;
  status?: string;
  scanSpeed?: number;
}

const DATA_HEX = [
  'A7F3', '2B1E', '8C4D', '0F92', 'E5A8',
  '3D6B', '7C0F', '1A9E', 'B4D2', '6F83',
  '9E27', 'C5B1', '4A6F', 'D8C3', '2E91',
];

export default function HudPanel({
  children,
  className = '',
  style,
  label,
  status,
  scanSpeed = 3.5,
}: HudPanelProps) {
  return (
    <div className={`relative ${className}`} style={style}>
      {/* ── Clipped background layers ── */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        {/* Bright glass gradient — icy white-blue with aqua/teal shift */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, oklch(0.97 0.015 200 / 72%) 0%, oklch(0.95 0.02 190 / 65%) 35%, oklch(0.96 0.018 210 / 70%) 65%, oklch(0.97 0.012 195 / 68%) 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 10s ease infinite',
          }}
        />

        {/* Silver-teal reflective shimmer band */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, oklch(0.90 0.06 195 / 12%) 25%, oklch(0.88 0.04 250 / 8%) 50%, oklch(0.90 0.06 185 / 12%) 75%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'hud-shimmer 6s linear infinite',
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(0.60 0.12 210 / 50%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.60 0.12 210 / 50%) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Scanning line — soft aqua sweep */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-0 right-0 h-10"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, oklch(0.78 0.10 190 / 12%) 50%, transparent 100%)',
              animation: `hud-scan ${scanSpeed}s linear infinite`,
            }}
          />
        </div>

        {/* Faint violet gradient pulse (animated accent) */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background:
              'radial-gradient(ellipse at 70% 30%, oklch(0.72 0.12 290 / 30%) 0%, transparent 60%)',
            animation: 'glow-breathe 5s ease-in-out infinite',
          }}
        />

        {/* Edge glow lines — luminous cyan */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-teal-400/20 to-transparent" />
      </div>

      {/* ── Corner brackets ── */}
      <HudCorner pos="tl" delay={0} />
      <HudCorner pos="tr" delay={0.6} />
      <HudCorner pos="bl" delay={1.2} />
      <HudCorner pos="br" delay={1.8} />

      {/* ── Floating particles ── */}
      <HudParticle className="-top-1 left-[25%]" delay={0.3} />
      <HudParticle className="-bottom-1 right-[20%]" delay={1.5} />
      <HudParticle className="top-[40%] -right-1" delay={0.8} size={3} />

      {/* ── Data stream (right edge) ── */}
      <div className="absolute right-1.5 top-6 bottom-2 w-5 overflow-hidden opacity-[0.08] pointer-events-none">
        <div
          className="font-mono text-[5px] leading-[1.8] whitespace-nowrap"
          style={{
            color: 'oklch(0.55 0.10 195)',
            animation: 'hud-data-scroll 12s linear infinite',
          }}
        >
          {DATA_HEX.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
          {DATA_HEX.map((h, i) => (
            <div key={`d${i}`}>{h}</div>
          ))}
        </div>
      </div>

      {/* ── Labels ── */}
      {label && (
        <span
          className="absolute top-1.5 left-3 text-[8px] font-mono tracking-[0.2em] uppercase pointer-events-none z-10"
          style={{
            color: 'oklch(0.60 0.10 210 / 55%)',
            animation: 'hud-flicker 5s infinite',
          }}
        >
          ▪ {label}
        </span>
      )}
      {status && (
        <span
          className="absolute top-1.5 right-8 text-[7px] font-mono tracking-wider pointer-events-none z-10"
          style={{
            color: 'oklch(0.55 0.08 195 / 40%)',
            animation: 'hud-flicker 3s infinite 1s',
          }}
        >
          {status}
        </span>
      )}

      {/* ── Content ── */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

// ── Corner bracket with pulsing node ────────────────────────

type Pos = 'tl' | 'tr' | 'bl' | 'br';

// Alternating cyan ↔ teal for visual variety
const CORNER_COLORS: Record<Pos, { from: string; dot: string }> = {
  tl: { from: 'from-cyan-400/55', dot: 'bg-cyan-400' },
  tr: { from: 'from-teal-400/55', dot: 'bg-teal-400' },
  bl: { from: 'from-teal-400/55', dot: 'bg-teal-400' },
  br: { from: 'from-cyan-400/55', dot: 'bg-cyan-400' },
};

const CORNER_DIRS: Record<Pos, { outer: string; hDir: string; vDir: string; dotPos: string }> = {
  tl: { outer: 'top-0 left-0', hDir: 'bg-gradient-to-r', vDir: 'bg-gradient-to-b', dotPos: '-top-[2px] -left-[2px]' },
  tr: { outer: 'top-0 right-0', hDir: 'bg-gradient-to-l', vDir: 'bg-gradient-to-b', dotPos: '-top-[2px] -right-[2px]' },
  bl: { outer: 'bottom-0 left-0', hDir: 'bg-gradient-to-r', vDir: 'bg-gradient-to-t', dotPos: '-bottom-[2px] -left-[2px]' },
  br: { outer: 'bottom-0 right-0', hDir: 'bg-gradient-to-l', vDir: 'bg-gradient-to-t', dotPos: '-bottom-[2px] -right-[2px]' },
};

function HudCorner({ pos, delay }: { pos: Pos; delay: number }) {
  const d = CORNER_DIRS[pos];
  const c = CORNER_COLORS[pos];
  const isTop = pos.startsWith('t');
  const isLeft = pos.endsWith('l');
  const edgePos = `${isTop ? 'top-0' : 'bottom-0'} ${isLeft ? 'left-0' : 'right-0'}`;

  return (
    <div className={`absolute ${d.outer} w-6 h-6 pointer-events-none z-10`}>
      <div className={`absolute ${edgePos} w-full h-[1.5px] ${d.hDir} ${c.from} to-transparent`} />
      <div className={`absolute ${edgePos} h-full w-[1.5px] ${d.vDir} ${c.from} to-transparent`} />
      <div
        className={`absolute ${d.dotPos} w-[5px] h-[5px] rounded-full ${c.dot}`}
        style={{ animation: `hud-pulse 2.5s ease-in-out ${delay}s infinite` }}
      />
    </div>
  );
}

// ── Floating particle dot ───────────────────────────────────

function HudParticle({
  className,
  delay,
  size = 4,
}: {
  className: string;
  delay: number;
  size?: number;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: 'oklch(0.75 0.12 195 / 40%)',
        animation: `hud-pulse 3s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}
