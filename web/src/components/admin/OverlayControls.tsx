import { useState, useCallback } from 'react';
import type { ControlEvent } from '@shared/types';

// ── Preset Data ─────────────────────────────────────────────

const SUBTITLE_PRESETS = [
  { key: 'welcome', label: 'Welcome', text: 'Welcome to MBZUAI — the AI University', ttlMs: 30000 },
  { key: 'openday', label: 'Open Day', text: 'Open Day 2025 — Register now at mbzuai.ac.ae', ttlMs: 30000 },
  { key: 'research', label: 'Research', text: 'Pioneering research in NLP, CV & Machine Learning', ttlMs: 30000 },
  { key: 'apply', label: 'Apply Now', text: 'Applications open for Fall 2025 — Fully funded!', ttlMs: 30000 },
];

const QR_PRESETS = [
  { key: 'web', label: 'MBZUAI Website', url: 'https://mbzuai.ac.ae' },
  { key: 'admit', label: 'Admissions Portal', url: 'https://mbzuai.ac.ae/admissions' },
  { key: 'papers', label: 'Research Papers', url: 'https://mbzuai.ac.ae/research' },
];

const MAP_CARD_PRESETS = [
  {
    key: 'campus',
    label: 'Main Campus',
    title: 'MBZUAI Campus',
    subtitle: 'Masdar City, Abu Dhabi, UAE',
    cta: 'Get directions →',
    imageUrl: 'https://picsum.photos/seed/masdar1/400/200',
    position: 'left' as const,
  },
  {
    key: 'research-center',
    label: 'Research Center',
    title: 'AI Research Center',
    subtitle: 'Innovation Hub, Masdar City',
    cta: 'Schedule a visit →',
    imageUrl: 'https://picsum.photos/seed/abudhabi3/400/200',
    position: 'right' as const,
  },
];

const IMAGE_CARD_PRESETS = [
  {
    key: 'nlp',
    label: 'NLP Program',
    title: 'Natural Language Processing',
    subtitle: 'MSc & PhD Programs',
    price: 'Fully Funded',
    cta: 'Explore program →',
    imageUrl: 'https://picsum.photos/seed/nlplab1/400/200',
    position: 'right' as const,
  },
  {
    key: 'cv',
    label: 'Computer Vision',
    title: 'Computer Vision',
    subtitle: 'Deep Learning · 3D Perception',
    price: 'Fully Funded',
    cta: 'Learn more →',
    imageUrl: 'https://picsum.photos/seed/cvision2/400/200',
    position: 'right' as const,
  },
  {
    key: 'ml',
    label: 'Machine Learning',
    title: 'Machine Learning',
    subtitle: 'Foundations · Optimization · AI Safety',
    price: 'Fully Funded',
    cta: 'Apply now →',
    imageUrl: 'https://picsum.photos/seed/mlresearch3/400/200',
    position: 'left' as const,
  },
];

// ── Building Blocks ─────────────────────────────────────────

function PresetCard({
  label,
  description,
  onClick,
  sent,
  accentHue,
}: {
  label: string;
  description: string;
  onClick: () => void;
  sent: boolean;
  accentHue: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card p-3 text-left cursor-pointer group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
    >
      {/* Accent bar */}
      <div
        className="w-1 self-stretch rounded-full shrink-0 transition-all duration-300 group-hover:shadow-[0_0_8px_var(--accent)]"
        style={{
          '--accent': `oklch(0.78 0.15 ${accentHue})`,
          background: sent
            ? 'oklch(0.72 0.19 155)'
            : `oklch(0.78 0.15 ${accentHue} / 50%)`,
          boxShadow: sent ? '0 0 8px oklch(0.72 0.19 155 / 60%)' : undefined,
        } as React.CSSProperties}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/90 truncate">{label}</p>
        <p className="text-[11px] text-gray-500 truncate mt-0.5 group-hover:text-gray-400 transition-colors">
          {description}
        </p>
      </div>

      {/* Action indicator */}
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
          sent
            ? 'text-green-400 opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ color: sent ? undefined : `oklch(0.78 0.12 ${accentHue})` }}
      >
        {sent ? '✓ Sent' : 'Send ▶'}
      </span>
    </button>
  );
}

function Section({
  title,
  badge,
  badgeHue,
  children,
}: {
  title: string;
  badge: string;
  badgeHue: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="section-header">{title}</h3>
        <span
          className="glass-badge text-[10px] uppercase tracking-widest font-semibold"
          style={{
            background: `oklch(0.78 0.15 ${badgeHue} / 8%)`,
            borderColor: `oklch(0.78 0.15 ${badgeHue} / 20%)`,
            color: `oklch(0.78 0.12 ${badgeHue})`,
          }}
        >
          {badge}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">{children}</div>
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
      <div className="flex items-center justify-between">
        <h2 className="section-header">🎨 Stage Visuals</h2>
        <button
          type="button"
          onClick={() => onSend({ type: 'overlay.clearAll' })}
          className="glass-btn text-red-400/80 hover:text-red-300 hover:shadow-[0_0_12px_oklch(0.63_0.22_25_/_25%)]"
        >
          💥 Clear All
        </button>
      </div>

      {/* Text Overlays */}
      <Section title="💬 Text Overlays" badge="subtitle" badgeHue={280}>
        {SUBTITLE_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.text}
            sent={sentKey === p.key}
            accentHue={280}
            onClick={() =>
              send(p.key, { type: 'overlay.subtitle.set', text: p.text, ttlMs: p.ttlMs })
            }
          />
        ))}
      </Section>

      {/* QR Codes */}
      <Section title="📱 QR Codes" badge="qr" badgeHue={195}>
        {QR_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.url.replace(/^https?:\/\//, '')}
            sent={sentKey === p.key}
            accentHue={195}
            onClick={() =>
              send(p.key, { type: 'overlay.qr.show', url: p.url, ttlMs: 30000 })
            }
          />
        ))}
      </Section>

      {/* Map Cards */}
      <Section title="🗺️ Map Cards" badge="location" badgeHue={160}>
        {MAP_CARD_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={p.subtitle}
            sent={sentKey === p.key}
            accentHue={160}
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
      <Section title="🖼️ Image Cards" badge="media" badgeHue={220}>
        {IMAGE_CARD_PRESETS.map((p) => (
          <PresetCard
            key={p.key}
            label={p.label}
            description={`${p.subtitle} · ${p.price}`}
            sent={sentKey === p.key}
            accentHue={220}
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
