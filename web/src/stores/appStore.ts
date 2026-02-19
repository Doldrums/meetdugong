import { create } from 'zustand';
import type { CharacterStateConfig, PlaybackQueueItem } from '@shared/types';

interface AppState {
  // FSM state
  currentState: string;
  previousState: string | null;
  currentClip: string | null;
  queueLength: number;
  lastError: string | null;

  // Connection
  wsConnected: boolean;
  orchestratorOnline: boolean;

  // Pending transition
  pendingState: string | null;

  // Playback
  clipPlaying: boolean;

  // Player queue
  playerTransitionActive: boolean;
  playerPendingClip: string | null;
  playerQueueItems: PlaybackQueueItem[];

  // Character info
  activeCharacter: string;
  characters: Array<{ id: string; name: string }>;
  fsmStates: string[];
  stateConfigs: Record<string, CharacterStateConfig>;

  // Actions
  setFSMState: (state: string) => void;
  setTransition: (from: string, to: string) => void;
  setCurrentClip: (clip: string | null) => void;
  setClipPlaying: (playing: boolean) => void;
  setQueueLength: (len: number) => void;
  setLastError: (err: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  setOrchestratorOnline: (online: boolean) => void;
  setPendingState: (state: string | null) => void;
  setPlayerQueue: (active: boolean, pendingClip: string | null, items: PlaybackQueueItem[]) => void;
  setActiveCharacter: (id: string) => void;
  setCharacterInfo: (info: {
    activeCharacter: string;
    characters: Array<{ id: string; name: string }>;
    fsmStates: string[];
    stateConfigs: Record<string, CharacterStateConfig>;
  }) => void;
  applyStatus: (status: {
    currentState: string;
    currentClip: string | null;
    queueLength: number;
    lastError: string | null;
    orchestrator: string;
    activeCharacter: string;
    characters: Array<{ id: string; name: string }>;
    fsmStates: string[];
    stateConfigs: Record<string, CharacterStateConfig>;
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
  activeCharacter: '',
  characters: [],
  fsmStates: ['IDLE'],
  stateConfigs: {},

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
  setActiveCharacter: (id) => set({ activeCharacter: id }),
  setCharacterInfo: (info) => set({
    activeCharacter: info.activeCharacter,
    characters: info.characters,
    fsmStates: info.fsmStates,
    stateConfigs: info.stateConfigs,
  }),
  applyStatus: (status) =>
    set({
      currentState: status.currentState,
      currentClip: status.currentClip,
      queueLength: status.queueLength,
      lastError: status.lastError,
      orchestratorOnline: status.orchestrator === 'online',
      pendingState: null,
      activeCharacter: status.activeCharacter,
      characters: status.characters,
      fsmStates: status.fsmStates,
      stateConfigs: status.stateConfigs,
    }),
}));
