import { useOverlayStore } from '../../stores/overlayStore';
import { slotToCss, slotNeedsCenterTransform, DEFAULT_OVERLAY_SLOTS } from '@shared/overlayPositions';
import type { OverlaySlot } from '@shared/overlayPositions';
import AnimatedPresence from './AnimatedPresence';
import {
  StateBadgePanel,
  ActionFeedPanel,
  ThinkingPanel,
  EventToastPanel,
} from './overlayPrimitives';

function resolveSlot(position: OverlaySlot | null, key: string) {
  const slot = position ?? DEFAULT_OVERLAY_SLOTS[key];
  return { style: slotToCss(slot), centered: slotNeedsCenterTransform(slot) };
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

  const stateSlot = resolveSlot(agentStatePosition, 'agentState');
  const actionSlot = resolveSlot(agentActionPosition, 'agentAction');
  const thinkingSlot = resolveSlot(agentThinkingPosition, 'agentThinking');
  const eventSlot = resolveSlot(agentEventPosition, 'agentEvent');

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
        className={`w-[55%] max-w-96 ${actionSlot.centered ? '-translate-x-1/2' : ''}`}
        style={actionSlot.style}
        duration={400}
        particleColor="rgba(80, 180, 255, 0.9)"
      >
        {agentAction && <ActionFeedPanel data={agentAction} />}
      </AnimatedPresence>

      {/* Thinking */}
      <AnimatedPresence
        show={!!agentThinking}
        className={`w-[75%] max-w-lg ${thinkingSlot.centered ? '-translate-x-1/2' : ''}`}
        style={thinkingSlot.style}
        duration={400}
        particleColor="rgba(160, 120, 255, 0.9)"
      >
        {agentThinking && <ThinkingPanel data={agentThinking} />}
      </AnimatedPresence>

      {/* Event toast */}
      <AnimatedPresence
        show={!!agentEvent}
        className={`w-[90%] max-w-md ${eventSlot.centered ? '-translate-x-1/2' : ''}`}
        style={eventSlot.style}
        duration={300}
        particleColor="rgba(80, 220, 180, 0.9)"
      >
        {agentEvent && <EventToastPanel data={agentEvent} />}
      </AnimatedPresence>
    </>
  );
}
