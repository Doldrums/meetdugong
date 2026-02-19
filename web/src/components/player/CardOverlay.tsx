import { useState, useEffect, useRef } from 'react';
import { useOverlayStore, type CardOverlayData } from '../../stores/overlayStore';
import { useOccupiedZones } from '../../hooks/useOccupiedZones';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import type { OverlaySlot } from '@shared/overlayPositions';
import ParticleBurst from './ParticleBurst';
import { CardPanel } from './overlayPrimitives';

const EXIT_DURATION = 400;

export default function CardOverlay() {
  const storeCards = useOverlayStore((s) => s.cards);
  const occupied = useOccupiedZones();
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
        <AnimatedCard key={id} card={card} active={active} occupied={occupied} />
      ))}
    </>
  );
}

// ── Individual Card with enter/exit animation ────────────────

function AnimatedCard({
  card,
  active,
  occupied,
}: {
  card: CardOverlayData;
  active: boolean;
  occupied: ReadonlySet<OverlaySlot>;
}) {
  const [particles, setParticles] = useState(false);
  const [visible, setVisible] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const floatRef = useRef({
    duration: 3.5 + Math.random() * 2,
    delay: Math.random() * -5,
  });

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

  const slot = card.position ?? DEFAULT_OVERLAY_SLOTS.card;
  const posStyle = slotToCss(slot, occupied);
  const centered = slotNeedsCenterTransform(slot);

  const floatStyle = visible
    ? { animation: `overlay-float ${floatRef.current.duration}s ease-in-out ${floatRef.current.delay}s infinite` }
    : undefined;

  return (
    <div
      className={centered ? '-translate-x-1/2' : ''}
      style={posStyle}
    >
      {/* Float wrapper — bobs inside the clipped outer div */}
      <div style={floatStyle}>
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
          <CardPanel card={card} />
        </div>
        <ParticleBurst trigger={particles} color="rgba(120, 180, 255, 0.9)" />
      </div>
    </div>
  );
}
