import Subtitle from './Subtitle';
import CardOverlay from './CardOverlay';
import QROverlay from './QROverlay';
import AgentOverlay from './AgentOverlay';

export default function OverlayLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <Subtitle />
      <CardOverlay />
      <QROverlay />
      <AgentOverlay />
    </div>
  );
}
