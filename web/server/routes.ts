import { Router } from 'express';
import type { ControlEvent, ClipManifest } from '@shared/types.js';
import type { Orchestrator } from './orchestrator.js';

export function createRoutes(orchestrator: Orchestrator, manifest: ClipManifest): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json(orchestrator.getStatus());
  });

  router.get('/manifest', (_req, res) => {
    res.json(manifest);
  });

  router.post('/event', (req, res) => {
    const event = req.body as ControlEvent;
    if (!event || !event.type) {
      res.status(400).json({ error: 'Missing event type' });
      return;
    }
    orchestrator.handleEvent(event);
    res.json({ ok: true, status: orchestrator.getStatus() });
  });

  return router;
}
