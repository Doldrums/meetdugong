import{createRequire}from'module';const require=createRequire(import.meta.url);

// server/index.ts
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";

// shared/constants.ts
var FSM_STATES = [
  "IDLE",
  "AWARE",
  "GREET",
  "LISTEN",
  "THINK",
  "SPEAK",
  "SHOW",
  "GOODBYE"
];
var DEFAULT_STATE = "IDLE";
var WS_PATH = "/ws";
var SERVER_PORT = 3001;
var CONTENT_DIR = "../content";

// server/clip-manifest.ts
import fs from "fs";
import path from "path";
function scanClipManifest(contentDir) {
  const manifest2 = {
    idle_loops: [],
    bridges: [],
    interrupts: [],
    utility: [],
    actions: []
  };
  const categories = ["idle_loops", "bridges", "interrupts", "utility", "actions"];
  for (const category of categories) {
    const dir = path.join(contentDir, category);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mp4") || f.endsWith(".webm"));
    files.sort();
    for (const filename of files) {
      const clipPath = `/content/${category}/${filename}`;
      if (category === "bridges") {
        const bridge = parseBridgeFilename(filename, clipPath);
        if (bridge) {
          manifest2.bridges.push(bridge);
        }
      } else {
        const clip = { path: clipPath, filename, category };
        manifest2[category].push(clip);
      }
    }
  }
  console.log(
    `[manifest] scanned: ${manifest2.idle_loops.length} idle, ${manifest2.bridges.length} bridges, ${manifest2.interrupts.length} interrupts, ${manifest2.utility.length} utility, ${manifest2.actions.length} actions`
  );
  return manifest2;
}
function parseBridgeFilename(filename, clipPath) {
  const name = filename.replace(/\.(mp4|webm)$/, "");
  const toIndex = name.indexOf("_to_");
  if (toIndex === -1) return null;
  const from = name.substring(0, toIndex);
  const to = name.substring(toIndex + 4);
  return {
    path: clipPath,
    filename,
    category: "bridges",
    from,
    to
  };
}
function matchesFSMState(bridgeField, fsmState) {
  const field = bridgeField.toLowerCase();
  const state = fsmState.toLowerCase();
  return field === state || field.startsWith(state + "_");
}
function findBridge(manifest2, from, to) {
  return manifest2.bridges.find(
    (b) => matchesFSMState(b.from, from) && matchesFSMState(b.to, to)
  ) ?? null;
}

