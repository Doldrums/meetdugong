import type { CardOverlayData } from '../../../stores/overlayStore';
import GallerySpecimen from './GallerySpecimen';
import HudPanel from '../../player/HudPanel';
import AnimatedPresence from '../../player/AnimatedPresence';
import ParticleBurst from '../../player/ParticleBurst';
import {
  SubtitlePanel,
  CardPanel,
  QRPanel,
  GLASS_TINT,
  SF_FONT,
} from '../../player/overlayPrimitives';

// ── Demo data ──

const DEMO_CARD_LEFT: CardOverlayData = {
  id: 'gallery-left',
  title: 'Dugong — Physical Mode',
  subtitle: 'HoloBox Installation · Masdar City',
  cta: 'Get directions →',
  position: 'left',
};

const DEMO_CARD_RIGHT: CardOverlayData = {
  id: 'gallery-right',
  title: 'K2 Think V2',
  subtitle: 'Multi-step Reasoning · Task Decomposition',
  price: 'Intelligence Layer',
  cta: 'Learn more →',
  position: 'right',
};

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
          {/* ── 1. Subtitle ── */}
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
                <SubtitlePanel text="Welcome to Dugong — the Embodied K2 Agent" />
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* ── 2. Card (Left) ── */}
          <GallerySpecimen
            name="Card (Left)"
            description="Info card with hero image"
            badge="card"
            badgeColor="#34C759"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[10%] left-[5%] w-[35%] max-w-80"
                duration={400}
                particleColor="rgba(120, 180, 255, 0.9)"
              >
                <CardPanel
                  card={DEMO_CARD_LEFT}
                  imageSlot={
                    <div
                      className="w-full h-40"
                      style={{
                        background: 'linear-gradient(135deg, rgba(50,120,220,0.80), rgba(140,80,220,0.70))',
                        opacity: 0.85,
                      }}
                    />
                  }
                />
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* ── 3. Card (Right) ── */}
          <GallerySpecimen
            name="Card (Right)"
            description="Info card positioned right"
            badge="card"
            badgeColor="#FF9500"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[10%] right-[5%] w-[35%] max-w-80"
                duration={400}
                particleColor="rgba(120, 180, 255, 0.9)"
              >
                <CardPanel
                  card={DEMO_CARD_RIGHT}
                  imageSlot={
                    <div
                      className="w-full h-40"
                      style={{
                        background: 'linear-gradient(135deg, rgba(220,130,50,0.80), rgba(220,80,140,0.70))',
                        opacity: 0.85,
                      }}
                    />
                  }
                />
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* ── 4. QR Code ── */}
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
                <QRPanel
                  url="https://mbzuai.ac.ae"
                  qrSlot={
                    <div
                      className="relative w-36 h-36 rounded-md"
                      style={{
                        background: '#fff',
                        backgroundImage: 'repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                  }
                />
              </AnimatedPresence>
            )}
          </GallerySpecimen>

          {/* ── 5. Glass Panel — HudPanel primitive showcase ── */}
          <GallerySpecimen
            name="Glass Panel"
            description="Bare HudPanel primitive"
            badge="glass"
            badgeColor="#8E8E93"
          >
            {(show) => (
              <AnimatedPresence
                show={show}
                className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[55%]"
                duration={400}
                particleColor="rgba(160, 200, 255, 0.9)"
              >
                <HudPanel
                  tint={GLASS_TINT}
                  label="GLASS"
                  status="LIQUID"
                  style={{ borderRadius: 22 }}
                >
                  <div style={{ padding: '28px 20px 20px', fontFamily: SF_FONT }}>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        lineHeight: 1.1,
                        color: '#fff',
                        textShadow: '0 2px 10px rgba(60,100,200,0.60)',
                        margin: 0,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Liquid Glass
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.90)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        marginTop: 8,
                      }}
                    >
                      Multi-layer glass material with specular highlights, prismatic refraction, and animated light bands.
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      {['Frost', 'Specular', 'Prismatic', 'Light Band'].map((layer) => (
                        <span
                          key={layer}
                          style={{
                            fontFamily: SF_FONT,
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 999,
                            color: '#fff',
                            background: 'rgba(255,255,255,0.22)',
                            border: '1px solid rgba(255,255,255,0.40)',
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

          {/* ── 6. Particles — ParticleBurst showcase ── */}
          <GallerySpecimen
            name="Particles"
            description="ParticleBurst in isolation"
            badge="fx"
            badgeColor="#FF3B30"
          >
            {(show) => (
              <>
                <div className="absolute top-[8%] left-[8%] w-[38%] h-[42%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(160, 120, 255, 1)" />
                  </div>
                </div>
                <div className="absolute top-[12%] right-[8%] w-[38%] h-[42%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(120, 200, 255, 1)" />
                  </div>
                </div>
                <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[44%] h-[38%]">
                  <div className="relative w-full h-full rounded-[22px]">
                    <ParticleBurst trigger={show} color="rgba(255, 140, 180, 1)" />
                  </div>
                </div>
                {show && (
                  <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2" style={{ display: 'flex', gap: 16 }}>
                    {[
                      { label: 'Violet', color: 'rgba(160, 120, 255, 1)' },
                      { label: 'Cyan', color: 'rgba(120, 200, 255, 1)' },
                      { label: 'Rose', color: 'rgba(255, 140, 180, 1)' },
                    ].map((c) => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: c.color,
                            boxShadow: `0 0 8px ${c.color}, 0 0 20px ${c.color}`,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: SF_FONT,
                            fontSize: 10,
                            fontWeight: 800,
                            color: '#fff',
                            textShadow: `0 0 10px ${c.color}`,
                          }}
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
