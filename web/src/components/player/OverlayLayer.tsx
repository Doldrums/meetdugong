import Subtitle from './Subtitle';
import CardOverlay from './CardOverlay';
import QROverlay from './QROverlay';
import AgentOverlay from './AgentOverlay';
import PositionDebugOverlay from './PositionDebugOverlay';

export default function OverlayLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <PositionDebugOverlay />
      <Subtitle />
      <CardOverlay />
      <QROverlay />
      <AgentOverlay />
    </div>
  );
}
