import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import HudPanel from './HudPanel';
import AnimatedPresence from './AnimatedPresence';

/** Rose → violet → indigo tinted glass */
const QR_TINT = {
  background:
    'linear-gradient(-45deg, rgba(160, 80, 200, 0.24), rgba(200, 90, 170, 0.20), rgba(100, 110, 240, 0.22), rgba(160, 70, 210, 0.24), rgba(120, 100, 240, 0.20))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 8s ease infinite',
};

export default function QROverlay() {
  const qrUrl = useOverlayStore((s) => s.qrUrl);
  const lastUrl = useRef(qrUrl);
  if (qrUrl) lastUrl.current = qrUrl;

  const displayUrl = lastUrl.current ?? '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(displayUrl)}`;

  return (
    <AnimatedPresence
      show={!!qrUrl}
      className="absolute bottom-[15%] right-[5%]"
      duration={400}
      particleColor="rgba(180, 100, 240, 0.9)"
    >
      <HudPanel tint={QR_TINT} style={{ borderRadius: 22 }}>
        <div className="p-3 flex flex-col items-center gap-2">
          {/* QR code — frosted glass container */}
          <div
            className="relative rounded-xl overflow-hidden p-1.5"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(240,240,255,0.65))',
              backdropFilter: 'blur(12px) brightness(110%)',
              WebkitBackdropFilter: 'blur(12px) brightness(110%)',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: [
                '0 4px 16px rgba(120, 80, 200, 0.15)',
                'inset 0 1px 0 rgba(255,255,255,0.8)',
                'inset 0 -1px 0 rgba(255,255,255,0.2)',
              ].join(', '),
            }}
          >
            {/* Specular shine */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                borderRadius: 'inherit',
              }}
            />
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="relative w-36 h-36"
              style={{ borderRadius: 6 }}
            />
          </div>

          {/* URL label */}
          <div className="flex items-center gap-1.5 max-w-28">
            <div
              className="h-px flex-1"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.25))',
              }}
            />
            <p
              className="text-[10px] font-medium text-center truncate"
              style={{
                color: 'rgba(255, 255, 255, 0.65)',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {displayUrl.replace(/^https?:\/\//, '')}
            </p>
            <div
              className="h-px flex-1"
              style={{
                background:
                  'linear-gradient(to left, transparent, rgba(255, 255, 255, 0.25))',
              }}
            />
          </div>
        </div>
      </HudPanel>
    </AnimatedPresence>
  );
}
