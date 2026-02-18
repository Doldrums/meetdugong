import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

interface GallerySpecimenProps {
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  children: (show: boolean) => ReactNode;
}

export default function GallerySpecimen({
  name,
  description,
  badge,
  badgeColor,
  children,
}: GallerySpecimenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [show, setShow] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // Compute scale factor from container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setScale(width / 1920);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Trigger first animation when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEntered) {
          setHasEntered(true);
          // Small delay so the card is visible before animation starts
          setTimeout(() => setShow(true), 300);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasEntered]);

  // Replay animation on click
  const replay = useCallback(() => {
    setShow(false);
    setTimeout(() => setShow(true), 500);
  }, []);

  return (
    <div className="min-w-[320px] shrink-0 snap-center flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80 truncate">{name}</p>
          <p className="text-[10px] text-white/30 truncate">{description}</p>
        </div>
        <span
          className="glass-badge text-[9px] uppercase tracking-widest font-semibold shrink-0 ml-2"
          style={{
            background: `${badgeColor}14`,
            borderColor: `${badgeColor}33`,
            color: badgeColor,
          }}
        >
          {badge}
        </span>
      </div>

      {/* Dark viewport */}
      <div
        ref={containerRef}
        onClick={replay}
        className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group shadow-[0_2px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(30, 30, 40, 0.6) 0%, transparent 60%), ' +
              'radial-gradient(ellipse at 70% 80%, rgba(25, 25, 35, 0.4) 0%, transparent 50%), ' +
              '#0a0a0f',
          }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Scanline */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-8 opacity-[0.03]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
              animation: 'scanline 4s linear infinite',
            }}
          />
        </div>

        {/* Scaled 1920×1080 viewport */}
        {scale > 0 && (
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: 1920,
              height: 1080,
              transform: `scale(${scale})`,
            }}
          >
            <div className="relative w-full h-full">
              {children(show)}
            </div>
          </div>
        )}

        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Replay hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="glass-badge text-[10px] text-white/60 font-medium px-3 py-1">
            Click to replay
          </div>
        </div>
      </div>
    </div>
  );
}
