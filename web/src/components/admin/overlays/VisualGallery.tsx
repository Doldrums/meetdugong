import GallerySpecimen from './GallerySpecimen';
import HudPanel from '../../player/HudPanel';
import AnimatedPresence from '../../player/AnimatedPresence';
import ParticleBurst from '../../player/ParticleBurst';

// ── Tint constants (copied from overlay components, kept decoupled) ──

const SUBTITLE_TINT = {
  background:
    'linear-gradient(-45deg, rgba(120, 80, 220, 0.25), rgba(80, 130, 240, 0.22), rgba(160, 100, 240, 0.20), rgba(100, 140, 255, 0.24), rgba(140, 80, 220, 0.25))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 10s ease infinite',
};

const CARD_TINT = {
  background:
    'linear-gradient(-45deg, rgba(60, 160, 200, 0.22), rgba(80, 100, 220, 0.24), rgba(130, 80, 200, 0.20), rgba(60, 140, 210, 0.22), rgba(100, 80, 220, 0.24))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 12s ease infinite',
};

const QR_TINT = {
  background:
    'linear-gradient(-45deg, rgba(160, 80, 200, 0.24), rgba(200, 90, 170, 0.20), rgba(100, 110, 240, 0.22), rgba(160, 70, 210, 0.24), rgba(120, 100, 240, 0.20))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 8s ease infinite',
};

const GLASS_TINT = {
  background:
    'linear-gradient(-45deg, rgba(100, 140, 200, 0.18), rgba(120, 120, 180, 0.16), rgba(80, 160, 200, 0.14), rgba(140, 100, 200, 0.16))',
  backgroundSize: '400% 400%',
  animation: 'mesh-flow 14s ease infinite',
};

const SF =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// ── Gallery ──

