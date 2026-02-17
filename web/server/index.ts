import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_PORT, CONTENT_DIR } from '@shared/constants.js';
import { scanClipManifest } from './clip-manifest.js';
import { WSSServer } from './ws-server.js';
import { Orchestrator } from './orchestrator.js';
import { createRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentPath = path.resolve(__dirname, '..', CONTENT_DIR);

// Scan clip manifest
const manifest = scanClipManifest(contentPath);

// Express app
const app = express();
app.use(express.json());

// Serve video content
app.use('/content', express.static(contentPath));

// Start HTTP server
const server = app.listen(SERVER_PORT, () => {
  console.log(`[server] listening on http://localhost:${SERVER_PORT}`);
  console.log(`[server] serving content from ${contentPath}`);
});

// WebSocket server
const wsServer = new WSSServer(server);

// Orchestrator
const orchestrator = new Orchestrator(manifest, wsServer);

// Send status snapshot to newly connected clients
wsServer.setConnectHandler((ws) => {
  wsServer.send(ws, orchestrator.getStatus());
});

// Mount REST routes
app.use(createRoutes(orchestrator, manifest));

export { app, server };
