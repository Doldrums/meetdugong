import { useRef } from 'react';
import { useOverlayStore } from '../../stores/overlayStore';
import { useOccupiedZones } from '../../hooks/useOccupiedZones';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import type { OverlaySlot } from '@shared/overlayPositions';
import AnimatedPresence from './AnimatedPresence';
import {
  StateBadgePanel,
  ActionFeedPanel,
  ThinkingPanel,
  EventToastPanel,
} from './overlayPrimitives';

function useSlotRef(
  position: OverlaySlot | null,
  active: boolean,
  key: string,
  occupied: ReadonlySet<OverlaySlot>,
) {
  const last = useRef(position);
  if (active && position) last.current = position;
  const slot = last.current ?? DEFAULT_OVERLAY_SLOTS[key];
  return { style: slotToCss(slot, occupied), centered: slotNeedsCenterTransform(slot) };
}

export default function AgentOverlay() {
  const agentState = useOverlayStore((s) => s.agentState);
  const agentStatePosition = useOverlayStore((s) => s.agentStatePosition);
  const agentAction = useOverlayStore((s) => s.agentAction);
  const agentActionPosition = useOverlayStore((s) => s.agentActionPosition);
  const agentThinking = useOverlayStore((s) => s.agentThinking);
  const agentThinkingPosition = useOverlayStore((s) => s.agentThinkingPosition);
  const agentEvent = useOverlayStore((s) => s.agentEvent);
  const agentEventPosition = useOverlayStore((s) => s.agentEventPosition);
  const occupied = useOccupiedZones();

  const stateSlot = useSlotRef(agentStatePosition, !!agentState, 'agentState', occupied);
  const actionSlot = useSlotRef(agentActionPosition, !!agentAction, 'agentAction', occupied);
  const thinkingSlot = useSlotRef(agentThinkingPosition, !!agentThinking, 'agentThinking', occupied);
  const eventSlot = useSlotRef(agentEventPosition, !!agentEvent, 'agentEvent', occupied);

  // Random horizontal offset for thinking panel — re-rolls each time it appears
  const thinkingOffset = useRef({ left: `${25 + Math.random() * 50}%` });
  const prevThinking = useRef(agentThinking);
  if (agentThinking && agentThinking !== prevThinking.current) {
    thinkingOffset.current = { left: `${25 + Math.random() * 50}%` };
  }
  prevThinking.current = agentThinking;

  return (
    <>
      {/* State badge */}
      <AnimatedPresence
        show={!!agentState}
        className={stateSlot.centered ? '-translate-x-1/2' : ''}
        style={stateSlot.style}
        duration={350}
        particleColor="rgba(240, 180, 80, 0.9)"
      >
        {agentState && <StateBadgePanel data={agentState} />}
      </AnimatedPresence>

      {/* Action feed */}
      <AnimatedPresence
        show={!!agentAction}
        className={actionSlot.centered ? '-translate-x-1/2' : ''}
        style={actionSlot.style}
        duration={400}
        particleColor="rgba(80, 180, 255, 0.9)"
      >
        {agentAction && <ActionFeedPanel data={agentAction} />}
      </AnimatedPresence>

      {/* Thinking */}
      <AnimatedPresence
        show={!!agentThinking}
        className={thinkingSlot.centered ? '-translate-x-1/2' : ''}
        style={{ ...thinkingSlot.style, ...thinkingOffset.current }}
        duration={400}
        particleColor="rgba(160, 120, 255, 0.9)"
      >
        {agentThinking && <ThinkingPanel data={agentThinking} />}
      </AnimatedPresence>

      {/* Event toast */}
      <AnimatedPresence
        show={!!agentEvent}
        className={eventSlot.centered ? '-translate-x-1/2' : ''}
        style={eventSlot.style}
        duration={300}
        particleColor="rgba(80, 220, 180, 0.9)"
      >
        {agentEvent && <EventToastPanel data={agentEvent} />}
      </AnimatedPresence>
    </>
  );
}
