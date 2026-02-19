import { useOverlayStore } from '../../stores/overlayStore';
import AnimatedPresence from './AnimatedPresence';
import {
  StateBadgePanel,
  ActionFeedPanel,
  ThinkingPanel,
  EventToastPanel,
} from './overlayPrimitives';

export default function AgentOverlay() {
  const agentState = useOverlayStore((s) => s.agentState);
  const agentAction = useOverlayStore((s) => s.agentAction);
  const agentThinking = useOverlayStore((s) => s.agentThinking);
  const agentEvent = useOverlayStore((s) => s.agentEvent);

  return (
    <>
      {/* State badge — top-left */}
      <AnimatedPresence
        show={!!agentState}
        className="absolute top-[4%] left-[4%]"
        duration={350}
        particleColor="rgba(240, 180, 80, 0.9)"
      >
        {agentState && <StateBadgePanel data={agentState} />}
      </AnimatedPresence>

      {/* Action feed — left side, below state badge */}
      <AnimatedPresence
        show={!!agentAction}
        className="absolute top-[16%] left-[4%] w-[32%] max-w-96"
        duration={400}
        particleColor="rgba(80, 180, 255, 0.9)"
      >
        {agentAction && <ActionFeedPanel data={agentAction} />}
      </AnimatedPresence>

      {/* Thinking — center, upper area */}
      <AnimatedPresence
        show={!!agentThinking}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[40%] max-w-lg"
        duration={400}
        particleColor="rgba(160, 120, 255, 0.9)"
      >
        {agentThinking && <ThinkingPanel data={agentThinking} />}
      </AnimatedPresence>

      {/* Event toast — bottom-right */}
      <AnimatedPresence
        show={!!agentEvent}
        className="absolute bottom-[6%] right-[4%] max-w-md"
        duration={300}
        particleColor="rgba(80, 220, 180, 0.9)"
      >
        {agentEvent && <EventToastPanel data={agentEvent} />}
      </AnimatedPresence>
    </>
  );
}
