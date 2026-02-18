import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import AnimatedPresence from './AnimatedPresence';
import { QRPanel } from './overlayPrimitives';

export default function QROverlay() {
  const qrUrl = useOverlayStore((s) => s.qrUrl);
  const lastUrl = useRef(qrUrl);
  if (qrUrl) lastUrl.current = qrUrl;

  return (
    <AnimatedPresence
      show={!!qrUrl}
      className="absolute bottom-[15%] right-[5%]"
      duration={400}
      particleColor="rgba(180, 100, 240, 0.9)"
    >
      <QRPanel url={lastUrl.current ?? ''} />
    </AnimatedPresence>
  );
}
