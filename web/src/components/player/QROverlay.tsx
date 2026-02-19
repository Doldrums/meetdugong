import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import { useOccupiedZones } from '../../hooks/useOccupiedZones';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import AnimatedPresence from './AnimatedPresence';
import { QRPanel } from './overlayPrimitives';

export default function QROverlay() {
  const qrUrl = useOverlayStore((s) => s.qrUrl);
  const position = useOverlayStore((s) => s.qrPosition);
  const occupied = useOccupiedZones();
  const lastUrl = useRef(qrUrl);
  const lastPosition = useRef(position);
  if (qrUrl) {
    lastUrl.current = qrUrl;
    lastPosition.current = position;
  }

  const slot = lastPosition.current ?? DEFAULT_OVERLAY_SLOTS.qr;
  const centered = slotNeedsCenterTransform(slot);

  return (
    <AnimatedPresence
      show={!!qrUrl}
      className={centered ? '-translate-x-1/2' : ''}
      style={slotToCss(slot, occupied)}
      duration={400}
      particleColor="rgba(180, 100, 240, 0.9)"
    >
      <QRPanel url={lastUrl.current ?? ''} />
    </AnimatedPresence>
  );
}
