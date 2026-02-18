// FSM States
export type FSMState =
  | 'IDLE'
  | 'AWARE'
  | 'GREET'
  | 'LISTEN'
  | 'THINK'
  | 'SPEAK'
  | 'SHOW'
  | 'GOODBYE';

// Clip categories
export type ClipCategory = 'idle_loops' | 'bridges' | 'interrupts' | 'utility' | 'actions';

export interface ClipInfo {
  path: string;       // e.g. "/content/idle_loops/idle_0.mp4"
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

export interface OverlaySubtitleSetEvent {
  type: 'overlay.subtitle.set';
  text: string;
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
  position?: 'left' | 'right';
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
  ttlMs?: number;
}

export interface OverlayQRHideEvent {
  type: 'overlay.qr.hide';
}

export type ControlEvent =
  | FSMManualEvent
  | FSMResetEvent
  | QueueClearEvent
  | OverlaySubtitleSetEvent
  | OverlaySubtitleClearEvent
  | OverlayCardShowEvent
  | OverlayCardHideEvent
  | OverlayClearAllEvent
  | OverlayQRShowEvent
  | OverlayQRHideEvent;

// --- Broadcast Events (Orchestrator → Player/Admin) ---

export interface StatusEvent {
  type: 'status';
  orchestrator: 'online' | 'offline';
  currentState: FSMState;
  currentClip: string | null;
  queueLength: number;
  lastError: string | null;
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
  | ErrorEvent;

export type WSMessage = ControlEvent | BroadcastEvent;

// Log entry for event log
export interface LogEntry {
  id: number;
  timestamp: number;
  event: WSMessage;
  direction: 'inbound' | 'outbound';
}
