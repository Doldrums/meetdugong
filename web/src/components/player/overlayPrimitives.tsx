import type { ReactNode } from 'react';
import type { CardOverlayData, AgentStateData, AgentActionData, AgentThinkingData, AgentEventData } from '../../stores/overlayStore';
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
      <div className="px-8 py-4 text-center whitespace-pre-line">
        <span
          className="text-lg font-semibold leading-snug tracking-[-0.01em] whitespace-pre-line"
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
          className="font-bold text-base leading-tight whitespace-pre-line"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 4px rgba(40, 80, 160, 0.35)',
          }}
        >
          {card.title}
        </h3>

        {card.subtitle && (
          <p
            className="text-sm leading-snug whitespace-pre-line"
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
            className="text-lg font-bold whitespace-nowrap"
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
              className="text-xs font-semibold whitespace-nowrap"
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

// ── State color mapping for agent overlays ──

const STATE_COLORS: Record<string, string> = {
  IDLE:      'rgba(120, 200, 180, 0.85)',
  AWARE:     'rgba(240, 180, 60, 0.85)',
  LISTEN:    'rgba(80, 190, 255, 0.85)',
  THINK:     'rgba(255, 180, 50, 0.85)',
  SHOW:      'rgba(160, 100, 240, 0.85)',
  SPEAK:     'rgba(80, 220, 160, 0.85)',
  HAPPY:     'rgba(255, 140, 180, 0.85)',
  GREETING:  'rgba(255, 200, 80, 0.85)',
  ADJUSTCAP: 'rgba(180, 160, 220, 0.85)',
};

const STATE_FALLBACK_COLOR = 'rgba(160, 180, 220, 0.85)';

export function getStateColor(state: string): string {
  return STATE_COLORS[state.toUpperCase()] ?? STATE_FALLBACK_COLOR;
}

/** Amber → gold → warm glow for agent state */
export const AGENT_STATE_TINT = {
  background:
    'linear-gradient(-45deg, rgba(240, 160, 40, 0.24), rgba(200, 120, 60, 0.22), rgba(255, 180, 80, 0.20), rgba(220, 140, 50, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 8s ease infinite',
};

/** Electric blue → cyan for agent action */
export const AGENT_ACTION_TINT = {
  background:
    'linear-gradient(-45deg, rgba(40, 140, 255, 0.24), rgba(60, 180, 240, 0.22), rgba(80, 120, 255, 0.20), rgba(40, 160, 220, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 6s ease infinite',
};

/** Purple → indigo for thinking */
export const AGENT_THINKING_TINT = {
  background:
    'linear-gradient(-45deg, rgba(140, 80, 240, 0.26), rgba(100, 60, 220, 0.24), rgba(160, 100, 255, 0.22), rgba(120, 70, 240, 0.26))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 12s ease infinite',
};

/** Teal → green → fresh for event toast */
export const AGENT_EVENT_TINT = {
  background:
    'linear-gradient(-45deg, rgba(40, 200, 160, 0.24), rgba(60, 180, 200, 0.22), rgba(80, 220, 140, 0.20), rgba(40, 200, 180, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 10s ease infinite',
};

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
            className="text-[10px] font-medium text-center whitespace-nowrap"
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

// ── StateBadgePanel ── Shows agent FSM state with pulsing indicator

export function StateBadgePanel({ data }: { data: AgentStateData }) {
  const color = data.color ?? getStateColor(data.state);
  const label = data.label ?? data.state;

  return (
    <HudPanel
      tint={AGENT_STATE_TINT}
      label="OPENCLAW"
      status="STATE"
      style={{ borderRadius: 18 }}
    >
      <div className="px-5 py-4 flex items-center gap-3" style={{ paddingTop: 28 }}>
        {/* Steady glow dot */}
        <div className="relative shrink-0">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 10px ${color}, 0 0 24px ${color}`,
              animation: 'glow-breathe 3s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 w-3 h-3 rounded-full"
            style={{
              background: color,
              animation: 'glow-ring 3s ease-out infinite',
            }}
          />
        </div>

        {/* State label */}
        <span
          className="text-sm font-bold uppercase tracking-[0.10em] whitespace-nowrap"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: `0 0 12px ${color}, 0 1px 4px rgba(0,0,0,0.3)`,
            fontFamily: SF_FONT,
          }}
        >
          {label}
        </span>
      </div>
    </HudPanel>
  );
}

// ── ActionFeedPanel ── Shows current agent action with tool and progress

export function ActionFeedPanel({ data }: { data: AgentActionData }) {
  return (
    <HudPanel
      tint={AGENT_ACTION_TINT}
      label="ACTION"
      status={data.tool ? `TOOL: ${data.tool.toUpperCase()}` : 'RUNNING'}
      style={{ borderRadius: 20 }}
    >
      <div className="px-5 pb-4 pt-7 space-y-2" style={{ fontFamily: SF_FONT }}>
        {/* Action name */}
        <h3
          className="text-base font-bold leading-tight whitespace-pre-line"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 6px rgba(40, 140, 255, 0.40)',
          }}
        >
          {data.action}
        </h3>

        {/* Detail text */}
        {data.detail && (
          <p
            className="text-sm leading-snug whitespace-pre-line"
            style={{
              color: 'rgba(255, 255, 255, 0.65)',
              textShadow: '0 1px 3px rgba(0,0,0,0.20)',
            }}
          >
            {data.detail}
          </p>
        )}

        {/* Progress bar */}
        {data.progress != null && (
          <div
            className="h-1 rounded-full overflow-hidden mt-1"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, data.progress * 100))}%`,
                background: 'linear-gradient(90deg, rgba(80,180,255,0.90), rgba(120,200,255,0.95))',
                boxShadow: '0 0 8px rgba(80,180,255,0.60)',
              }}
            />
          </div>
        )}
      </div>
    </HudPanel>
  );
}

