import { useState, useEffect } from 'react';

/**
 * Draws translucent rectangles showing the available overlay position zones.
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

  const label: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: 'rgba(255, 59, 48, 0.95)',
    letterSpacing: '0.08em',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    textTransform: 'uppercase',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  };

  const base: React.CSSProperties = {
    position: 'absolute',
    border: '2px dashed rgba(255, 59, 48, 0.8)',
    background: 'rgba(255, 59, 48, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Mid Wide */}
      <div style={{ ...base, top: '30%', left: 0, width: '100%', height: '20%' }}>
        <span style={label}>Mid Wide</span>
      </div>
      {/* Bottom */}
      <div style={{ ...base, top: '50%', left: 0, width: '100%', bottom: 0 }}>
        <span style={label}>Bottom</span>
      </div>
    </>
  );
}
