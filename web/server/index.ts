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
const distPath = path.resolve(__dirname, '..', 'dist');
const port = process.env.PORT ? Number(process.env.PORT) : SERVER_PORT;

// Scan clip manifest
const manifest = scanClipManifest(contentPath);

// Express app
const app = express();
app.use(express.json());

// Serve video content
app.use('/content', express.static(contentPath));

// Serve frontend build (production)
app.use(express.static(distPath));

// Start HTTP server
const server = app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
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

// SPA catch-all: serve index.html for client-side routes
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export { app, server };
