import type React from 'react';

export type OverlaySlot = 'mid-wide' | 'bottom';

export const ALL_SLOTS: OverlaySlot[] = ['mid-wide', 'bottom'];

const SLOT_BASE: Record<OverlaySlot, React.CSSProperties> = {
  'mid-wide':    { top: '30%',   left: '50%', maxWidth: '96%',  overflow: 'hidden' },
  'bottom':      { bottom: '3%', left: '50%', maxWidth: '96%',  overflow: 'hidden' },
};

const SLOT_ZINDEX: Record<OverlaySlot, number> = {
  'mid-wide':   1,
  'bottom':     2,
};

const ZONE_BOTTOM: Record<OverlaySlot, number> = {
  'mid-wide':   50,
  'bottom':     97,
};

function computeMaxHeight(slot: OverlaySlot, occupied: ReadonlySet<OverlaySlot>): string {
  if (slot === 'bottom') {
    const cap = occupied.has('mid-wide') ? ZONE_BOTTOM['mid-wide'] : 0;
    return `${97 - cap}%`;
  }
  return '67%'; // mid-wide: 30% to 97%
}

export const ZONE_PREFERENCES: Record<string, OverlaySlot[]> = {
  subtitle:      ['bottom', 'mid-wide'],
  qr:            ['bottom', 'mid-wide'],
  card:          ['mid-wide', 'bottom'],
  agentState:    ['mid-wide', 'bottom'],
  agentAction:   ['mid-wide', 'bottom'],
  agentThinking: ['mid-wide', 'bottom'],
  agentEvent:    ['bottom'],
};

export const DEFAULT_OVERLAY_SLOTS: Record<string, OverlaySlot> = {
  subtitle:      'bottom',
  qr:            'bottom',
  card:          'mid-wide',
  agentState:    'mid-wide',
  agentAction:   'mid-wide',
  agentThinking: 'mid-wide',
  agentEvent:    'bottom',
};

export function slotToCss(
  slot: OverlaySlot,
  occupiedZones?: ReadonlySet<OverlaySlot>,
): React.CSSProperties {
  const maxHeight = computeMaxHeight(slot, occupiedZones ?? new Set(ALL_SLOTS));
  return { position: 'absolute', ...SLOT_BASE[slot], maxHeight, zIndex: SLOT_ZINDEX[slot], paddingTop: 6 };
}

export function slotNeedsCenterTransform(_slot: OverlaySlot): boolean {
  return true; // both remaining slots use left: 50%
}

export function overlayTypeFromKey(key: string): string {
  if (key.startsWith('card:')) return 'card';
  return key;
}