export default function VisualGallery() {
  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="section-header">Component Gallery</h3>
        <span className="glass-badge text-[10px] uppercase tracking-widest font-semibold text-white/40">
          UI Kit
        </span>
      </div>

      {/* Horizontal scroll */}
      <div className="overflow-x-auto snap-x snap-mandatory glass-scroll-x pb-2 -mx-1 px-1">
        <div className="flex gap-3">
          {/* 1. Subtitle */}
          <GallerySpecimen
            name="Subtitle"
            description="Violet-blue glass text banner"
            badge="text"
            badgeColor="#AF52DE"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute bottom-[8%] left-1/2 -translate-x-1/2 max-w-[80%]"
                duration={400}
                particleColor="rgba(160, 120, 255, 0.9)"
              >
                <HudPanel tint={SUBTITLE_TINT} style={{ borderRadius: 24 }}>
                  <div className="px-8 py-4 text-center">
                    <span
                      className="text-lg font-semibold leading-snug tracking-[-0.01em]"
                      style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        textShadow: '0 1px 6px rgba(80, 60, 160, 0.40)',
                        fontFamily: SF,
                      }}
                    >
                      Welcome to Dugong — the Embodied K2 Agent
                    </span>
                  </div>
                </HudPanel>
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* 2. Card (Left) */}
          <GallerySpecimen
            name="Card (Left)"
            description="Info card with hero image"
            badge="card"
            badgeColor="#34C759"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[10%] left-[5%] w-[35%] max-w-[320px]"
                duration={400}
                particleColor="rgba(120, 180, 255, 0.9)"
              >
                <HudPanel tint={CARD_TINT} style={{ borderRadius: 22 }}>
                  <div className="relative overflow-hidden rounded-t-[22px]">
                    <div
                      className="w-full h-40"
                      style={{
                        background: 'linear-gradient(135deg, rgba(60,130,200,0.4), rgba(120,80,200,0.3))',
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(80,120,200,0.65) 0%, rgba(80,120,200,0.25) 40%, transparent 75%)',
                      }}
                    />
                  </div>
                  <div className="px-4 pb-4 pt-3 space-y-1.5" style={{ fontFamily: SF }}>
                    <h3 className="font-bold text-base leading-tight" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(40,80,160,0.35)' }}>
                      Dugong — Physical Mode
                    </h3>
                    <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      HoloBox Installation · Masdar City
                    </p>
                    <div className="h-px w-full mt-2 mb-1.5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Get directions →
                    </p>
                  </div>
                </HudPanel>
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* 3. Card (Right) */}
          <GallerySpecimen
            name="Card (Right)"
            description="Info card positioned right"
            badge="card"
            badgeColor="#FF9500"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[10%] right-[5%] w-[35%] max-w-[320px]"
                duration={400}
                particleColor="rgba(120, 180, 255, 0.9)"
              >
                <HudPanel tint={CARD_TINT} style={{ borderRadius: 22 }}>
                  <div className="relative overflow-hidden rounded-t-[22px]">
                    <div
                      className="w-full h-40"
                      style={{
                        background: 'linear-gradient(135deg, rgba(200,120,60,0.35), rgba(200,80,130,0.25))',
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(80,120,200,0.65) 0%, rgba(80,120,200,0.25) 40%, transparent 75%)',
                      }}
                    />
                  </div>
                  <div className="px-4 pb-4 pt-3 space-y-1.5" style={{ fontFamily: SF }}>
                    <h3 className="font-bold text-base leading-tight" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(40,80,160,0.35)' }}>
                      K2 Think V2
                    </h3>
                    <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      Multi-step Reasoning · Task Decomposition
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#fff', textShadow: '0 0 12px rgba(255,255,255,0.4)' }}>
                      Intelligence Layer
                    </p>
                    <div className="h-px w-full mt-2 mb-1.5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      Learn more →
                    </p>
                  </div>
                </HudPanel>
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* 4. QR Code */}
          <GallerySpecimen
            name="QR Code"
            description="Frosted glass QR panel"
            badge="qr"
            badgeColor="#007AFF"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute bottom-[15%] right-[5%]"
                duration={400}
                particleColor="rgba(180, 100, 240, 0.9)"
              >
                <HudPanel tint={QR_TINT} style={{ borderRadius: 22 }}>
                  <div className="p-3 flex flex-col items-center gap-2">
                    <div
                      className="relative rounded-xl overflow-hidden p-1.5"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.75), rgba(240,240,255,0.65))',
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 4px 16px rgba(120,80,200,0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
                      }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                          borderRadius: 'inherit',
                        }}
                      />
                      {/* Placeholder QR pattern */}
                      <div
                        className="relative w-36 h-36 rounded-md"
                        style={{
                          background: '#fff',
                          backgroundImage:
                            'repeating-conic-gradient(#222 0% 25%, transparent 0% 50%)',
                          backgroundSize: '12px 12px',
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 max-w-28">
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25))' }} />
                      <p className="text-[10px] font-medium text-center truncate" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: SF }}>
                        mbzuai.ac.ae
                      </p>
                      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.25))' }} />
                    </div>
                  </div>
                </HudPanel>
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* 5. Glass Panel */}
          <GallerySpecimen
            name="Glass Panel"
            description="Bare HudPanel primitive"
            badge="glass"
            badgeColor="#8E8E93"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[50%]"
                duration={400}
                particleColor="rgba(160, 200, 255, 0.9)"
              >
                <HudPanel
                  tint={GLASS_TINT}
                  label="GLASS"
                  status="LIQUID"
                  style={{ borderRadius: 22 }}
                >
                  <div className="px-6 pt-8 pb-6 space-y-3" style={{ fontFamily: SF }}>
                    <h3
                      className="font-bold text-xl leading-tight"
                      style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(80,120,200,0.3)' }}
                    >
                      Liquid Glass
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
                      Multi-layer glass material with specular highlights, prismatic refraction, and animated light bands.
                    </p>
                    <div className="flex gap-2 pt-1">
                      {['Frost', 'Specular', 'Prismatic', 'Light Band'].map((layer) => (
                        <span
                          key={layer}
                          className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            color: 'rgba(255,255,255,0.70)',
                            background: 'rgba(255,255,255,0.10)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          {layer}
                        </span>
                      ))}
                    </div>
                  </div>
                </HudPanel>
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* 6. Particles */}
          <GallerySpecimen
            name="Particles"
            description="ParticleBurst in isolation"
            badge="fx"
            badgeColor="#FF3B30"
          >
            {(show) => (
              <>
                {/* Three particle bursts in different positions/colors */}
                <div className="absolute top-[10%] left-[10%] w-[35%] h-[40%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(160, 120, 255, 0.9)" />
                  </div>
                </div>
                <div className="absolute top-[15%] right-[10%] w-[35%] h-[40%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(120, 200, 255, 0.9)" />
                  </div>
                </div>
                <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[40%] h-[35%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(255, 140, 180, 0.9)" />
                  </div>
                </div>
                {/* Labels */}
                {show && (
                  <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-4">
                    {[
                      { label: 'Violet', color: 'rgba(160, 120, 255, 0.9)' },
                      { label: 'Cyan', color: 'rgba(120, 200, 255, 0.9)' },
                      { label: 'Rose', color: 'rgba(255, 140, 180, 0.9)' },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: c.color,
                            boxShadow: `0 0 8px ${c.color}`,
                          }}
                        />
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: SF }}
                        >
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </GallerySpecimen>
        </div>
      </div>
    </section>
  );
}
