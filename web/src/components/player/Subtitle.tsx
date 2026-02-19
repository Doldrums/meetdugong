import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import { useOccupiedZones } from '../../hooks/useOccupiedZones';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import AnimatedPresence from './AnimatedPresence';
import { SubtitlePanel } from './overlayPrimitives';

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);
  const position = useOverlayStore((s) => s.subtitlePosition);
  const occupied = useOccupiedZones();
  const lastText = useRef(text);
  const lastPosition = useRef(position);
  if (text) {
    lastText.current = text;
    lastPosition.current = position;
  }

  const slot = lastPosition.current ?? DEFAULT_OVERLAY_SLOTS.subtitle;
  const centered = slotNeedsCenterTransform(slot);

  return (
    <AnimatedPresence
      show={!!text}
      className={centered ? '-translate-x-1/2' : ''}
      style={slotToCss(slot, occupied)}
      duration={400}
      particleColor="rgba(160, 120, 255, 0.9)"
    >
      <SubtitlePanel text={lastText.current ?? ''} />
    </AnimatedPresence>
  );
}
