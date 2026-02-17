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

interface OverlayState {
  // Subtitle
  subtitleText: string | null;
  subtitleTimer: ReturnType<typeof setTimeout> | null;

  // Cards
  cards: Map<string, CardOverlayData>;

  // QR
  qrUrl: string | null;
  qrTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  setSubtitle: (text: string, ttlMs?: number) => void;
  clearSubtitle: () => void;
  showCard: (card: CardOverlayData, ttlMs?: number) => void;
  hideCard: (id: string) => void;
  showQR: (url: string, ttlMs?: number) => void;
  hideQR: () => void;
  clearAll: () => void;
}

export const useOverlayStore = create<OverlayState>((set, get) => ({
  subtitleText: null,
  subtitleTimer: null,
  cards: new Map(),
  qrUrl: null,
  qrTimer: null,

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

  clearAll: () => {
    const state = get();
    if (state.subtitleTimer) clearTimeout(state.subtitleTimer);
    if (state.qrTimer) clearTimeout(state.qrTimer);
    set({
      subtitleText: null,
      subtitleTimer: null,
      cards: new Map(),
      qrUrl: null,
      qrTimer: null,
    });
  },
}));