// ── ThinkingPanel ── Animated reasoning indicator

export function ThinkingPanel({ data }: { data: AgentThinkingData }) {
  const text = data.text || 'Reasoning…';

  return (
    <HudPanel
      tint={AGENT_THINKING_TINT}
      label="THINKING"
      status="AGENT"
      style={{ borderRadius: 20 }}
    >
      <div className="px-5 pb-4 pt-7 space-y-2" style={{ fontFamily: SF_FONT }}>
        {/* Thinking text with animated dots */}
        <div className="flex items-center gap-2">
          <span
            className="text-base font-semibold whitespace-pre-line"
            style={{
              color: 'rgba(255, 255, 255, 0.90)',
              textShadow: '0 0 12px rgba(140, 80, 240, 0.50)',
            }}
          >
            {text}
          </span>
          {/* Animated dots */}
          <span className="flex gap-1 shrink-0">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'rgba(180, 140, 255, 0.90)',
                  boxShadow: '0 0 6px rgba(160, 120, 255, 0.80)',
                  animation: `dot-fade 1.8s ease-in-out ${i * 0.3}s infinite`,
                }}
              />
            ))}
          </span>
        </div>

        {/* Steps list */}
        {data.steps && data.steps.length > 0 && (
          <div className="space-y-1 mt-1">
            {data.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs whitespace-nowrap"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    color: 'rgba(255,255,255,0.70)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="whitespace-nowrap">{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </HudPanel>
  );
}

// ── EventToastPanel ── Brief event notification

const EVENT_TYPE_COLORS: Record<string, string> = {
  transition: 'rgba(80, 190, 255, 0.90)',
  playback:   'rgba(80, 220, 160, 0.90)',
  overlay:    'rgba(160, 120, 255, 0.90)',
  error:      'rgba(255, 90, 80, 0.90)',
  character:  'rgba(255, 180, 60, 0.90)',
  agent:      'rgba(120, 200, 255, 0.90)',
};

export function EventToastPanel({ data }: { data: AgentEventData }) {
  const dotColor = EVENT_TYPE_COLORS[data.eventType] ?? 'rgba(180, 200, 220, 0.90)';

  return (
    <HudPanel
      tint={AGENT_EVENT_TINT}
      style={{ borderRadius: 16 }}
    >
      <div className="px-4 py-3 flex items-center gap-2.5 whitespace-nowrap" style={{ fontFamily: SF_FONT }}>
        {/* Event type dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}`,
          }}
        />

        {/* Event type label */}
        <span
          className="text-[10px] font-bold uppercase tracking-[0.08em] shrink-0"
          style={{ color: dotColor }}
        >
          {data.eventType}
        </span>

        {/* Separator */}
        <div
          className="h-3 w-px shrink-0"
          style={{ background: 'rgba(255,255,255,0.20)' }}
        />

        {/* Summary */}
        <span
          className="text-xs font-semibold whitespace-pre-line"
          style={{
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 4px rgba(0,0,0,0.50), 0 0 8px rgba(0,0,0,0.25)',
          }}
        >
          {data.summary}
        </span>
      </div>
    </HudPanel>
  );
}
