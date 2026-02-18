import { useOverlayStore } from '../../stores/overlayStore';
import HudPanel from './HudPanel';

export default function Subtitle() {
  const text = useOverlayStore((s) => s.subtitleText);

  if (!text) return null;

  return (
    <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[80%]">
      <HudPanel
        label="SUBTITLE"
        status="● LIVE"
        scanSpeed={2.5}
        className="rounded-lg"
        style={{
          border: '1px solid oklch(0.78 0.12 195 / 20%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow:
            '0 4px 30px oklch(0.78 0.12 195 / 8%), 0 0 1px oklch(0.90 0.05 210 / 40%), inset 0 1px 0 oklch(1 0 0 / 30%)',
        }}
      >
        {/* Side accent lines */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2.5 w-6 pointer-events-none z-10">
          <div className="h-px" style={{ background: 'linear-gradient(to right, oklch(0.72 0.10 190 / 35%), transparent)' }} />
          <div className="h-px mt-1 w-3" style={{ background: 'linear-gradient(to right, oklch(0.68 0.10 180 / 20%), transparent)' }} />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 w-6 pointer-events-none z-10">
          <div className="h-px" style={{ background: 'linear-gradient(to left, oklch(0.72 0.10 190 / 35%), transparent)' }} />
          <div className="h-px mt-1 w-3 ml-auto" style={{ background: 'linear-gradient(to left, oklch(0.68 0.10 180 / 20%), transparent)' }} />
        </div>

        <div className="px-10 py-3.5 text-center">
          <span
            className="text-lg font-medium tracking-wide leading-snug relative"
            style={{ color: 'oklch(0.25 0.04 230)' }}
          >
            {text}
          </span>
        </div>
      </HudPanel>
    </div>
  );
}
