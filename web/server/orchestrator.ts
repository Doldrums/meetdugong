import type { WebSocket } from 'ws';
import type {
  WSMessage,
  ControlEvent,
  StatusEvent,
  ClipManifest,
  FSMState,
} from '@shared/types.js';
import { FSM } from './fsm.js';
import { WSSServer } from './ws-server.js';
import { findBridge } from './clip-manifest.js';

export class Orchestrator {
  private fsm = new FSM();
  private currentClip: string | null = null;
  private lastError: string | null = null;
  private manifest: ClipManifest;
  private wsServer: WSSServer;

  constructor(manifest: ClipManifest, wsServer: WSSServer) {
    this.manifest = manifest;
    this.wsServer = wsServer;

    wsServer.setMessageHandler((msg, ws) => this.handleMessage(msg, ws));
  }

  getStatus(): StatusEvent {
    return {
      type: 'status',
      orchestrator: 'online',
      currentState: this.fsm.getState(),
      currentClip: this.currentClip,
      queueLength: 0,
      lastError: this.lastError,
    };
  }

  handleEvent(event: ControlEvent) {
    switch (event.type) {
      case 'fsm.manual':
        this.handleFSMManual(event.state);
        break;
      case 'fsm.reset':
        this.handleFSMReset();
        break;
      case 'overlay.subtitle.set':
      case 'overlay.subtitle.clear':
      case 'overlay.card.show':
      case 'overlay.card.hide':
      case 'overlay.clearAll':
      case 'overlay.qr.show':
      case 'overlay.qr.hide':
        this.handleOverlay(event);
        break;
    }
  }

  private handleMessage(msg: WSMessage, ws: WebSocket) {
    // Handle playback events from player
    if (msg.type === 'playback.started') {
      this.currentClip = msg.clip;
      this.wsServer.broadcast(msg);
      return;
    }
    if (msg.type === 'playback.ended') {
      this.wsServer.broadcast(msg);
      return;
    }

    // Handle control events
    this.handleEvent(msg as ControlEvent);

    // Send status snapshot on connect messages that are just status requests
    if (msg.type === 'status') {
      this.wsServer.send(ws, this.getStatus());
    }
  }

  private handleFSMManual(targetState: FSMState) {
    const result = this.fsm.transition(targetState);
    if (!result) return;

    const bridge = findBridge(this.manifest, result.from, result.to);
    const nextClip = this.pickClipForState(result.to);

    this.wsServer.broadcast({
      type: 'fsm.transition',
      from: result.from,
      to: result.to,
      bridgeClip: bridge?.path ?? null,
      nextClip,
    });
  }

  private handleFSMReset() {
    const result = this.fsm.reset();

    // Broadcast transition
    this.wsServer.broadcast({
      type: 'fsm.transition',
      from: result.from,
      to: result.to,
      bridgeClip: null,
      nextClip: null,
    });

    // Clear overlays
    this.wsServer.broadcast({
      type: 'overlay.applied',
      name: 'clearAll',
      details: {},
    });
  }

  private handleOverlay(event: ControlEvent) {
    // Broadcast overlay as applied event
    const { type, ...details } = event;
    const name = type.replace('overlay.', '');

    this.wsServer.broadcast({
      type: 'overlay.applied',
      name,
      details: details as Record<string, unknown>,
    });

    // Also broadcast the raw event so players can act on it
    this.wsServer.broadcast(event as unknown as import('@shared/types.js').BroadcastEvent);
  }

  private pickClipForState(state: FSMState): string | null {
    // For IDLE, return null — player manages idle loop locally
    if (state === 'IDLE') return null;

    // For SHOW, look for show-related clips in utility
    // For other states, we don't have dedicated clips yet — return null
    // The player will continue its idle loop or handle appropriately
    return null;
  }

  updateManifest(manifest: ClipManifest) {
    this.manifest = manifest;
  }
}
