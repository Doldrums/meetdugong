import type { OverlaySlot } from './overlayPositions';

// FSM States — dynamic, driven by character config.json
export type FSMState = string;

// Character configuration types
export interface CharacterStateConfig {
  label?: string;
  color?: string;
  actionPrefix?: string;
}

export interface CharacterConfig {
  name: string;
  description?: string;
  states: Record<string, CharacterStateConfig>;
}

export interface CharacterManifest {
  id: string;
  name: string;
  description?: string;
  states: string[];                              // ['IDLE', ...] always includes IDLE
  stateConfigs: Record<string, CharacterStateConfig>;
  clips: ClipManifest;
}

// Clip categories
export type ClipCategory = 'idle_loops' | 'bridges' | 'interrupts' | 'utility' | 'actions';

export interface ClipInfo {
  path: string;       // e.g. "/content/dugong_v1/idle_loops/idle_0.mp4"
  filename: string;   // e.g. "idle_0.mp4"
  category: ClipCategory;
}

export interface BridgeClip extends ClipInfo {
  from: string;
  to: string;
}

export interface ClipManifest {
  idle_loops: ClipInfo[];
  bridges: BridgeClip[];
  interrupts: ClipInfo[];
  utility: ClipInfo[];
  actions: ClipInfo[];
}

// --- Control Events (Admin → Orchestrator) ---

export interface FSMManualEvent {
  type: 'fsm.manual';
  state: FSMState;
}

export interface FSMResetEvent {
  type: 'fsm.reset';
}

export interface QueueClearEvent {
  type: 'queue.clear';
}

export interface CharacterSwitchEvent {
  type: 'character.switch';
  characterId: string;
}

export interface OverlaySubtitleSetEvent {
  type: 'overlay.subtitle.set';
  text: string;
  position?: OverlaySlot;
  ttlMs?: number;
}

export interface OverlaySubtitleClearEvent {
  type: 'overlay.subtitle.clear';
}

export interface OverlayCardShowEvent {
  type: 'overlay.card.show';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: string;
  cta?: string;
  position?: OverlaySlot;
  ttlMs?: number;
}

export interface OverlayCardHideEvent {
  type: 'overlay.card.hide';
  id: string;
}

export interface OverlayClearAllEvent {
  type: 'overlay.clearAll';
}

export interface OverlayQRShowEvent {
  type: 'overlay.qr.show';
  url: string;
  position?: OverlaySlot;
  ttlMs?: number;
}

export interface OverlayQRHideEvent {
  type: 'overlay.qr.hide';
}

// --- Agent Overlay Events (OpenClaw) ---

/** Show agent FSM state badge on screen */
export interface OverlayAgentStateEvent {
  type: 'overlay.agent.state';
  state: string;
  label?: string;
  color?: string;
  position?: OverlaySlot;
  ttlMs?: number;
}

/** Clear agent state badge */
export interface OverlayAgentStateClearEvent {
  type: 'overlay.agent.state.clear';
}

/** Show what the agent is currently doing (tool call, planning, etc.) */
export interface OverlayAgentActionEvent {
  type: 'overlay.agent.action';
  action: string;
  detail?: string;
  tool?: string;
  progress?: number;   // 0–1
  position?: OverlaySlot;
  ttlMs?: number;
}

/** Clear agent action panel */
export interface OverlayAgentActionClearEvent {
  type: 'overlay.agent.action.clear';
}

/** Show thinking/reasoning indicator */
export interface OverlayAgentThinkingEvent {
  type: 'overlay.agent.thinking';
  text?: string;
  steps?: string[];
  position?: OverlaySlot;
  ttlMs?: number;
}

/** Clear thinking indicator */
export interface OverlayAgentThinkingClearEvent {
  type: 'overlay.agent.thinking.clear';
}

/** Show a brief event toast */
export interface OverlayAgentEventEvent {
  type: 'overlay.agent.event';
  eventType: string;
  summary: string;
  position?: OverlaySlot;
  ttlMs?: number;
}

/** Clear all agent overlays at once */
export interface OverlayAgentClearEvent {
  type: 'overlay.agent.clear';
}

export type ControlEvent =
  | FSMManualEvent
  | FSMResetEvent
  | QueueClearEvent
  | CharacterSwitchEvent
  | OverlaySubtitleSetEvent
  | OverlaySubtitleClearEvent
  | OverlayCardShowEvent
  | OverlayCardHideEvent
  | OverlayClearAllEvent
  | OverlayQRShowEvent
  | OverlayQRHideEvent
  | OverlayAgentStateEvent
  | OverlayAgentStateClearEvent
  | OverlayAgentActionEvent
  | OverlayAgentActionClearEvent
  | OverlayAgentThinkingEvent
  | OverlayAgentThinkingClearEvent
  | OverlayAgentEventEvent
  | OverlayAgentClearEvent;

// --- Broadcast Events (Orchestrator → Player/Admin) ---

export interface StatusEvent {
  type: 'status';
  orchestrator: 'online' | 'offline';
  currentState: FSMState;
  currentClip: string | null;
  queueLength: number;
  lastError: string | null;
  activeCharacter: string;
  characters: Array<{ id: string; name: string }>;
  fsmStates: string[];
  stateConfigs: Record<string, CharacterStateConfig>;
}

export interface FSMTransitionEvent {
  type: 'fsm.transition';
  from: FSMState;
  to: FSMState;
  bridgeClip: string | null;
  nextClip: string | null;
  stateClips: string[];
}

export interface PlaybackStartedEvent {
  type: 'playback.started';
  clip: string;
}

export interface PlaybackEndedEvent {
  type: 'playback.ended';
  clip: string;
}

export interface PlaybackQueueItem {
  bridge: string | null;
  target: string | null;
  targetState: string;
}

export interface PlaybackQueueEvent {
  type: 'playback.queue';
  transitionActive: boolean;
  pendingClip: string | null;
  items: PlaybackQueueItem[];
}

export interface OverlayAppliedEvent {
  type: 'overlay.applied';
  name: string;
  details: Record<string, unknown>;
}

export interface CharacterSwitchedEvent {
  type: 'character.switched';
  characterId: string;
  characterName: string;
  states: string[];
  stateConfigs: Record<string, CharacterStateConfig>;
  manifest: ClipManifest;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type BroadcastEvent =
  | StatusEvent
  | FSMTransitionEvent
  | PlaybackStartedEvent
  | PlaybackEndedEvent
  | PlaybackQueueEvent
  | OverlayAppliedEvent
  | CharacterSwitchedEvent
  | ErrorEvent;

export type WSMessage = ControlEvent | BroadcastEvent;

// Log entry for event log
export interface LogEntry {
  id: number;
  timestamp: number;
  event: WSMessage;
  direction: 'inbound' | 'outbound';
}
