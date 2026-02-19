import { useState, useEffect } from 'react';

/**
 * Draws two translucent red rectangles showing the overlay position zones:
 *  - Left-top:  1/3 frame width × 1/8 frame height
 *  - Right-top: 1/3 frame width × 1/8 frame height
 * Toggled via postMessage from the admin panel.
 */
export default function PositionDebugOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'debug.positions') {
        setVisible(!!e.data.enabled);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!visible) return null;

  const zone: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    width: '33.33%',
    height: '12.5%',
    border: '2px dashed rgba(255, 59, 48, 0.8)',
    background: 'rgba(255, 59, 48, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const label: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: 'rgba(255, 59, 48, 0.95)',
    letterSpacing: '0.08em',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    textTransform: 'uppercase',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  };

  const zoneMid: React.CSSProperties = {
    ...zone,
    top: '12.5%',
    height: '16.67%',
  };

  const zoneMidWide: React.CSSProperties = {
    ...zone,
    top: '29.17%',
    left: 0,
    width: '100%',
    height: '20.83%', // 29.17% to 50%
  };

  const zoneBottom: React.CSSProperties = {
    ...zone,
    top: '50%',
    left: 0,
    width: '100%',
    height: undefined,
    bottom: 0,
  };

  const zoneCenterTop: React.CSSProperties = {
    ...zone,
    left: '33.33%',
    width: '33.34%',
    height: '6.67%',
  };

  return (
    <>
      <div style={{ ...zone, left: 0 }}>
        <span style={label}>Left Top</span>
      </div>
      <div style={zoneCenterTop}>
        <span style={label}>Center Top</span>
      </div>
      <div style={{ ...zone, right: 0 }}>
        <span style={label}>Right Top</span>
      </div>
      <div style={{ ...zoneMid, left: 0 }}>
        <span style={label}>Left Mid</span>
      </div>
      <div style={{ ...zoneMid, right: 0 }}>
        <span style={label}>Right Mid</span>
      </div>
      <div style={zoneMidWide}>
        <span style={label}>Mid Wide</span>
      </div>
      <div style={zoneBottom}>
        <span style={label}>Bottom</span>
      </div>
    </>
  );
}
