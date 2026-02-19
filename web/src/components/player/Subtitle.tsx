import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import AnimatedPresence from './AnimatedPresence';
import { SubtitlePanel } from './overlayPrimitives';

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);
  const lastText = useRef(text);
  if (text) lastText.current = text;

  return (
    <AnimatedPresence
      show={!!text}
      className="absolute bottom-[6%] left-1/2 -translate-x-1/2 max-w-[90%]"
      duration={400}
      particleColor="rgba(160, 120, 255, 0.9)"
    >
      <SubtitlePanel text={lastText.current ?? ''} />
    </AnimatedPresence>
  );
}
