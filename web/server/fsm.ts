import { FSMState } from '@shared/types.js';
import { DEFAULT_STATE, FSM_STATES } from '@shared/constants.js';

export class FSM {
  private state: FSMState = DEFAULT_STATE;

  getState(): FSMState {
    return this.state;
  }

  transition(target: FSMState): { from: FSMState; to: FSMState } | null {
    if (!FSM_STATES.includes(target)) return null;
    if (target === this.state) return null;
    const from = this.state;
    this.state = target;
    return { from, to: target };
  }

  reset(): { from: FSMState; to: FSMState } {
    const from = this.state;
    this.state = DEFAULT_STATE;
    return { from, to: DEFAULT_STATE };
  }
}
