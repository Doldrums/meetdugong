import type { FSMState } from './types.js';

export const FSM_STATES: FSMState[] = [
  'IDLE',
  'AWARE',
  'GREET',
  'LISTEN',
  'THINK',
  'SPEAK',
  'SHOW',
  'GOODBYE',
];

export const DEFAULT_STATE: FSMState = 'IDLE';

export const WS_PATH = '/ws';
export const SERVER_PORT = 3001;
export const CONTENT_DIR = '../content';

export const LOG_BUFFER_MAX = 500;

export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 30000;
