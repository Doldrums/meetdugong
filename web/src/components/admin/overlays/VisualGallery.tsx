const COMPONENTS = [
  { name: 'Subtitle', desc: 'Glass text banner', badge: 'text', color: '#AF52DE' },
  { name: 'Card', desc: 'Info card with image', badge: 'card', color: '#34C759' },
  { name: 'QR Code', desc: 'Scannable glass panel', badge: 'qr', color: '#007AFF' },
  { name: 'State Badge', desc: 'Agent FSM indicator', badge: 'state', color: '#FF9500' },
  { name: 'Action Feed', desc: 'Tool & progress panel', badge: 'action', color: '#007AFF' },
  { name: 'Thinking', desc: 'Reasoning steps', badge: 'think', color: '#AF52DE' },
  { name: 'Event Toast', desc: 'Compact notification', badge: 'event', color: '#34C759' },
  { name: 'Glass Panel', desc: 'HudPanel primitive', badge: 'glass', color: '#8E8E93' },
];

export default function VisualGallery() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-header">Component Gallery</h3>
        <span className="glass-badge text-[10px] uppercase tracking-widest font-semibold text-white/40">
          UI Kit
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {COMPONENTS.map((c) => (
          <div
            key={c.name}
            className="glass-card p-2.5 flex flex-col gap-1.5"
          >
            {/* Color swatch */}
            <div
              className="h-8 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${c.color}40, ${c.color}18)`,
                border: `1px solid ${c.color}30`,
              }}
            />
            {/* Label */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/80 truncate">{c.name}</p>
              <span
                className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: `${c.color}20`,
                  color: c.color,
                }}
              >
                {c.badge}
              </span>
            </div>
            <p className="text-[9px] text-white/35 truncate">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
