import { create } from 'zustand';

export interface CardOverlayData {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: string;
  cta?: string;
  position?: 'left' | 'right';
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

  // Cards
  cards: Map<string, CardOverlayData>;

  // QR
  qrUrl: string | null;
  qrTimer: ReturnType<typeof setTimeout> | null;

  // Agent overlays (OpenClaw)
  agentState: AgentStateData | null;
  agentStateTimer: ReturnType<typeof setTimeout> | null;
  agentAction: AgentActionData | null;
  agentActionTimer: ReturnType<typeof setTimeout> | null;
  agentThinking: AgentThinkingData | null;
  agentThinkingTimer: ReturnType<typeof setTimeout> | null;
  agentEvent: AgentEventData | null;
  agentEventTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  setSubtitle: (text: string, ttlMs?: number) => void;
  clearSubtitle: () => void;
  showCard: (card: CardOverlayData, ttlMs?: number) => void;
  hideCard: (id: string) => void;
  showQR: (url: string, ttlMs?: number) => void;
  hideQR: () => void;
  setAgentState: (data: AgentStateData, ttlMs?: number) => void;
  clearAgentState: () => void;
  setAgentAction: (data: AgentActionData, ttlMs?: number) => void;
  clearAgentAction: () => void;
  setAgentThinking: (data: AgentThinkingData, ttlMs?: number) => void;
  clearAgentThinking: () => void;
  setAgentEvent: (data: AgentEventData, ttlMs?: number) => void;
  clearAgentEvent: () => void;
  clearAllAgent: () => void;
  clearAll: () => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  subtitleText: null,
  subtitleTimer: null,
  cards: new Map(),
  qrUrl: null,
  qrTimer: null,
  agentState: null,
  agentStateTimer: null,
  agentAction: null,
  agentActionTimer: null,
  agentThinking: null,
  agentThinkingTimer: null,
  agentEvent: null,
  agentEventTimer: null,

  setSubtitle: (text, ttlMs) => {
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        set({ subtitleText: null, subtitleTimer: null });
      }, ttlMs);
    }
    set({ subtitleText: text, subtitleTimer: timer });
  },

  clearSubtitle: () => {
    const prev = get().subtitleTimer;
    if (prev) clearTimeout(prev);
    set({ subtitleText: null, subtitleTimer: null });
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

  showQR: (url, ttlMs) => {
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => {
        set({ qrUrl: null, qrTimer: null });
      }, ttlMs);
    }
    set({ qrUrl: url, qrTimer: timer });
  },

  hideQR: () => {
    const prev = get().qrTimer;
    if (prev) clearTimeout(prev);
    set({ qrUrl: null, qrTimer: null });
  },

  // --- Agent overlays ---

  setAgentState: (data, ttlMs) => {
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentState: null, agentStateTimer: null }), ttlMs);
    }
    set({ agentState: data, agentStateTimer: timer });
  },

  clearAgentState: () => {
    const prev = get().agentStateTimer;
    if (prev) clearTimeout(prev);
    set({ agentState: null, agentStateTimer: null });
  },

  setAgentAction: (data, ttlMs) => {
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentAction: null, agentActionTimer: null }), ttlMs);
    }
    set({ agentAction: data, agentActionTimer: timer });
  },

  clearAgentAction: () => {
    const prev = get().agentActionTimer;
    if (prev) clearTimeout(prev);
    set({ agentAction: null, agentActionTimer: null });
  },

  setAgentThinking: (data, ttlMs) => {
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentThinking: null, agentThinkingTimer: null }), ttlMs);
    }
    set({ agentThinking: data, agentThinkingTimer: timer });
  },

  clearAgentThinking: () => {
    const prev = get().agentThinkingTimer;
    if (prev) clearTimeout(prev);
    set({ agentThinking: null, agentThinkingTimer: null });
  },

  setAgentEvent: (data, ttlMs) => {
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (ttlMs && ttlMs > 0) {
      timer = setTimeout(() => set({ agentEvent: null, agentEventTimer: null }), ttlMs);
    }
    set({ agentEvent: data, agentEventTimer: timer });
  },

  clearAgentEvent: () => {
    const prev = get().agentEventTimer;
    if (prev) clearTimeout(prev);
    set({ agentEvent: null, agentEventTimer: null });
  },

  clearAllAgent: () => {
    const s = get();
    if (s.agentStateTimer) clearTimeout(s.agentStateTimer);
    if (s.agentActionTimer) clearTimeout(s.agentActionTimer);
    if (s.agentThinkingTimer) clearTimeout(s.agentThinkingTimer);
    if (s.agentEventTimer) clearTimeout(s.agentEventTimer);
    set({
      agentState: null, agentStateTimer: null,
      agentAction: null, agentActionTimer: null,
      agentThinking: null, agentThinkingTimer: null,
      agentEvent: null, agentEventTimer: null,
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
      cards: new Map(),
      qrUrl: null,
      qrTimer: null,
      agentState: null, agentStateTimer: null,
      agentAction: null, agentActionTimer: null,
      agentThinking: null, agentThinkingTimer: null,
      agentEvent: null, agentEventTimer: null,
    });
  },
}));
