import { useRef } from 'react';

/** Spread across the full 9:16 player frame */
const SPARKLES = [
  // Top area
  { x: '8%',  y: '5%',  size: 2.5, glow: 4, dur: 3.2, delay: 0,   anim: 'sparkle-twinkle' },
  { x: '72%', y: '3%',  size: 2,   glow: 3, dur: 4.5, delay: 1.8, anim: 'sparkle-drift' },
  { x: '35%', y: '8%',  size: 1.5, glow: 2, dur: 3.8, delay: 0.6, anim: 'sparkle-twinkle' },
  { x: '90%', y: '10%', size: 2,   glow: 3, dur: 4.0, delay: 2.4, anim: 'sparkle-drift' },
  // Upper-mid
  { x: '15%', y: '20%', size: 2,   glow: 3, dur: 4.2, delay: 1.0, anim: 'sparkle-twinkle' },
  { x: '60%', y: '18%', size: 2.5, glow: 4, dur: 3.5, delay: 0.3, anim: 'sparkle-drift' },
  { x: '82%', y: '24%', size: 1.5, glow: 2, dur: 4.8, delay: 2.0, anim: 'sparkle-twinkle' },
  // Mid
  { x: '5%',  y: '40%', size: 2,   glow: 3, dur: 3.6, delay: 1.5, anim: 'sparkle-drift' },
  { x: '48%', y: '35%', size: 2.5, glow: 4, dur: 4.4, delay: 0.8, anim: 'sparkle-twinkle' },
  { x: '92%', y: '42%', size: 2,   glow: 3, dur: 3.9, delay: 2.6, anim: 'sparkle-drift' },
  { x: '28%', y: '48%', size: 1.5, glow: 2, dur: 4.1, delay: 0.2, anim: 'sparkle-twinkle' },
  // Lower-mid
  { x: '70%', y: '55%', size: 2,   glow: 3, dur: 3.4, delay: 1.3, anim: 'sparkle-drift' },
  { x: '12%', y: '62%', size: 2.5, glow: 4, dur: 4.6, delay: 0.5, anim: 'sparkle-twinkle' },
  { x: '55%', y: '65%', size: 1.5, glow: 2, dur: 3.7, delay: 2.2, anim: 'sparkle-drift' },
  // Bottom area
  { x: '85%', y: '75%', size: 2,   glow: 3, dur: 4.3, delay: 1.7, anim: 'sparkle-twinkle' },
  { x: '22%', y: '80%', size: 2.5, glow: 4, dur: 3.3, delay: 0.9, anim: 'sparkle-drift' },
  { x: '65%', y: '85%', size: 2,   glow: 3, dur: 4.0, delay: 2.8, anim: 'sparkle-twinkle' },
  { x: '40%', y: '90%', size: 1.5, glow: 2, dur: 3.5, delay: 0.1, anim: 'sparkle-drift' },
  { x: '8%',  y: '92%', size: 2,   glow: 3, dur: 4.7, delay: 1.4, anim: 'sparkle-twinkle' },
  { x: '93%', y: '88%', size: 2.5, glow: 4, dur: 3.8, delay: 2.1, anim: 'sparkle-drift' },
];

export default function AmbientSparkles() {
  // Stable ref so sparkles don't re-render
  const sparkles = useRef(SPARKLES);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {sparkles.current.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: `0 0 ${s.glow}px rgba(255, 255, 255, 0.60), 0 0 ${s.glow * 2}px rgba(200, 220, 255, 0.30)`,
            animation: `${s.anim} ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
