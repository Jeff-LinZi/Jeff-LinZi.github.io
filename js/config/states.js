// config/states.js
import { NormalState } from '../states/NormalState.js';
import { MaximizedState } from '../states/MaximizedState.js';
import { MinimizedState } from '../states/MinimizedState.js';
import { PinnedState } from '../states/PinnedState.js';

export const STATES = Object.freeze({
  NORMAL: NormalState,
  MAXIMIZED: MaximizedState,
  MINIMIZED: MinimizedState,
  PINNED: PinnedState
});

// 状态常量验证器
export function isValidState(state) {
  return Object.values(STATES)
    .some(s => s.STATE_NAME === state);
}

// 状态工厂方法
export function createState(stateName, windowInstance, eventBus) {
  const StateClass = Object.values(STATES)
    .find(s => s.STATE_NAME === stateName);
  
  if (!StateClass) throw new Error(`Invalid state: ${stateName}`);
  return new StateClass(windowInstance, eventBus);
}