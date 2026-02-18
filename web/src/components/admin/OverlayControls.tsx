import { useState, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';

// ── Preset Data ─────────────────────────────────────────────

const SUBTITLE_PRESETS = [
  { key: 'welcome', label: 'Welcome', text: 'Welcome to Dugong — the Embodied K2 Agent', ttlMs: 30000 },
  { key: 'spatial', label: 'Spatial AI', text: 'Experience spatial interface generation — powered by K2 Think V2', ttlMs: 30000 },
  { key: 'research', label: 'Research', text: 'Pioneering embodied AI, spatial computing & agent reasoning', ttlMs: 30000 },
  { key: 'mbzuai', label: 'MBZUAI', text: 'MBZUAI — The world\'s first AI university · Fully funded programs', ttlMs: 30000 },
];

const QR_PRESETS = [
  { key: 'web', label: 'MBZUAI Website', url: 'https://mbzuai.ac.ae' },
  { key: 'admit', label: 'Admissions', url: 'https://mbzuai.ac.ae/admissions' },
  { key: 'research', label: 'Research', url: 'https://mbzuai.ac.ae/research' },
];

const MAP_CARD_PRESETS = [
  {
    key: 'campus',
    label: 'MBZUAI Campus',
    title: 'Dugong — Physical Mode',
    subtitle: 'HoloBox Installation · Masdar City, Abu Dhabi',
    cta: 'Get directions →',
    imageUrl: 'https://picsum.photos/seed/masdar1/400/200',
    position: 'left' as const,
  },
  {
    key: 'research-center',
    label: 'Research Center',
    title: 'AI Research Center',
    subtitle: 'Embodied Intelligence Lab · Masdar City',
    cta: 'Schedule a visit →',
    imageUrl: 'https://picsum.photos/seed/abudhabi3/400/200',
    position: 'right' as const,
  },
];

const IMAGE_CARD_PRESETS = [
  {
    key: 'k2-think',
    label: 'K2 Think V2',
    title: 'K2 Think V2',
    subtitle: 'Multi-step Reasoning · Task Decomposition',
    price: 'Intelligence Layer',
    cta: 'Learn more →',
    imageUrl: 'https://picsum.photos/seed/nlplab1/400/200',
    position: 'right' as const,
  },
  {
    key: 'openclaw',
    label: 'OpenClaw',
    title: 'OpenClaw Orchestration',
    subtitle: 'Tool Routing · Plan Execution · Agent Workflows',
    price: 'Orchestration Layer',
    cta: 'Explore →',
    imageUrl: 'https://picsum.photos/seed/cvision2/400/200',
    position: 'right' as const,
  },
  {
    key: 'scene',
    label: 'Scene Synthesis',
    title: 'Spatial Interface Generation',
    subtitle: 'Scene Graphs · Dynamic UI · Runtime Compilation',
    price: 'Scene Control Layer',
    cta: 'See demo →',
    imageUrl: 'https://picsum.photos/seed/mlresearch3/400/200',
    position: 'left' as const,
  },
];

// Apple system colors for accent bars
const SECTION_COLORS: Record<string, string> = {
  subtitle: '#AF52DE',  // purple
  qr: '#007AFF',        // blue
  location: '#34C759',  // green
  media: '#FF9500',     // orange
};

// ── Building Blocks ─────────────────────────────────────────

function PresetCard({
  label,
  description,
  onClick,
  sent,
  accentColor,
}: {
  label: string;
  description: string;
  onClick: () => void;
  sent: boolean;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card p-3 text-left cursor-pointer group transition-all duration-200 active:scale-[0.98] flex items-center gap-3"
    >
      {/* Accent bar */}
      <div
        className="w-1 self-stretch rounded-full shrink-0 transition-all duration-300"
        style={{
          background: sent ? '#34C759' : `${accentColor}80`,
        }}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/90 truncate">{label}</p>
        <p className="text-[11px] text-white/35 truncate mt-0.5 group-hover:text-white/50 transition-colors">
          {description}
        </p>
      </div>

      {/* Action indicator */}
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
          sent
            ? 'text-[#34C759] opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ color: sent ? '#34C759' : accentColor }}
      >
        {sent ? 'Sent' : 'Send'}
      </span>
    </button>
  );
}

function Section({
  title,
  description,
  badge,
  badgeColor,
  children,
}: {
  title: string;
  description?: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="section-header">{title}</h3>
          <span
            className="glass-badge text-[10px] uppercase tracking-widest font-semibold"
            style={{
              background: `${badgeColor}14`,
              borderColor: `${badgeColor}33`,
              color: badgeColor,
            }}
          >
            {badge}
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-white/20 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>
    </section>
  );
}

// ── Main Component ──────────────────────────────────────────

interface OverlayControlsProps {
  onSend: (event: ControlEvent) => void;
}

export default function OverlayControls({ onSend }: OverlayControlsProps) {
  const [sentKey, setSentKey] = useState<string | null>(null);

  const send = useCallback(
    (key: string, event: ControlEvent) => {
      onSend(event);
      setSentKey(key);
      setTimeout(() => setSentKey(null), 1200);
    },
    [onSend],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="section-header">Scene Overlays</h2>
          <button
            type="button"
            onClick={() => onSend({ type: 'overlay.clearAll' })}
            className="glass-btn text-[#FF3B30]/80 hover:text-[#FF3B30]"
          >
            Clear All
          </button>
        </div>
        <p className="text-[11px] text-white/25 mt-1 leading-relaxed">
          Broadcast spatial overlays to the scene surface. Each preset sends a real-time command to the rendering layer.
        </p>
      </div>

      {/* Text Overlays */}
      <Section title="Text Overlays" badge="subtitle" badgeColor={SECTION_COLORS.subtitle}
        description="Subtitle banners rendered on the stage. Auto-dismiss after 30 seconds.">
        {SUBTITLE_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.text}
            sent={sentKey === p.key}
            accentColor={SECTION_COLORS.subtitle}
            onClick={() =>
              send(p.key, { type: 'overlay.subtitle.set', text: p.text, ttlMs: p.ttlMs })
            }
          />
        ))}
      </Section>

      {/* QR Codes */}
      <Section title="QR Codes" badge="qr" badgeColor={SECTION_COLORS.qr}
        description="Scannable codes projected on the scene for audience interaction.">
        {QR_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.url.replace(/^https?:\/\//, '')}
            sent={sentKey === p.key}
            accentColor={SECTION_COLORS.qr}
            onClick={() =>
              send(p.key, { type: 'overlay.qr.show', url: p.url, ttlMs: 30000 })
            }
          />
        ))}
      </Section>

      {/* Map Cards */}
      <Section title="Location Cards" badge="location" badgeColor={SECTION_COLORS.location}
        description="Spatial cards with venue and installation context for physical deployments.">
        {MAP_CARD_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.subtitle}
            sent={sentKey === p.key}
            accentColor={SECTION_COLORS.location}
            onClick={() =>
              send(p.key, {
                type: 'overlay.card.show',
                id: `card_${Date.now()}`,
                title: p.title,
                subtitle: p.subtitle,
                cta: p.cta,
                imageUrl: p.imageUrl,
                position: p.position,
                ttlMs: 30000,
              })
            }
          />
        ))}
      </Section>

      {/* Image Cards */}
      <Section title="Capability Cards" badge="media" badgeColor={SECTION_COLORS.media}
        description="Rich media panels showcasing Dugong architecture layers and capabilities.">
        {IMAGE_CARD_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={`${p.subtitle} · ${p.price}`}
            sent={sentKey === p.key}
            accentColor={SECTION_COLORS.media}
            onClick={() =>
              send(p.key, {
                type: 'overlay.card.show',
                id: `card_${Date.now()}`,
                title: p.title,
                subtitle: p.subtitle,
                price: p.price,
                cta: p.cta,
                imageUrl: p.imageUrl,
                position: p.position,
                ttlMs: 30000,
              })
            }
          />
        ))}
      </Section>
    </div>
  );
}
