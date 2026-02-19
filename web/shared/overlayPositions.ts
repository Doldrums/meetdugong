import type React from 'react';

export type OverlaySlot = 'left-top' | 'center-top' | 'right-top' | 'left-mid' | 'right-mid' | 'mid-wide' | 'bottom';

export const ALL_SLOTS: OverlaySlot[] = ['left-top', 'center-top', 'right-top', 'left-mid', 'right-mid', 'mid-wide', 'bottom'];

// Base CSS per zone — maxHeight is computed dynamically via slotToCss()
const SLOT_BASE: Record<OverlaySlot, React.CSSProperties> = {
  'left-top':    { top: '1%',    left: '1%',  maxWidth: '31%',  overflow: 'hidden' },
  'center-top':  { top: '1%',    left: '50%', maxWidth: '31%',  overflow: 'hidden' },
  'right-top':   { top: '1%',    right: '1%', maxWidth: '31%',  overflow: 'hidden' },
  'left-mid':    { top: '13.5%', left: '1%',  maxWidth: '31%',  overflow: 'hidden' },
  'right-mid':   { top: '13.5%', right: '1%', maxWidth: '31%',  overflow: 'hidden' },
  'mid-wide':    { top: '30%',   left: '50%', maxWidth: '96%',  overflow: 'hidden' },
  'bottom':      { bottom: '3%', left: '50%', maxWidth: '96%',  overflow: 'hidden' },
};

// Which zones sit directly below each zone in the same column (ordered top→bottom)
// Mid zones deliberately exclude 'bottom' so they don't shrink when bottom is occupied.
// Bottom zone draws on top via z-index, covering any mid-zone overflow.
const ZONES_BELOW: Record<OverlaySlot, OverlaySlot[]> = {
  'left-top':   ['left-mid'],
  'center-top': [],
  'right-top':  ['right-mid'],
  'left-mid':   [],
  'right-mid':  [],
  'mid-wide':   [],
  'bottom':     [],
};

// Z-index per zone: bottom/mid-wide draw on top so they cover mid-zone overflow
const SLOT_ZINDEX: Record<OverlaySlot, number> = {
  'left-top':   1,
  'center-top': 1,
  'right-top':  1,
  'left-mid':   1,
  'right-mid':  1,
  'mid-wide':   2,
  'bottom':     2,
};

// Top edge of each zone boundary (%)
const ZONE_TOP: Record<OverlaySlot, number> = {
  'left-top':   0,
  'center-top': 0,
  'right-top':  0,
  'left-mid':   12.5,
  'right-mid':  12.5,
  'mid-wide':   29.17,
  'bottom':     29.17,
};

// CSS start position offset from zone boundary (%)
const SLOT_START_Y: Record<OverlaySlot, number> = {
  'left-top':   1,      // top: 1%
  'center-top': 1,
  'right-top':  1,
  'left-mid':   13.5,   // top: 13.5%
  'right-mid':  13.5,
  'mid-wide':   30,     // top: 30%
  'bottom':     0,      // positioned from bottom, handled separately
};

// Bottom boundary of each zone at its base height (no expansion)
const ZONE_BOTTOM: Record<OverlaySlot, number> = {
  'left-top':   12.5,   // 0 + 12.5%
  'center-top': 6.67,   // 0 + 6.67%
  'right-top':  12.5,
  'left-mid':   29.17,  // 12.5 + 16.67%
  'right-mid':  29.17,
  'mid-wide':   50,     // roughly top half of bottom area
  'bottom':     97,     // grows upward from 97%
};

// Which zones sit directly above the bottom zone in each column
const ZONES_ABOVE_BOTTOM: OverlaySlot[] = ['mid-wide', 'left-mid', 'right-mid', 'center-top', 'left-top', 'right-top'];

/**
 * Compute available maxHeight for a zone based on which neighbours are occupied.
 * Zones can expand into empty adjacent space but never overlap occupied zones.
 */
function computeMaxHeight(slot: OverlaySlot, occupied: ReadonlySet<OverlaySlot>): string {
  // Bottom zone — limit upward growth so it doesn't overlap zones above
  if (slot === 'bottom') {
    let lowestOccupiedBottom = 0;
    for (const above of ZONES_ABOVE_BOTTOM) {
      if (occupied.has(above) && ZONE_BOTTOM[above] > lowestOccupiedBottom) {
        lowestOccupiedBottom = ZONE_BOTTOM[above];
      }
    }
    // Bottom grows upward from 97%; cap so it doesn't extend above the lowest occupied zone bottom
    return `${97 - lowestOccupiedBottom}%`;
  }

  const startY = SLOT_START_Y[slot];
  const below = ZONES_BELOW[slot];

  // Find the first occupied zone below — that's the boundary
  for (const belowSlot of below) {
    if (occupied.has(belowSlot)) {
      return `${ZONE_TOP[belowSlot] - startY}%`;
    }
  }

  // Nothing occupied below — extend to near frame bottom (97% = 100% - 3% padding)
  return `${97 - startY}%`;
}

// Only list zones where the overlay type physically fits (at minimum zone size).
export const ZONE_PREFERENCES: Record<string, OverlaySlot[]> = {
  subtitle:      ['bottom', 'center-top', 'left-mid', 'right-mid', 'left-top', 'right-top'],
  qr:            ['bottom', 'right-mid', 'left-mid', 'right-top', 'left-top'],
  card:          ['right-mid', 'left-mid', 'bottom'],
  agentState:    ['left-top', 'center-top', 'right-top', 'left-mid', 'right-mid', 'bottom'],
  agentAction:   ['left-mid', 'right-mid', 'left-top', 'right-top', 'bottom'],
  agentThinking: ['mid-wide', 'bottom'],
  agentEvent:    ['bottom'],
};

export const DEFAULT_OVERLAY_SLOTS: Record<string, OverlaySlot> = {
  subtitle:      'bottom',
  qr:            'bottom',
  card:          'right-mid',
  agentState:    'left-top',
  agentAction:   'left-mid',
  agentThinking: 'mid-wide',
  agentEvent:    'bottom',
};

/**
 * Build CSS for a slot. Pass occupiedZones so maxHeight can expand
 * into empty zones below (otherwise falls back to the tight zone height).
 */
export function slotToCss(
  slot: OverlaySlot,
  occupiedZones?: ReadonlySet<OverlaySlot>,
): React.CSSProperties {
  const maxHeight = computeMaxHeight(slot, occupiedZones ?? new Set(ALL_SLOTS));
  // paddingTop accommodates the overlay-float animation (-6px translateY)
  return { position: 'absolute', ...SLOT_BASE[slot], maxHeight, zIndex: SLOT_ZINDEX[slot], paddingTop: 6 };
}

export function slotNeedsCenterTransform(slot: OverlaySlot): boolean {
  return slot === 'bottom' || slot === 'center-top' || slot === 'mid-wide';
}

export function overlayTypeFromKey(key: string): string {
  if (key.startsWith('card:')) return 'card';
  return key;
}
