import { create } from 'zustand';
import type { OverlaySlot } from '@shared/overlayPositions';
import { ZONE_PREFERENCES, ALL_SLOTS, overlayTypeFromKey } from '@shared/overlayPositions';

export interface CardOverlayData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: string;
  cta?: string;
  position?: OverlaySlot;
}

// --- Agent overlay data ---

export interface AgentStateData {
  state: string;
  label?: string;
  color?: string;
}

export interface AgentActionData {
  action: string;
  detail?: string;
  tool?: string;
  progress?: number;
}

export interface AgentThinkingData {
  text: string;
  steps?: string[];
}

export interface AgentEventData {
  eventType: string;
  summary: string;
}

// --- Zone allocation ---

interface ZoneEntry {
  zone: OverlaySlot;
  ts: number;
}

interface OverlayState {
  // Subtitle
  subtitleText: string | null;
  subtitleTimer: ReturnType<typeof setTimeout> | null;
  subtitlePosition: OverlaySlot | null;

  // Cards
  cards: Map<string, CardOverlayData>;

  // QR
  qrUrl: string | null;
  qrTimer: ReturnType<typeof setTimeout> | null;
  qrPosition: OverlaySlot | null;

  // Agent overlays (OpenClaw)
  agentState: AgentStateData | null;
  agentStateTimer: ReturnType<typeof setTimeout> | null;
  agentStatePosition: OverlaySlot | null;
  agentAction: AgentActionData | null;
  agentActionTimer: ReturnType<typeof setTimeout> | null;
  agentActionPosition: OverlaySlot | null;
  agentThinking: AgentThinkingData | null;
  agentThinkingTimer: ReturnType<typeof setTimeout> | null;
  agentThinkingPosition: OverlaySlot | null;
  agentEvent: AgentEventData | null;
  agentEventTimer: ReturnType<typeof setTimeout> | null;
  agentEventPosition: OverlaySlot | null;

  // Zone allocation
  zoneMap: Map<string, ZoneEntry>;
  allocateZone: (key: string, requestedZone?: OverlaySlot) => OverlaySlot;
  releaseZone: (key: string) => void;

  // Actions
  setSubtitle: (text: string, ttlMs?: number, position?: OverlaySlot) => void;
  clearSubtitle: () => void;
  showCard: (card: CardOverlayData, ttlMs?: number) => void;
  hideCard: (id: string) => void;
  showQR: (url: string, ttlMs?: number, position?: OverlaySlot) => void;
  hideQR: () => void;
  setAgentState: (data: AgentStateData, ttlMs?: number, position?: OverlaySlot) => void;
  clearAgentState: () => void;
  setAgentAction: (data: AgentActionData, ttlMs?: number, position?: OverlaySlot) => void;
  clearAgentAction: () => void;
  setAgentThinking: (data: AgentThinkingData, ttlMs?: number, position?: OverlaySlot) => void;
  clearAgentThinking: () => void;
  setAgentEvent: (data: AgentEventData, ttlMs?: number, position?: OverlaySlot) => void;
  clearAgentEvent: () => void;
  clearAllAgent: () => void;
  clearAll: () => void;
}

