import Subtitle from './Subtitle';
import CardOverlay from './CardOverlay';
import QROverlay from './QROverlay';

export default function OverlayLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <Subtitle />
      <CardOverlay />
      <QROverlay />
    </div>
  );
}
