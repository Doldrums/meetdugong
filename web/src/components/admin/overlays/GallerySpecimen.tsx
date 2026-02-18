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
          <p className="text-xs font-bold text-white truncate">{name}</p>
          <p className="text-[10px] text-white/50 truncate">{description}</p>
        </div>
        <span
          className="glass-badge text-[9px] uppercase tracking-widest font-bold shrink-0 ml-2"
          style={{
            background: `${badgeColor}30`,
            borderColor: `${badgeColor}60`,
            color: badgeColor,
          }}
        >
          {badge}
        </span>
      </div>

      {/* Dark viewport — pure black for maximum contrast */}
      <div
        ref={containerRef}
        onClick={replay}
        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
        style={{
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Pure black background */}
        <div className="absolute inset-0 bg-black" />

        {/* Faint grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Scanline */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-8 opacity-[0.04]"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
              animation: 'scanline 4s linear infinite',
            }}
          />
        </div>

        {/* Scaled 1920x1080 viewport */}
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
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Replay hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="glass-badge text-[10px] text-white/80 font-semibold px-3 py-1">
            Click to replay
          </div>
        </div>
      </div>
    </div>
  );
}