/** Return partial state changes needed to evict an overlay by its zone key. */
function evictState(key: string, state: OverlayState): Partial<OverlayState> {
  if (key === 'subtitle') {
    if (state.subtitleTimer) clearTimeout(state.subtitleTimer);
    return { subtitleText: null, subtitleTimer: null, subtitlePosition: null } as Partial<OverlayState>;
  }
  if (key === 'qr') {
    if (state.qrTimer) clearTimeout(state.qrTimer);
    return { qrUrl: null, qrTimer: null, qrPosition: null } as Partial<OverlayState>;
  }
  if (key.startsWith('card:')) {
    const cardId = key.slice(5);
    const cards = new Map(state.cards);
    cards.delete(cardId);
    return { cards } as Partial<OverlayState>;
  }
  if (key === 'agentState') {
    if (state.agentStateTimer) clearTimeout(state.agentStateTimer);
    return { agentState: null, agentStateTimer: null, agentStatePosition: null } as Partial<OverlayState>;
  }
  if (key === 'agentAction') {
    if (state.agentActionTimer) clearTimeout(state.agentActionTimer);
    return { agentAction: null, agentActionTimer: null, agentActionPosition: null } as Partial<OverlayState>;
  }
  if (key === 'agentThinking') {
    if (state.agentThinkingTimer) clearTimeout(state.agentThinkingTimer);
    return { agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null } as Partial<OverlayState>;
  }
  if (key === 'agentEvent') {
    if (state.agentEventTimer) clearTimeout(state.agentEventTimer);
    return { agentEvent: null, agentEventTimer: null, agentEventPosition: null } as Partial<OverlayState>;
  }
  return {};
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  subtitleText: null,
  subtitleTimer: null,
  subtitlePosition: null,
  cards: new Map(),
  qrUrl: null,
  qrTimer: null,
  qrPosition: null,
  agentState: null,
  agentStateTimer: null,
  agentStatePosition: null,
  agentAction: null,
  agentActionTimer: null,
  agentActionPosition: null,
  agentThinking: null,
  agentThinkingTimer: null,
  agentThinkingPosition: null,
  agentEvent: null,
  agentEventTimer: null,
  agentEventPosition: null,
  zoneMap: new Map(),

  // ── Zone allocation ──

  allocateZone: (key, requestedZone) => {
    const state = get();
    const zoneMap = new Map(state.zoneMap);

    // If this key already has a zone, keep it but refresh timestamp
    const existing = zoneMap.get(key);
    if (existing) {
      zoneMap.set(key, { ...existing, ts: Date.now() });
      set({ zoneMap });
      return existing.zone;
    }

    const occupied = new Set([...zoneMap.values()].map((e) => e.zone));
    const type = overlayTypeFromKey(key);
    const prefs = ZONE_PREFERENCES[type] ?? ALL_SLOTS;
    const tryOrder = requestedZone
      ? [requestedZone, ...prefs.filter((z) => z !== requestedZone)]
      : prefs;

    // Try to find a free zone
    for (const zone of tryOrder) {
      if (!occupied.has(zone)) {
        zoneMap.set(key, { zone, ts: Date.now() });
        set({ zoneMap });
        return zone;
      }
    }

    // All compatible zones occupied — evict the oldest overlay occupying one
    const compatibleZones = new Set(tryOrder);
    let oldestKey = '';
    let oldestTs = Infinity;
    for (const [k, v] of zoneMap) {
      if (compatibleZones.has(v.zone) && v.ts < oldestTs) {
        oldestTs = v.ts;
        oldestKey = k;
      }
    }

    if (!oldestKey) {
      // No evictable entry in compatible zones — use first preference as fallback
      const fallbackZone = tryOrder[0];
      zoneMap.set(key, { zone: fallbackZone, ts: Date.now() });
      set({ zoneMap });
      return fallbackZone;
    }

    const evictedZone = zoneMap.get(oldestKey)!.zone;
    const changes = evictState(oldestKey, get());
    zoneMap.delete(oldestKey);
    zoneMap.set(key, { zone: evictedZone, ts: Date.now() });
    set({ ...changes, zoneMap });
    return evictedZone;
  },

  releaseZone: (key) => {
    const zoneMap = new Map(get().zoneMap);
    if (zoneMap.delete(key)) {
      set({ zoneMap });
    }
  },

  // ── Subtitle ──

  setSubtitle: (text, ttlMs, position) => {
    const zone = get().allocateZone('subtitle', position);
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('subtitle');
        set({ subtitleText: null, subtitleTimer: null, subtitlePosition: null });
      }, ttlMs);
    }
    set({ subtitleText: text, subtitleTimer: timer, subtitlePosition: zone });
  },

  clearSubtitle: () => {
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('subtitle');
    set({ subtitleText: null, subtitleTimer: null, subtitlePosition: null });
  },

  // ── Cards ──

  showCard: (card, ttlMs) => {
    const key = `card:${card.id}`;
    const zone = get().allocateZone(key, card.position);
    const positionedCard = { ...card, position: zone };
    set((state) => {
      const cards = new Map(state.cards);
      cards.set(card.id, positionedCard);
      return { cards };
    });
    if (ttlMs && ttlMs > 0) {
      setTimeout(() => {
        get().releaseZone(key);
        set((state) => {
          const cards = new Map(state.cards);
          cards.delete(card.id);
          return { cards };
        });
      }, ttlMs);
    }
  },

  hideCard: (id) => {
    get().releaseZone(`card:${id}`);
    set((state) => {
      const cards = new Map(state.cards);
      cards.delete(id);
      return { cards };
    });
  },

  // ── QR ──

  showQR: (url, ttlMs, position) => {
    const zone = get().allocateZone('qr', position);
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('qr');
        set({ qrUrl: null, qrTimer: null, qrPosition: null });
      }, ttlMs);
    }
    set({ qrUrl: url, qrTimer: timer, qrPosition: zone });
  },

  hideQR: () => {
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('qr');
    set({ qrUrl: null, qrTimer: null, qrPosition: null });
  },

  // ── Agent overlays ──

  setAgentState: (data, ttlMs, position) => {
    const zone = get().allocateZone('agentState', position);
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('agentState');
        set({ agentState: null, agentStateTimer: null, agentStatePosition: null });
      }, ttlMs);
    }
    set({ agentState: data, agentStateTimer: timer, agentStatePosition: zone });
  },

  clearAgentState: () => {
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('agentState');
    set({ agentState: null, agentStateTimer: null, agentStatePosition: null });
  },

  setAgentAction: (data, ttlMs, position) => {
    const zone = get().allocateZone('agentAction', position);
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('agentAction');
        set({ agentAction: null, agentActionTimer: null, agentActionPosition: null });
      }, ttlMs);
    }
    set({ agentAction: data, agentActionTimer: timer, agentActionPosition: zone });
  },

  clearAgentAction: () => {
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('agentAction');
    set({ agentAction: null, agentActionTimer: null, agentActionPosition: null });
  },

  setAgentThinking: (data, ttlMs, position) => {
    const zone = get().allocateZone('agentThinking', position);
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('agentThinking');
        set({ agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null });
      }, ttlMs);
    }
    set({ agentThinking: data, agentThinkingTimer: timer, agentThinkingPosition: zone });
  },

  clearAgentThinking: () => {
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('agentThinking');
    set({ agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null });
  },

  setAgentEvent: (data, ttlMs, position) => {
    const zone = get().allocateZone('agentEvent', position);
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        get().releaseZone('agentEvent');
        set({ agentEvent: null, agentEventTimer: null, agentEventPosition: null });
      }, ttlMs);
    }
    set({ agentEvent: data, agentEventTimer: timer, agentEventPosition: zone });
  },

  clearAgentEvent: () => {
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    get().releaseZone('agentEvent');
    set({ agentEvent: null, agentEventTimer: null, agentEventPosition: null });
  },

  clearAllAgent: () => {
    const s = get();
    if (s.agentStateTimer) clearTimeout(s.agentStateTimer);
    if (s.agentActionTimer) clearTimeout(s.agentActionTimer);
    if (s.agentThinkingTimer) clearTimeout(s.agentThinkingTimer);
    if (s.agentEventTimer) clearTimeout(s.agentEventTimer);
    const zoneMap = new Map(s.zoneMap);
    zoneMap.delete('agentState');
    zoneMap.delete('agentAction');
    zoneMap.delete('agentThinking');
    zoneMap.delete('agentEvent');
    set({
      agentState: null, agentStateTimer: null, agentStatePosition: null,
      agentAction: null, agentActionTimer: null, agentActionPosition: null,
      agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null,
      agentEvent: null, agentEventTimer: null, agentEventPosition: null,
      zoneMap,
    });
  },

  clearAll: () => {
    const state = get();
    if (state.subtitleTimer) clearTimeout(state.subtitleTimer);
    if (state.qrTimer) clearTimeout(state.qrTimer);
    if (state.agentStateTimer) clearTimeout(state.agentStateTimer);
    if (state.agentActionTimer) clearTimeout(state.agentActionTimer);
    if (state.agentThinkingTimer) clearTimeout(state.agentThinkingTimer);
    if (state.agentEventTimer) clearTimeout(state.agentEventTimer);
    set({
      subtitleText: null, subtitleTimer: null, subtitlePosition: null,
      cards: new Map(),
      qrUrl: null, qrTimer: null, qrPosition: null,
      agentState: null, agentStateTimer: null, agentStatePosition: null,
      agentAction: null, agentActionTimer: null, agentActionPosition: null,
      agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null,
      agentEvent: null, agentEventTimer: null, agentEventPosition: null,
      zoneMap: new Map(),
    });
  },
}));
