import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import HudPanel from './HudPanel';
import AnimatedPresence from './AnimatedPresence';

/** Soft violet → blue → lavender tinted glass */
const SUBTITLE_TINT = {
  background:
    'linear-gradient(-45deg, rgba(120, 80, 220, 0.25), rgba(80, 130, 240, 0.22), rgba(160, 100, 240, 0.20), rgba(100, 140, 255, 0.24), rgba(140, 80, 220, 0.25))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 10s ease infinite',
};

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);
  const lastText = useRef(text);
  if (text) lastText.current = text;

  return (
    <AnimatedPresence
      show={!!text}
      className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[80%]"
      duration={400}
      particleColor="rgba(160, 120, 255, 0.9)"
    >
      <HudPanel tint={SUBTITLE_TINT} style={{ borderRadius: 24 }}>
        <div className="px-8 py-4 text-center">
          <span
            className="text-lg font-semibold leading-snug tracking-[-0.01em]"
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 1px 6px rgba(80, 60, 160, 0.40)',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            }}
          >
            {lastText.current}
          </span>
        </div>
      </HudPanel>
    </AnimatedPresence>
  );
}
