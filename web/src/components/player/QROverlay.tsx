import { useOverlayStore } from '../../stores/overlayStore';
import HudPanel from './HudPanel';

export default function QROverlay() {
  const qrUrl = useOverlayStore((s) => s.qrUrl);

  if (!qrUrl) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="absolute bottom-[15%] right-[5%]">
      <HudPanel
        label="SCAN"
        status="● ACTIVE"
        scanSpeed={3}
        className="rounded-xl"
        style={{
          border: '1px solid oklch(0.78 0.12 195 / 18%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow:
            '0 8px 40px oklch(0.78 0.12 195 / 6%), 0 0 1px oklch(0.90 0.05 210 / 40%), inset 0 1px 0 oklch(1 0 0 / 35%)',
        }}
      >
        <div className="p-4 pt-6 flex flex-col items-center gap-2.5">
          {/* QR code with targeting brackets */}
          <div className="relative">
            <div
              className="rounded-lg overflow-hidden p-1.5 bg-white"
              style={{ border: '1px solid oklch(0.80 0.08 200 / 20%)' }}
            >
              <img src={qrImageUrl} alt="QR Code" className="w-32 h-32" />
            </div>
            {/* Targeting brackets — teal/cyan */}
            <div className="absolute -top-1 -left-1 w-4 h-4 rounded-tl-sm" style={{ borderTop: '1.5px solid oklch(0.72 0.10 190 / 50%)', borderLeft: '1.5px solid oklch(0.72 0.10 190 / 50%)' }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-tr-sm" style={{ borderTop: '1.5px solid oklch(0.72 0.10 195 / 50%)', borderRight: '1.5px solid oklch(0.72 0.10 195 / 50%)' }} />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-bl-sm" style={{ borderBottom: '1.5px solid oklch(0.72 0.10 195 / 50%)', borderLeft: '1.5px solid oklch(0.72 0.10 195 / 50%)' }} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-br-sm" style={{ borderBottom: '1.5px solid oklch(0.72 0.10 190 / 50%)', borderRight: '1.5px solid oklch(0.72 0.10 190 / 50%)' }} />
            {/* Scanning line over QR */}
            <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 overflow-hidden pointer-events-none rounded-lg">
              <div
                className="absolute left-0 right-0 h-0.5"
                style={{
                  background: 'oklch(0.72 0.10 190 / 30%)',
                  animation: 'hud-scan 2s linear infinite',
                }}
              />
            </div>
          </div>

          {/* URL label */}
          <div className="flex items-center gap-2 max-w-36">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, oklch(0.72 0.10 190 / 20%))' }} />
            <p
              className="text-[10px] font-mono tracking-wide truncate"
              style={{ color: 'oklch(0.45 0.06 210)' }}
            >
              {qrUrl.replace(/^https?:\/\//, '')}
            </p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, oklch(0.72 0.10 190 / 20%))' }} />
          </div>
        </div>
      </HudPanel>

      {/* External particle */}
      <div
        className="absolute -top-2 right-[30%] w-1 h-1 rounded-full"
        style={{ background: 'oklch(0.75 0.12 195 / 30%)', animation: 'hud-pulse 3s ease-in-out 1s infinite' }}
      />
    </div>
  );
}
