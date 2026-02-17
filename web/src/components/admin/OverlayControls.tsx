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
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Overlay Controls</h2>

      {/* Subtitle */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Subtitle</label>
        <div className="flex gap-1">
          <input
            type="text"
            value={subtitleText}
            onChange={(e) => setSubtitleText(e.target.value)}
            placeholder="Subtitle text..."
            className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
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
            className="w-16 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
            placeholder="TTL"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (subtitleText.trim()) {
                const ttl = parseInt(subtitleTtl) || undefined;
                onSend({ type: 'overlay.subtitle.set', text: subtitleText.trim(), ttlMs: ttl });
              }
            }}
            className="flex-1 px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors"
          >
            Set Subtitle
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.subtitle.clear' })}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Card */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">Card Overlay</label>
        <input
          type="text"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
        />
        <div className="flex gap-1">
          <input
            type="text"
            value={cardSubtitle}
            onChange={(e) => setCardSubtitle(e.target.value)}
            placeholder="Subtitle"
            className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
          />
          <input
            type="text"
            value={cardPrice}
            onChange={(e) => setCardPrice(e.target.value)}
            placeholder="Price"
            className="w-20 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={cardCta}
            onChange={(e) => setCardCta(e.target.value)}
            placeholder="CTA text"
            className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
          />
          <select
            value={cardPosition}
            onChange={(e) => setCardPosition(e.target.value as 'left' | 'right')}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 outline-none"
          >
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </div>
        <div className="flex gap-1">
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
            className="flex-1 px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors"
          >
            Show Card
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.clearAll' })}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* QR */}
      <div className="space-y-1">
        <label className="text-xs text-gray-500">QR Code</label>
        <div className="flex gap-1">
          <input
            type="text"
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (qrUrl.trim()) {
                onSend({ type: 'overlay.qr.show', url: qrUrl.trim(), ttlMs: 10000 });
              }
            }}
            className="flex-1 px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors"
          >
            Show QR
          </button>
          <button
            onClick={() => onSend({ type: 'overlay.qr.hide' })}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            Hide QR
          </button>
        </div>
      </div>
    </div>
  );
}
