interface OverlayPreviewFrameProps {
  children: React.ReactNode;
}

export default function OverlayPreviewFrame({ children }: OverlayPreviewFrameProps) {
  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-cyan-400/15 shadow-[0_0_20px_oklch(0.78_0.15_195_/_8%),inset_0_1px_0_oklch(1_0_0_/_6%)]">
      {/* Deep space background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, oklch(0.14 0.06 220 / 100%) 0%, transparent 60%), ' +
            'radial-gradient(ellipse at 70% 80%, oklch(0.12 0.05 195 / 100%) 0%, transparent 50%), ' +
            'oklch(0.08 0.02 240)',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(0.78 0.15 195 / 40%) 1px, transparent 1px), ' +
            'linear-gradient(90deg, oklch(0.78 0.15 195 / 40%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Scanline sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-8 opacity-[0.03]"
          style={{
            background: 'linear-gradient(180deg, transparent, oklch(0.78 0.15 195), transparent)',
            animation: 'scanline 4s linear infinite',
          }}
        />
      </div>
      {/* Overlay content */}
      <div className="absolute inset-0">{children}</div>
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  );
}
