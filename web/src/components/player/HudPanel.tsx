import type { ReactNode, CSSProperties } from 'react';

interface HudPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label?: string;
  status?: string;
  /**
   * Tinted gradient rendered as Layer 0 behind all glass layers.
   * Should use semi-transparent colors (40-60% opacity) for a glass feel.
   */
  tint?: CSSProperties;
  /** @deprecated kept for API compat — ignored */
  scanSpeed?: number;
}

/**
 * Apple Liquid Glass panel — transparent, light, glassy.
 *
 * Layers:
 *  0. Color tint — semi-transparent gradient (via `tint` prop)
 *  1. Frost — very light white overlay
 *  2. Specular highlight — bright top-half gradient (curved glass catching light)
 *  3. Light band — animated diagonal sweep ("liquid" shimmer)
 *  4. Prismatic refraction — color-shifting overlay
 *  5. Edge highlights + inner glow
 *  6. Labels + Content
 */
export default function HudPanel({
  children,
  className = '',
  style,
  label,
  status,
  tint,
}: HudPanelProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.45)',
        borderRadius: 22,
        boxShadow: [
          '0 8px 40px rgba(0, 0, 0, 0.10)',
          '0 2px 12px rgba(0, 0, 0, 0.06)',
          'inset 0 1px 1px rgba(255, 255, 255, 0.50)',
          'inset 0 -1px 1px rgba(255, 255, 255, 0.10)',
        ].join(', '),
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* ── Layer 0: Color tint ── */}
      {tint && (
        <div className="absolute inset-0 rounded-[inherit]" style={tint} />
      )}

      {/* ── Glass effect layers ── */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">

        {/* Layer 1: Frost — very light wash, keeps glass see-through */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              160deg,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0.06) 35%,
              rgba(255, 255, 255, 0.08) 65%,
              rgba(255, 255, 255, 0.05) 100%
            )`,
          }}
        />

        {/* Layer 2: Specular highlight — bright arc on top */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.45) 0%,
              rgba(255, 255, 255, 0.15) 12%,
              rgba(255, 255, 255, 0.04) 35%,
              transparent 50%
            )`,
          }}
        />

        {/* Layer 3: Moving light band — sweeps across for "liquid" feel */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 20%,
              rgba(255, 255, 255, 0.08) 38%,
              rgba(255, 255, 255, 0.18) 50%,
              rgba(255, 255, 255, 0.08) 62%,
              transparent 80%
            )`,
            backgroundSize: '250% 100%',
            animation: 'liquid-shift 5s ease-in-out infinite',
          }}
        />

        {/* Layer 4: Prismatic refraction */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              135deg,
              rgba(130, 200, 255, 0.08) 0%,
              rgba(255, 150, 220, 0.06) 30%,
              rgba(150, 255, 220, 0.07) 60%,
              rgba(200, 150, 255, 0.06) 100%
            )`,
            backgroundSize: '200% 200%',
            animation: 'prismatic-drift 10s ease infinite',
          }}
        />

        {/* Layer 4b: Bottom specular — glass reflects from below */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.10) 0%,
              rgba(255, 255, 255, 0.04) 10%,
              transparent 25%
            )`,
          }}
        />
      </div>

      {/* ── Layer 5: Edge highlights ── */}
      {/* Bright top specular line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(to right, transparent 5%, rgba(255, 255, 255, 0.80) 25%, rgba(255, 255, 255, 1.0) 50%, rgba(255, 255, 255, 0.80) 75%, transparent 95%)',
        }}
      />
      {/* Bottom subtle edge */}
      <div
        className="absolute inset-x-0 bottom-0 h-[1px] pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(to right, transparent 10%, rgba(255, 255, 255, 0.20) 50%, transparent 90%)',
        }}
      />
      {/* Side edges — brighter at top */}
      <div
        className="absolute inset-y-0 left-0 w-[1px] pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.18) 40%, rgba(255, 255, 255, 0.06) 100%)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[1px] pointer-events-none z-[2]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 40%, rgba(255, 255, 255, 0.04) 100%)',
        }}
      />

      {/* ── Labels ── */}
      {(label || status) && (
        <div className="absolute top-2.5 left-0 right-0 flex items-center justify-between px-3.5 pointer-events-none z-10">
          {label && (
            <span
              className="text-[8px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
              style={{
                color: 'rgba(255, 255, 255, 0.80)',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {label}
            </span>
          )}
          {status && (
            <span
              className="text-[7px] font-medium tracking-wider"
              style={{ color: 'rgba(255, 255, 255, 0.50)' }}
            >
              {status}
            </span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
