import fs from 'fs';
import path from 'path';
import type { ClipManifest, ClipInfo, BridgeClip, CharacterConfig, CharacterManifest } from '@shared/types.js';

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

/** Check if a bridge field (e.g. "show_right") matches an FSM state (e.g. "SHOW") */
function matchesFSMState(bridgeField: string, fsmState: string): boolean {
  const field = bridgeField.toLowerCase();
  const state = fsmState.toLowerCase();
  return field === state || field.startsWith(state + '_');
}

export function findBridge(manifest: ClipManifest, from: string, to: string): BridgeClip | null {
  return manifest.bridges.find(b =>
    matchesFSMState(b.from, from) && matchesFSMState(b.to, to)
  ) ?? null;
}

export function loadCharacterConfig(charDir: string): CharacterConfig | null {
  const configPath = path.join(charDir, 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as CharacterConfig;
  } catch {
    return null;
  }
}

function scanCharacterClips(charDir: string, characterId: string): ClipManifest {
  const manifest: ClipManifest = {
    idle_loops: [],
    bridges: [],
    interrupts: [],
    utility: [],
    actions: [],
  };

  const categories = ['idle_loops', 'bridges', 'interrupts', 'utility', 'actions'] as const;

  for (const category of categories) {
    const dir = path.join(charDir, category);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
    files.sort();

    for (const filename of files) {
      const clipPath = `/content/${characterId}/${category}/${filename}`;

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

  return manifest;
}

export function scanAllCharacters(contentDir: string): Map<string, CharacterManifest> {
  const characters = new Map<string, CharacterManifest>();

  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const charDir = path.join(contentDir, entry.name);
    const config = loadCharacterConfig(charDir);
    if (!config) continue; // skip dirs without config.json (e.g. images/)

    const characterId = entry.name;
    const clips = scanCharacterClips(charDir, characterId);
    const states = ['IDLE', ...Object.keys(config.states)];

    characters.set(characterId, {
      id: characterId,
      name: config.name,
      description: config.description,
      states,
      stateConfigs: config.states,
      clips,
    });

    console.log(
      `[manifest] ${characterId}: ${clips.idle_loops.length} idle, ` +
      `${clips.bridges.length} bridges, ` +
      `${clips.interrupts.length} interrupts, ` +
      `${clips.utility.length} utility, ` +
      `${clips.actions.length} actions`
    );
  }

  const ids = Array.from(characters.keys()).join(', ');
  console.log(`[server] found ${characters.size} characters: ${ids}`);

  return characters;
}
