import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import AnimatedPresence from './AnimatedPresence';
import { SubtitlePanel } from './overlayPrimitives';

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);
  const position = useOverlayStore((s) => s.subtitlePosition);
  const lastText = useRef(text);
  if (text) lastText.current = text;

  const slot = position ?? DEFAULT_OVERLAY_SLOTS.subtitle;
  const centered = slotNeedsCenterTransform(slot);

  return (
    <AnimatedPresence
      show={!!text}
      className={centered ? '-translate-x-1/2' : ''}
      style={slotToCss(slot)}
      duration={400}
      particleColor="rgba(160, 120, 255, 0.9)"
    >
      <SubtitlePanel text={lastText.current ?? ''} />
    </AnimatedPresence>
  );
}
