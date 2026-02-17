import fs from 'fs';
import path from 'path';
import type { ClipManifest, ClipInfo, BridgeClip } from '@shared/types.js';

export function scanClipManifest(contentDir: string): ClipManifest {
  const manifest: ClipManifest = {
    idle_loops: [],
    bridges: [],
    interrupts: [],
    utility: [],
  };

  const categories = ['idle_loops', 'bridges', 'interrupts', 'utility'] as const;

  for (const category of categories) {
    const dir = path.join(contentDir, category);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
    files.sort();

    for (const filename of files) {
      const clipPath = `/content/${category}/${filename}`;

      if (category === 'bridges') {
        const bridge = parseBridgeFilename(filename, clipPath);
        if (bridge) {
          manifest.bridges.push(bridge);
        }
      } else {
        const clip: ClipInfo = { path: clipPath, filename, category };
        manifest[category].push(clip);
      }
    }
  }

  console.log(
    `[manifest] scanned: ${manifest.idle_loops.length} idle, ` +
    `${manifest.bridges.length} bridges, ` +
    `${manifest.interrupts.length} interrupts, ` +
    `${manifest.utility.length} utility`
  );

  return manifest;
}

function parseBridgeFilename(filename: string, clipPath: string): BridgeClip | null {
  // Expected format: from_to_suffix.mp4, e.g. "idle_to_show_right.mp4"
  const name = filename.replace(/\.(mp4|webm)$/, '');
  const toIndex = name.indexOf('_to_');
  if (toIndex === -1) return null;

  const from = name.substring(0, toIndex);
  const to = name.substring(toIndex + 4);

  return {
    path: clipPath,
    filename,
    category: 'bridges',
    from,
    to,
  };
}

export function findBridge(manifest: ClipManifest, from: string, to: string): BridgeClip | null {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  return manifest.bridges.find(b =>
    b.from.toLowerCase() === fromLower && b.to.toLowerCase() === toLower
  ) ?? null;
}
