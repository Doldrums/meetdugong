import type React from 'react';

export type OverlaySlot =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export const OVERLAY_SLOTS: Record<OverlaySlot, React.CSSProperties> = {
  'top-left':      { top: '4%',  left: '4%',  maxWidth: '55%' },
  'top-center':    { top: '4%',  left: '50%', maxWidth: '75%' },
  'top-right':     { top: '4%',  right: '4%', maxWidth: '55%' },
  'middle-left':   { top: '45%', left: '4%',  maxWidth: '55%' },
  'middle-right':  { top: '45%', right: '4%', maxWidth: '55%' },
  'bottom-left':   { bottom: '6%', left: '4%',  maxWidth: '90%' },
  'bottom-center': { bottom: '6%', left: '50%', maxWidth: '90%' },
  'bottom-right':  { bottom: '6%', right: '4%', maxWidth: '90%' },
};

export const DEFAULT_OVERLAY_SLOTS: Record<string, OverlaySlot> = {
  subtitle:      'bottom-center',
  qr:            'bottom-center',
  card:          'top-right',
  agentState:    'top-left',
  agentAction:   'top-left',
  agentThinking: 'top-center',
  agentEvent:    'bottom-center',
};

export function slotToCss(slot: OverlaySlot): React.CSSProperties {
  return { position: 'absolute', ...OVERLAY_SLOTS[slot] };
}

export function slotNeedsCenterTransform(slot: OverlaySlot): boolean {
  return slot === 'top-center' || slot === 'bottom-center';
}
