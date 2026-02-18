interface OverlayPreviewFrameProps {
  children: React.ReactNode;
}

export default function OverlayPreviewFrame({ children }: OverlayPreviewFrameProps) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Dark neutral background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(30, 30, 40, 0.6) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 70% 80%, rgba(25, 25, 35, 0.4) 0%, transparent 50%), ' +
            '#0a0a0f',
        }}
      />
      {/* Subtle white grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Scanline sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-8 opacity-[0.03]"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
            animation: 'scanline 4s linear infinite',
          }}
        />
      </div>
      {/* Overlay content */}
      <div className="absolute inset-0">{children}</div>
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
