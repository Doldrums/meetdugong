import { useOverlayStore, type CardOverlayData } from '../../stores/overlayStore';
import HudPanel from './HudPanel';

export default function CardOverlay() {
  const cards = useOverlayStore((s) => s.cards);

  if (cards.size === 0) return null;

  return (
    <>
      {Array.from(cards.values()).map((card) => (
        <Card key={card.id} card={card} />
      ))}
    </>
  );
}

function Card({ card }: { card: CardOverlayData }) {
  const isRight = card.position !== 'left';

  return (
    <div
      className={`absolute top-[10%] ${isRight ? 'right-[5%]' : 'left-[5%]'} w-[35%] max-w-80`}
    >
      <HudPanel
        label="INFO"
        status="SYS.ACTIVE"
        scanSpeed={4}
        className="rounded-xl"
        style={{
          border: '1px solid oklch(0.78 0.12 195 / 18%)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow:
            '0 8px 40px oklch(0.78 0.12 195 / 6%), 0 0 1px oklch(0.90 0.05 210 / 40%), inset 0 1px 0 oklch(1 0 0 / 35%)',
        }}
      >
        {/* Image section */}
        {card.imageUrl && (
          <div className="relative overflow-hidden rounded-t-[inherit]">
            <img
              src={card.imageUrl}
              alt={card.title}
              className="w-full h-40 object-cover"
              style={{ opacity: 0.85 }}
            />
            {/* Bottom fade to panel glass */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, oklch(0.96 0.015 200 / 90%) 0%, oklch(0.96 0.015 200 / 30%) 40%, transparent 100%)',
              }}
            />
            {/* Side vignettes */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, oklch(0.96 0.015 200 / 25%) 0%, transparent 20%, transparent 80%, oklch(0.96 0.015 200 / 25%) 100%)',
              }}
            />
            {/* HUD grid over image */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(oklch(0.55 0.12 210 / 50%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.12 210 / 50%) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            {/* Image scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute left-0 right-0 h-px"
                style={{
                  background: 'oklch(0.72 0.10 190 / 25%)',
                  animation: 'hud-scan 2s linear infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Separator */}
        <div
          className="mx-4 h-px"
          style={{ background: 'linear-gradient(to right, transparent, oklch(0.72 0.10 190 / 20%), transparent)' }}
        />

        {/* Content */}
        <div className="p-4 pt-3 space-y-1.5">
          <h3
            className="font-bold text-base leading-tight"
            style={{ color: 'oklch(0.22 0.04 230)' }}
          >
            {card.title}
          </h3>
          {card.subtitle && (
            <p className="text-sm" style={{ color: 'oklch(0.45 0.04 220)' }}>
              {card.subtitle}
            </p>
          )}
          {card.price && (
            <p
              className="text-xl font-bold tracking-wide"
              style={{ color: 'oklch(0.45 0.14 195)' }}
            >
              {card.price}
            </p>
          )}
          {card.cta && (
            <>
              <div
                className="h-px w-2/3"
                style={{ background: 'linear-gradient(to right, oklch(0.72 0.10 190 / 18%), transparent)' }}
              />
              <p
                className="text-xs font-semibold uppercase tracking-[0.15em]"
                style={{ color: 'oklch(0.50 0.12 200)' }}
              >
                {card.cta}
              </p>
            </>
          )}
        </div>

        {/* Bottom data bar */}
        <div className="mx-4 mb-2 flex items-center gap-2 opacity-25">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, oklch(0.65 0.10 190 / 30%), transparent)' }} />
          <span
            className="text-[7px] font-mono tracking-wider"
            style={{ color: 'oklch(0.50 0.10 200)', animation: 'hud-flicker 4s infinite 2s' }}
          >
            DATA.READY
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, oklch(0.65 0.10 190 / 30%), transparent)' }} />
        </div>
      </HudPanel>

      {/* External particles */}
      <div
        className="absolute -top-2 left-[15%] w-1 h-1 rounded-full"
        style={{ background: 'oklch(0.75 0.12 195 / 30%)', animation: 'hud-pulse 4s ease-in-out 0.5s infinite' }}
      />
      <div
        className="absolute -bottom-2 right-[25%] w-1.5 h-1.5 rounded-full"
        style={{ background: 'oklch(0.70 0.10 185 / 25%)', animation: 'hud-pulse 3.5s ease-in-out 2s infinite' }}
      />
    </div>
  );
}