// server/ws-server.ts
import { WebSocketServer, WebSocket } from "ws";
var WSSServer = class {
  wss;
  clients = /* @__PURE__ */ new Set();
  onMessage = null;
  onConnect = null;
  constructor(server2) {
    this.wss = new WebSocketServer({ server: server2, path: WS_PATH });
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      console.log(`[ws] client connected (${this.clients.size} total)`);
      this.onConnect?.(ws);
      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.onMessage?.(msg, ws);
        } catch (err) {
          console.warn("[ws] invalid message:", err);
        }
      });
      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[ws] client disconnected (${this.clients.size} total)`);
      });
      ws.on("error", (err) => {
        console.error("[ws] client error:", err);
        this.clients.delete(ws);
      });
    });
  }
  setMessageHandler(handler) {
    this.onMessage = handler;
  }
  setConnectHandler(handler) {
    this.onConnect = handler;
  }
  broadcast(event) {
    const data = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
  send(ws, event) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }
  getClientCount() {
    return this.clients.size;
  }
};

// server/fsm.ts
var FSM = class {
  state = DEFAULT_STATE;
  getState() {
    return this.state;
  }
  transition(target) {
    if (!FSM_STATES.includes(target)) return null;
    if (target === this.state) return null;
    const from = this.state;
    this.state = target;
    return { from, to: target };
  }
  reset() {
    const from = this.state;
    this.state = DEFAULT_STATE;
    return { from, to: DEFAULT_STATE };
  }
};

// server/orchestrator.ts
var Orchestrator = class {
  fsm = new FSM();
  currentClip = null;
  lastError = null;
  manifest;
  wsServer;
  constructor(manifest2, wsServer2) {
    this.manifest = manifest2;
    this.wsServer = wsServer2;
    wsServer2.setMessageHandler((msg, ws) => this.handleMessage(msg, ws));
  }
  getStatus() {
    return {
      type: "status",
      orchestrator: "online",
      currentState: this.fsm.getState(),
      currentClip: this.currentClip,
      queueLength: 0,
      lastError: this.lastError
    };
  }
  handleEvent(event) {
    switch (event.type) {
      case "fsm.manual":
        this.handleFSMManual(event.state);
        break;
      case "fsm.reset":
        this.handleFSMReset();
        break;
      case "overlay.subtitle.set":
      case "overlay.subtitle.clear":
      case "overlay.card.show":
      case "overlay.card.hide":
      case "overlay.clearAll":
      case "overlay.qr.show":
      case "overlay.qr.hide":
        this.handleOverlay(event);
        break;
    }
  }
  handleMessage(msg, ws) {
    if (msg.type === "playback.started") {
      this.currentClip = msg.clip;
      this.wsServer.broadcast(msg);
      return;
    }
    if (msg.type === "playback.ended") {
      this.wsServer.broadcast(msg);
      return;
    }
    if (msg.type === "playback.queue") {
      this.wsServer.broadcast(msg);
      return;
    }
    if (msg.type === "queue.clear") {
      this.wsServer.broadcast(msg);
      return;
    }
    this.handleEvent(msg);
    if (msg.type === "status") {
      this.wsServer.send(ws, this.getStatus());
    }
  }
  handleFSMManual(targetState) {
    const result = this.fsm.transition(targetState);
    if (!result) return;
    let bridge = findBridge(this.manifest, result.from, result.to);
    if (!bridge && result.from !== "IDLE") {
      bridge = findBridge(this.manifest, result.from, "IDLE");
    }
    const stateClips = this.getClipsForState(result.to);
    const nextClip = this.pickClipForState(result.to);
    this.wsServer.broadcast({
      type: "fsm.transition",
      from: result.from,
      to: result.to,
      bridgeClip: bridge?.path ?? null,
      nextClip,
      stateClips
    });
  }
  handleFSMReset() {
    const result = this.fsm.reset();
    const exitBridge = findBridge(this.manifest, result.from, "IDLE");
    const stateClips = this.getClipsForState("IDLE");
    this.wsServer.broadcast({
      type: "fsm.transition",
      from: result.from,
      to: result.to,
      bridgeClip: exitBridge?.path ?? null,
      nextClip: null,
      stateClips
    });
    this.wsServer.broadcast({
      type: "overlay.applied",
      name: "clearAll",
      details: {}
    });
  }
  handleOverlay(event) {
    const { type, ...details } = event;
    const name = type.replace("overlay.", "");
    this.wsServer.broadcast({
      type: "overlay.applied",
      name,
      details
    });
    this.wsServer.broadcast(event);
  }
  getClipsForState(state) {
    if (state === "IDLE") {
      return this.manifest.idle_loops.map((c) => c.path);
    }
    const prefix = state.toLowerCase();
    return this.manifest.actions.filter((clip) => {
      const name = clip.filename.replace(/\.(mp4|webm)$/, "");
      return name.split("_")[0] === prefix;
    }).map((c) => c.path);
  }
  pickClipForState(state) {
    const clips = this.getClipsForState(state);
    if (state === "IDLE" || clips.length === 0) return null;
    return clips[Math.floor(Math.random() * clips.length)];
  }
  updateManifest(manifest2) {
    this.manifest = manifest2;
  }
};

// server/routes.ts
import { Router } from "express";
function createRoutes(orchestrator2, manifest2) {
  const router = Router();
  router.get("/status", (_req, res) => {
    res.json(orchestrator2.getStatus());
  });
  router.get("/manifest", (_req, res) => {
    res.json(manifest2);
  });
  router.post("/event", (req, res) => {
    const event = req.body;
    if (!event || !event.type) {
      res.status(400).json({ error: "Missing event type" });
      return;
    }
    orchestrator2.handleEvent(event);
    res.json({ ok: true, status: orchestrator2.getStatus() });
  });
  return router;
}

// server/index.ts
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var contentPath = path2.resolve(__dirname, "..", CONTENT_DIR);
var distPath = path2.resolve(__dirname, "..", "dist");
var port = process.env.PORT ? Number(process.env.PORT) : SERVER_PORT;
var manifest = scanClipManifest(contentPath);
var app = express();
app.use(express.json());
app.use("/content", express.static(contentPath));
app.use(express.static(distPath));
var server = app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
  console.log(`[server] serving content from ${contentPath}`);
});
var wsServer = new WSSServer(server);
var orchestrator = new Orchestrator(manifest, wsServer);
wsServer.setConnectHandler((ws) => {
  wsServer.send(ws, orchestrator.getStatus());
});
app.use(createRoutes(orchestrator, manifest));
app.get("{*path}", (_req, res) => {
  res.sendFile(path2.join(distPath, "index.html"));
});
export {
  app,
  server
};
