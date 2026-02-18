import type { ReactNode } from 'react';
import type { CardOverlayData } from '../../stores/overlayStore';
import HudPanel from './HudPanel';

// ── Shared constants ──

/** Soft violet → blue → lavender tinted glass */
export const SUBTITLE_TINT = {
  background:
    'linear-gradient(-45deg, rgba(120, 80, 220, 0.25), rgba(80, 130, 240, 0.22), rgba(160, 100, 240, 0.20), rgba(100, 140, 255, 0.24), rgba(140, 80, 220, 0.25))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 10s ease infinite',
};

/** Teal → blue → soft purple tinted glass */
export const CARD_TINT = {
  background:
    'linear-gradient(-45deg, rgba(60, 160, 200, 0.22), rgba(80, 100, 220, 0.24), rgba(130, 80, 200, 0.20), rgba(60, 140, 210, 0.22), rgba(100, 80, 220, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 12s ease infinite',
};

/** Rose → violet → indigo tinted glass */
export const QR_TINT = {
  background:
    'linear-gradient(-45deg, rgba(160, 80, 200, 0.24), rgba(200, 90, 170, 0.20), rgba(100, 110, 240, 0.22), rgba(160, 70, 210, 0.24), rgba(120, 100, 240, 0.20))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 8s ease infinite',
};

/** Showcase tint for bare glass demo */
export const GLASS_TINT = {
  background:
    'linear-gradient(-45deg, rgba(100, 140, 200, 0.50), rgba(120, 120, 180, 0.48), rgba(80, 160, 200, 0.45), rgba(140, 100, 200, 0.48))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 14s ease infinite',
};

/** Apple SF Pro font stack */
export const SF_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// ── SubtitlePanel ──

export function SubtitlePanel({ text }: { text: string }) {
  return (
    <HudPanel tint={SUBTITLE_TINT} style={{ borderRadius: 24 }}>
      <div className="px-8 py-4 text-center">
        <span
          className="text-lg font-semibold leading-snug tracking-[-0.01em]"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 6px rgba(80, 60, 160, 0.40)',
            fontFamily: SF_FONT,
          }}
        >
          {text}
        </span>
      </div>
    </HudPanel>
  );
}

// ── CardPanel ──

export function CardPanel({
  card,
  imageSlot,
}: {
  card: CardOverlayData;
  imageSlot?: ReactNode;
}) {
  const heroImage = imageSlot ?? (
    card.imageUrl ? (
      <img
        src={card.imageUrl}
        alt={card.title}
        className="w-full h-40 object-cover"
        style={{ opacity: 0.80 }}
      />
    ) : null
  );

  return (
    <HudPanel tint={CARD_TINT} style={{ borderRadius: 22 }}>
      {/* Hero image */}
      {heroImage && (
        <div className="relative overflow-hidden rounded-t-[22px]">
          {heroImage}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to top,
                rgba(80, 120, 200, 0.65) 0%,
                rgba(80, 120, 200, 0.25) 40%,
                transparent 75%
              )`,
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4 pt-3 space-y-1.5" style={{ fontFamily: SF_FONT }}>
        <h3
          className="font-bold text-base leading-tight"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 4px rgba(40, 80, 160, 0.35)',
          }}
        >
          {card.title}
        </h3>

        {card.subtitle && (
          <p
            className="text-sm leading-snug"
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              textShadow: '0 1px 3px rgba(40, 80, 160, 0.20)',
            }}
          >
            {card.subtitle}
          </p>
        )}

        {card.price && (
          <p
            className="text-lg font-bold"
            style={{
              color: '#fff',
              textShadow: '0 0 12px rgba(255, 255, 255, 0.40)',
            }}
          >
            {card.price}
          </p>
        )}

        {card.cta && (
          <>
            <div
              className="h-px w-full mt-2 mb-1.5"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.25), transparent)',
              }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: 'rgba(255, 255, 255, 0.85)' }}
            >
              {card.cta}
            </p>
          </>
        )}
      </div>
    </HudPanel>
  );
}

// ── QRPanel ──

export function QRPanel({
  url,
  qrSlot,
}: {
  url: string;
  qrSlot?: ReactNode;
}) {
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const qrContent = qrSlot ?? (
    <img
      src={qrImageUrl}
      alt="QR Code"
      className="relative w-36 h-36"
      style={{ borderRadius: 6 }}
    />
  );

  return (
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
          {qrContent}
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
            {url.replace(/^https?:\/\//, '')}
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
  );
}
