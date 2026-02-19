import Subtitle from './Subtitle';
import CardOverlay from './CardOverlay';
import QROverlay from './QROverlay';
import AgentOverlay from './AgentOverlay';
import PositionDebugOverlay from './PositionDebugOverlay';
import AmbientSparkles from './AmbientSparkles';

export default function OverlayLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      <AmbientSparkles />
      <PositionDebugOverlay />
      <Subtitle />
      <CardOverlay />
      <QROverlay />
      <AgentOverlay />
    </div>
  );
}
