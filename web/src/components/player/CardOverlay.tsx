import { useState, useEffect, useRef } from 'react';
import { useOverlayStore, type CardOverlayData } from '../../stores/overlayStore';
import HudPanel from './HudPanel';
import ParticleBurst from './ParticleBurst';

const SF =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

/** Teal → blue → soft purple tinted glass */
const CARD_TINT = {
  background:
    'linear-gradient(-45deg, rgba(60, 160, 200, 0.22), rgba(80, 100, 220, 0.24), rgba(130, 80, 200, 0.20), rgba(60, 140, 210, 0.22), rgba(100, 80, 220, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 12s ease infinite',
};

const EXIT_DURATION = 400;

export default function CardOverlay() {
  const storeCards = useOverlayStore((s) => s.cards);
  const [exitingCards, setExitingCards] = useState(
    new Map<string, CardOverlayData>(),
  );
  const prevRef = useRef(storeCards);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = storeCards;

    // Detect removed cards → move to exiting pool
    const removed = new Map<string, CardOverlayData>();
    for (const [id, card] of prev) {
      if (!storeCards.has(id)) removed.set(id, card);
    }

    if (removed.size > 0) {
      setExitingCards((prev) => {
        const next = new Map(prev);
        for (const [id, card] of removed) next.set(id, card);
        return next;
      });

      // Flush exiting cards after animation completes
      setTimeout(() => {
        setExitingCards((prev) => {
          const next = new Map(prev);
          for (const id of removed.keys()) next.delete(id);
          return next;
        });
      }, EXIT_DURATION + 50);
    }
  }, [storeCards]);

  // Merge: active cards override exiting (if same id reappears)
  const allCards = new Map<string, { card: CardOverlayData; active: boolean }>();
  for (const [id, card] of exitingCards) {
    allCards.set(id, { card, active: false });
  }
  for (const [id, card] of storeCards) {
    allCards.set(id, { card, active: true });
  }

  if (allCards.size === 0) return null;

  return (
    <>
      {Array.from(allCards.entries()).map(([id, { card, active }]) => (
        <AnimatedCard key={id} card={card} active={active} />
      ))}
    </>
  );
}

// ── Individual Card with enter/exit animation ────────────────

function AnimatedCard({
  card,
  active,
}: {
  card: CardOverlayData;
  active: boolean;
}) {
  const [particles, setParticles] = useState(false);
  const [visible, setVisible] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(delayRef.current);
    if (active) {
      // Immediately trigger particles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setParticles(true));
      });
      // Delay panel reveal so particles arrive first
      delayRef.current = setTimeout(() => setVisible(true), 250);
    } else {
      setVisible(false);
      setParticles(false);
    }
    return () => clearTimeout(delayRef.current);
  }, [active]);

  const isRight = card.position !== 'left';

  return (
    <div
      className={`absolute top-[10%] ${isRight ? 'right-[5%]' : 'left-[5%]'} w-[35%] max-w-80`}
    >
      {/* Glass panel — delayed reveal */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? 'scale(1) translateY(0)'
            : 'scale(0.96) translateY(8px)',
          transition: [
            `opacity ${EXIT_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            `transform ${EXIT_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
          ].join(', '),
          backdropFilter: 'blur(8px) saturate(140%) brightness(105%)',
          WebkitBackdropFilter: 'blur(8px) saturate(140%) brightness(105%)',
          borderRadius: 22,
          overflow: 'hidden',
        }}
      >
        <HudPanel tint={CARD_TINT} style={{ borderRadius: 22 }}>
          {/* Hero image */}
          {card.imageUrl && (
            <div className="relative overflow-hidden rounded-t-[22px]">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-40 object-cover"
                style={{ opacity: 0.80 }}
              />
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
          <div className="px-4 pb-4 pt-3 space-y-1.5" style={{ fontFamily: SF }}>
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
      </div>
      <ParticleBurst trigger={particles} color="rgba(120, 180, 255, 0.9)" />
    </div>
  );
}
