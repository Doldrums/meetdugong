import { useState } from 'react';
import type { ControlEvent } from '@shared/types';

interface OverlayControlsProps {
  onSend: (event: ControlEvent) => void;
}

export default function OverlayControls({ onSend }: OverlayControlsProps) {
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleTtl, setSubtitleTtl] = useState('3000');
  const [qrUrl, setQrUrl] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [cardPrice, setCardPrice] = useState('');
  const [cardCta, setCardCta] = useState('');
  const [cardPosition, setCardPosition] = useState<'left' | 'right'>('right');

  return (
    <div>
      {/* Subtitle */}
      <div className="space-y-1.5">
        <SectionLabel emoji="💬">Subtitle</SectionLabel>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={subtitleText}
            onChange={(e) => setSubtitleText(e.target.value)}
            placeholder="Subtitle text..."
            className="flex-1 glass-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && subtitleText.trim()) {
                const ttl = parseInt(subtitleTtl) || undefined;
                onSend({ type: 'overlay.subtitle.set', text: subtitleText.trim(), ttlMs: ttl });
              }
            }}
          />
          <input
            type="number"
            value={subtitleTtl}
            onChange={(e) => setSubtitleTtl(e.target.value)}
            className="w-16 glass-input"
            placeholder="TTL"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (subtitleText.trim()) {
                const ttl = parseInt(subtitleTtl) || undefined;
                onSend({ type: 'overlay.subtitle.set', text: subtitleText.trim(), ttlMs: ttl });
              }
            }}
            className="flex-1 glass-btn bg-purple-500/15 border-purple-500/20 hover:bg-purple-500/25 hover:shadow-[0_0_12px_oklch(0.65_0.18_300_/_30%)]"
          >
            ✨ Set Subtitle
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.subtitle.clear' })}
            className="glass-btn"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      <div className="border-t border-glass-border my-3" />

      {/* Card */}
      <div className="space-y-1.5">
        <SectionLabel emoji="🃏">Card Overlay</SectionLabel>
        <input
          type="text"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          placeholder="Title"
          className="w-full glass-input"
        />
        <div className="flex gap-1.5">
          <input
            type="text"
            value={cardSubtitle}
            onChange={(e) => setCardSubtitle(e.target.value)}
            placeholder="Subtitle"
            className="flex-1 glass-input"
          />
          <input
            type="text"
            value={cardPrice}
            onChange={(e) => setCardPrice(e.target.value)}
            placeholder="💰 Price"
            className="w-24 glass-input"
          />
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={cardCta}
            onChange={(e) => setCardCta(e.target.value)}
            placeholder="CTA text"
            className="flex-1 glass-input"
          />
          <select
            value={cardPosition}
            onChange={(e) => setCardPosition(e.target.value as 'left' | 'right')}
            className="glass-input"
          >
            <option value="right">→ Right</option>
            <option value="left">← Left</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (cardTitle.trim()) {
                onSend({
                  type: 'overlay.card.show',
                  id: `card_${Date.now()}`,
                  title: cardTitle.trim(),
                  subtitle: cardSubtitle || undefined,
                  price: cardPrice || undefined,
                  cta: cardCta || undefined,
                  position: cardPosition,
                  ttlMs: 8000,
                });
              }
            }}
            className="flex-1 glass-btn bg-purple-500/15 border-purple-500/20 hover:bg-purple-500/25 hover:shadow-[0_0_12px_oklch(0.65_0.18_300_/_30%)]"
          >
            🃏 Show Card
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.clearAll' })}
            className="glass-btn"
          >
            💥 Clear All
          </button>
        </div>
      </div>

      <div className="border-t border-glass-border my-3" />

      {/* QR */}
      <div className="space-y-1.5">
        <SectionLabel emoji="📱">QR Code</SectionLabel>
        <input
          type="text"
          value={qrUrl}
          onChange={(e) => setQrUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full glass-input"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (qrUrl.trim()) {
                onSend({ type: 'overlay.qr.show', url: qrUrl.trim(), ttlMs: 10000 });
              }
            }}
            className="flex-1 glass-btn bg-purple-500/15 border-purple-500/20 hover:bg-purple-500/25 hover:shadow-[0_0_12px_oklch(0.65_0.18_300_/_30%)]"
          >
            📱 Show QR
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.qr.hide' })}
            className="glass-btn"
          >
            🙈 Hide QR
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, emoji }: { children: React.ReactNode; emoji: string }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
      <span>{emoji}</span>
      {children}
    </label>
  );
}
