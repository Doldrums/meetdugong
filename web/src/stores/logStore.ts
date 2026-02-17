import { create } from 'zustand';
import type { WSMessage, LogEntry } from '@shared/types';
import { LOG_BUFFER_MAX } from '@shared/constants';

interface LogState {
  entries: LogEntry[];
  nextId: number;
  autoScroll: boolean;

  addEntry: (event: WSMessage, direction: 'inbound' | 'outbound') => void;
  setAutoScroll: (enabled: boolean) => void;
  clear: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  nextId: 1,
  autoScroll: true,

  addEntry: (event, direction) =>
    set((state) => {
      const entry: LogEntry = {
        id: state.nextId,
        timestamp: Date.now(),
        event,
        direction,
      };
      const entries = [...state.entries, entry];
      // Trim to max buffer
      if (entries.length > LOG_BUFFER_MAX) {
        entries.splice(0, entries.length - LOG_BUFFER_MAX);
      }
      return { entries, nextId: state.nextId + 1 };
    }),

  setAutoScroll: (enabled) => set({ autoScroll: enabled }),

  clear: () => set({ entries: [], nextId: 1 }),
}));
