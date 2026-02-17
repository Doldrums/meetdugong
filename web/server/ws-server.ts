import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WSMessage, BroadcastEvent } from '@shared/types.js';
import { WS_PATH } from '@shared/constants.js';

export class WSSServer {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();
  private onMessage: ((msg: WSMessage, ws: WebSocket) => void) | null = null;
  private onConnect: ((ws: WebSocket) => void) | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: WS_PATH });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[ws] client connected (${this.clients.size} total)`);

      this.onConnect?.(ws);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString()) as WSMessage;
          this.onMessage?.(msg, ws);
        } catch (err) {
          console.warn('[ws] invalid message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[ws] client disconnected (${this.clients.size} total)`);
      });

      ws.on('error', (err) => {
        console.error('[ws] client error:', err);
        this.clients.delete(ws);
      });
    });
  }

  setMessageHandler(handler: (msg: WSMessage, ws: WebSocket) => void) {
    this.onMessage = handler;
  }

  setConnectHandler(handler: (ws: WebSocket) => void) {
    this.onConnect = handler;
  }

  broadcast(event: BroadcastEvent) {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  send(ws: WebSocket, event: BroadcastEvent) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
