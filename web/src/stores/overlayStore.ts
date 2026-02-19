import { create } from 'zustand';
import type { OverlaySlot } from '@shared/overlayPositions';

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

  // Debug
  debugPositions: boolean;
  toggleDebugPositions: () => void;

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

  debugPositions: false,
  toggleDebugPositions: () => set((s) => ({ debugPositions: !s.debugPositions })),

  setSubtitle: (text, ttlMs, position) => {
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        set({ subtitleText: null, subtitleTimer: null, subtitlePosition: null });
      }, ttlMs);
    }
    set({ subtitleText: text, subtitleTimer: timer, subtitlePosition: position ?? null });
  },

  clearSubtitle: () => {
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);
    set({ subtitleText: null, subtitleTimer: null, subtitlePosition: null });
  },

  showCard: (card, ttlMs) => {
    set((state) => {
      const cards = new Map(state.cards);
      cards.set(card.id, card);
      return { cards };
    });
    if (ttlMs && ttlMs > 0) {
      setTimeout(() => {
        set((state) => {
          const cards = new Map(state.cards);
          cards.delete(card.id);
          return { cards };
        });
      }, ttlMs);
    }
  },

  hideCard: (id) => {
    set((state) => {
      const cards = new Map(state.cards);
      cards.delete(id);
      return { cards };
    });
  },

  showQR: (url, ttlMs, position) => {
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        set({ qrUrl: null, qrTimer: null, qrPosition: null });
      }, ttlMs);
    }
    set({ qrUrl: url, qrTimer: timer, qrPosition: position ?? null });
  },

  hideQR: () => {
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);
    set({ qrUrl: null, qrTimer: null, qrPosition: null });
  },

  // --- Agent overlays ---

  setAgentState: (data, ttlMs, position) => {
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentState: null, agentStateTimer: null, agentStatePosition: null }), ttlMs);
    }
    set({ agentState: data, agentStateTimer: timer, agentStatePosition: position ?? null });
  },

  clearAgentState: () => {
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    set({ agentState: null, agentStateTimer: null, agentStatePosition: null });
  },

  setAgentAction: (data, ttlMs, position) => {
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentAction: null, agentActionTimer: null, agentActionPosition: null }), ttlMs);
    }
    set({ agentAction: data, agentActionTimer: timer, agentActionPosition: position ?? null });
  },

  clearAgentAction: () => {
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    set({ agentAction: null, agentActionTimer: null, agentActionPosition: null });
  },

  setAgentThinking: (data, ttlMs, position) => {
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null }), ttlMs);
    }
    set({ agentThinking: data, agentThinkingTimer: timer, agentThinkingPosition: position ?? null });
  },

  clearAgentThinking: () => {
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    set({ agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null });
  },

  setAgentEvent: (data, ttlMs, position) => {
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentEvent: null, agentEventTimer: null, agentEventPosition: null }), ttlMs);
    }
    set({ agentEvent: data, agentEventTimer: timer, agentEventPosition: position ?? null });
  },

  clearAgentEvent: () => {
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    set({ agentEvent: null, agentEventTimer: null, agentEventPosition: null });
  },

  clearAllAgent: () => {
    const s = get();
    if (s.agentStateTimer) clearTimeout(s.agentStateTimer);
    if (s.agentActionTimer) clearTimeout(s.agentActionTimer);
    if (s.agentThinkingTimer) clearTimeout(s.agentThinkingTimer);
    if (s.agentEventTimer) clearTimeout(s.agentEventTimer);
    set({
      agentState: null, agentStateTimer: null, agentStatePosition: null,
      agentAction: null, agentActionTimer: null, agentActionPosition: null,
      agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null,
      agentEvent: null, agentEventTimer: null, agentEventPosition: null,
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
      subtitleText: null,
      subtitleTimer: null,
      subtitlePosition: null,
      cards: new Map(),
      qrUrl: null,
      qrTimer: null,
      qrPosition: null,
      agentState: null, agentStateTimer: null, agentStatePosition: null,
      agentAction: null, agentActionTimer: null, agentActionPosition: null,
      agentThinking: null, agentThinkingTimer: null, agentThinkingPosition: null,
      agentEvent: null, agentEventTimer: null, agentEventPosition: null,
    });
  },
}));
