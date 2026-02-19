import { useState, useEffect, useRef, type ReactNode } from 'react';
import ParticleBurst from './ParticleBurst';

interface AnimatedPresenceProps {
  /** Controls visibility — false triggers exit animation before unmount */
  show: boolean;
  children: ReactNode;
  className?: string;
  /** Extra inline styles merged onto the outer wrapper */
  style?: React.CSSProperties;
  /** Animation duration in ms */
  duration?: number;
  /** Particle glow color */
  particleColor?: string;
}

/**
 * Wrapper that animates children in/out with particle entrance.
 * On show=true:  mounts → particles converge → panel materializes.
 * On show=false: triggers exit transition → unmounts after duration.
 */
export default function AnimatedPresence({
  show,
  children,
  className = '',
  style: styleProp,
  duration = 400,
  particleColor = 'rgba(255, 255, 255, 0.9)',
}: AnimatedPresenceProps) {
  const [render, setRender] = useState(false);
  const [particles, setParticles] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Stable random float params so each instance bobs independently
  const floatRef = useRef({
    duration: 3.5 + Math.random() * 2,
    delay: Math.random() * -5,
  });

  useEffect(() => {
    clearTimeout(timerRef.current);
    clearTimeout(delayRef.current);

    if (show) {
      setRender(true);
      // Immediately trigger particles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setParticles(true));
      });
      // Delay panel reveal so particles arrive first
      delayRef.current = setTimeout(() => {
        setVisible(true);
      }, 250);
    } else {
      setVisible(false);
      setParticles(false);
      timerRef.current = setTimeout(() => setRender(false), duration);
    }

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(delayRef.current);
    };
  }, [show, duration]);

  if (!render) return null;

  const floatStyle = visible
    ? { animation: `overlay-float ${floatRef.current.duration}s ease-in-out ${floatRef.current.delay}s infinite` }
    : undefined;

  return (
    <div
      className={className}
      style={styleProp}
    >
      {/* Float wrapper — bobs inside the clipped outer div */}
      <div style={floatStyle}>
        {/* Glass panel — delayed reveal */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? 'scale(1) translateY(0)'
              : 'scale(0.96) translateY(8px)',
            transition: [
              `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            ].join(', '),
            background: 'rgba(15, 20, 40, 0.20)',
            backdropFilter: 'blur(8px) saturate(140%) brightness(105%)',
            WebkitBackdropFilter: 'blur(8px) saturate(140%) brightness(105%)',
            borderRadius: 22,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
        <ParticleBurst trigger={particles} color={particleColor} />
      </div>
    </div>
  );
}
