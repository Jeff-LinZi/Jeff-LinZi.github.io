// services/EventBus.js
export class EventBus {
  static EVENTS = {
    WINDOW_CREATED: 'window-created',
    WINDOW_CLOSED: 'window-closed',
    STATE_CHANGED: 'state-changed',
    STATE_SAVE: 'state-save',       // 保存窗口状态
    STATE_RESTORE: 'state-restore', // 恢复窗口状态
    STATE_RESET: 'state-reset'      // 重置窗口状态
  };

  constructor() {
    this.events = new Map();
  }

  subscribe(event, callback) {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event).add(callback);
  }

  publish(event, data) {
    this.events.get(event)?.forEach(cb => cb(data));
  }
}