import { DEFAULT_STATE } from '@shared/constants.js';

export class FSM {
  private state: string = DEFAULT_STATE;
  private validStates: Set<string>;

  constructor(states: string[]) {
    this.validStates = new Set(states);
  }

  getState(): string {
    return this.state;
  }

  transition(target: string): { from: string; to: string } | null {
    if (!this.validStates.has(target)) return null;
    if (target === this.state) return null;
    const from = this.state;
    this.state = target;
    return { from, to: target };
  }

  reset(): { from: string; to: string } {
    const from = this.state;
    this.state = DEFAULT_STATE;
    return { from, to: DEFAULT_STATE };
  }

  setValidStates(states: string[]) {
    this.validStates = new Set(states);
  }
}
