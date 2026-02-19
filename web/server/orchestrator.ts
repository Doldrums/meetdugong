import type { WebSocket } from 'ws';
import type {
  WSMessage,
  ControlEvent,
  StatusEvent,
  ClipManifest,
  CharacterManifest,
  CharacterStateConfig,
} from '@shared/types.js';
import { FSM } from './fsm.js';
import { WSSServer } from './ws-server.js';
import { findBridge } from './clip-manifest.js';

export class Orchestrator {
  private fsm: FSM;
  private currentClip: string | null = null;
  private lastError: string | null = null;
  private characters: Map<string, CharacterManifest>;
  private activeCharacterId: string;
  private wsServer: WSSServer;

  constructor(characters: Map<string, CharacterManifest>, wsServer: WSSServer, defaultCharacterId?: string) {
    this.characters = characters;
    this.wsServer = wsServer;

    // Pick default character: explicit param, or first in map
    const firstId = characters.keys().next().value!;
    this.activeCharacterId = defaultCharacterId && characters.has(defaultCharacterId)
      ? defaultCharacterId
      : firstId;

    const activeChar = this.getActiveCharacter();
    this.fsm = new FSM(activeChar.states);

    wsServer.setMessageHandler((msg, ws) => this.handleMessage(msg, ws));
  }

  private getActiveCharacter(): CharacterManifest {
    return this.characters.get(this.activeCharacterId)!;
  }

  getActiveManifest(): ClipManifest {
    return this.getActiveCharacter().clips;
  }

  getCharacterList(): Array<{ id: string; name: string }> {
    return Array.from(this.characters.values()).map(c => ({ id: c.id, name: c.name }));
  }

  getStatus(): StatusEvent {
    const char = this.getActiveCharacter();
    return {
      type: 'status',
      orchestrator: 'online',
      currentState: this.fsm.getState(),
      currentClip: this.currentClip,
      queueLength: 0,
      lastError: this.lastError,
      activeCharacter: this.activeCharacterId,
      characters: this.getCharacterList(),
      fsmStates: char.states,
      stateConfigs: char.stateConfigs,
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
      case 'character.switch':
        this.handleCharacterSwitch(event.characterId);
        break;
      case 'overlay.subtitle.set':
      case 'overlay.subtitle.clear':
      case 'overlay.card.show':
      case 'overlay.card.hide':
      case 'overlay.clearAll':
      case 'overlay.qr.show':
      case 'overlay.qr.hide':
      case 'overlay.agent.state':
      case 'overlay.agent.state.clear':
      case 'overlay.agent.action':
      case 'overlay.agent.action.clear':
      case 'overlay.agent.thinking':
      case 'overlay.agent.thinking.clear':
      case 'overlay.agent.event':
      case 'overlay.agent.clear':
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
    if (msg.type === 'playback.queue') {
      this.wsServer.broadcast(msg);
      return;
    }
    if (msg.type === 'queue.clear') {
      this.wsServer.broadcast(msg as unknown as import('@shared/types.js').BroadcastEvent);
      return;
    }

    // Handle control events
    this.handleEvent(msg as ControlEvent);

    // Send status snapshot on connect messages that are just status requests
    if (msg.type === 'status') {
      this.wsServer.send(ws, this.getStatus());
    }
  }

  private handleFSMManual(targetState: string) {
    const manifest = this.getActiveManifest();
    const result = this.fsm.transition(targetState);
    if (!result) return;

    // Direct bridge first, then fall back to exit bridge (from → IDLE)
    let bridge = findBridge(manifest, result.from, result.to);
    if (!bridge && result.from !== 'IDLE') {
      bridge = findBridge(manifest, result.from, 'IDLE');
    }
    const stateClips = this.getClipsForState(result.to);
    const nextClip = this.pickClipForState(result.to);

    this.wsServer.broadcast({
      type: 'fsm.transition',
      from: result.from,
      to: result.to,
      bridgeClip: bridge?.path ?? null,
      nextClip,
      stateClips,
    });
  }

  private handleFSMReset() {
    const manifest = this.getActiveManifest();
    const result = this.fsm.reset();

    const exitBridge = findBridge(manifest, result.from, 'IDLE');
    const stateClips = this.getClipsForState('IDLE');

    // Broadcast transition
    this.wsServer.broadcast({
      type: 'fsm.transition',
      from: result.from,
      to: result.to,
      bridgeClip: exitBridge?.path ?? null,
      nextClip: null,
      stateClips,
    });

    // Clear overlays
    this.wsServer.broadcast({
      type: 'overlay.applied',
      name: 'clearAll',
      details: {},
    });
  }

  private handleCharacterSwitch(characterId: string) {
    if (!this.characters.has(characterId)) {
      this.wsServer.broadcast({
        type: 'error',
        code: 'INVALID_CHARACTER',
        message: `Unknown character: ${characterId}`,
      });
      return;
    }

    this.activeCharacterId = characterId;
    const char = this.getActiveCharacter();

    // Reset FSM to new character's states
    this.fsm.setValidStates(char.states);
    this.fsm.reset();
    this.currentClip = null;

    // Broadcast character switched with full manifest
    this.wsServer.broadcast({
      type: 'character.switched',
      characterId: char.id,
      characterName: char.name,
      states: char.states,
      stateConfigs: char.stateConfigs,
      manifest: char.clips,
    });

    // Broadcast FSM transition to IDLE
    this.wsServer.broadcast({
      type: 'fsm.transition',
      from: 'IDLE',
      to: 'IDLE',
      bridgeClip: null,
      nextClip: null,
      stateClips: this.getClipsForState('IDLE'),
    });

    // Clear overlays
    this.wsServer.broadcast({
      type: 'overlay.applied',
      name: 'clearAll',
      details: {},
    });

    console.log(`[orchestrator] switched to character: ${char.name} (${characterId})`);
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

  private getClipsForState(state: string): string[] {
    const manifest = this.getActiveManifest();
    if (state === 'IDLE') {
      return manifest.idle_loops.map((c) => c.path);
    }
    const char = this.getActiveCharacter();
    const stateConfig = char.stateConfigs[state];
    const prefix = stateConfig?.actionPrefix ?? state.toLowerCase();
    return manifest.actions
      .filter((clip) => {
        const name = clip.filename.replace(/\.(mp4|webm)$/, '');
        return name.startsWith(prefix + '_') || name === prefix;
      })
      .map((c) => c.path);
  }

  private pickClipForState(state: string): string | null {
    const clips = this.getClipsForState(state);
    if (state === 'IDLE' || clips.length === 0) return null;
    return clips[Math.floor(Math.random() * clips.length)];
  }
}
