import { create } from 'zustand';
import type { FSMState, PlaybackQueueItem } from '@shared/types';

interface AppState {
  // FSM state
  currentState: FSMState;
  previousState: FSMState | null;
  currentClip: string | null;
  queueLength: number;
  lastError: string | null;

  // Connection
  wsConnected: boolean;
  orchestratorOnline: boolean;

  // Pending transition
  pendingState: FSMState | null;

  // Playback
  clipPlaying: boolean;

  // Player queue
  playerTransitionActive: boolean;
  playerPendingClip: string | null;
  playerQueueItems: PlaybackQueueItem[];

  // Actions
  setFSMState: (state: FSMState) => void;
  setTransition: (from: FSMState, to: FSMState) => void;
  setCurrentClip: (clip: string | null) => void;
  setClipPlaying: (playing: boolean) => void;
  setQueueLength: (len: number) => void;
  setLastError: (err: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  setOrchestratorOnline: (online: boolean) => void;
  setPendingState: (state: FSMState | null) => void;
  setPlayerQueue: (active: boolean, pendingClip: string | null, items: PlaybackQueueItem[]) => void;
  applyStatus: (status: {
    currentState: FSMState;
    currentClip: string | null;
    queueLength: number;
    lastError: string | null;
    orchestrator: string;
  }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentState: 'IDLE',
  previousState: null,
  currentClip: null,
  queueLength: 0,
  lastError: null,
  wsConnected: false,
  orchestratorOnline: false,
  pendingState: null,
  clipPlaying: false,
  playerTransitionActive: false,
  playerPendingClip: null,
  playerQueueItems: [],

  setFSMState: (state) => set({ currentState: state, pendingState: null }),
  setTransition: (from, to) => set({ previousState: from, currentState: to, pendingState: null }),
  setCurrentClip: (clip) => set({ currentClip: clip }),
  setClipPlaying: (playing) => set({ clipPlaying: playing }),
  setQueueLength: (len) => set({ queueLength: len }),
  setLastError: (err) => set({ lastError: err }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setOrchestratorOnline: (online) => set({ orchestratorOnline: online }),
  setPendingState: (state) => set({ pendingState: state }),
  setPlayerQueue: (active, pendingClip, items) => set({
    playerTransitionActive: active,
    playerPendingClip: pendingClip,
    playerQueueItems: items,
  }),
  applyStatus: (status) =>
    set({
      currentState: status.currentState,
      currentClip: status.currentClip,
      queueLength: status.queueLength,
      lastError: status.lastError,
      orchestratorOnline: status.orchestrator === 'online',
      pendingState: null,
    }),
}));
