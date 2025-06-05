// services/interfaces.js
export class IWindowState {
  static STATE_NAME = 'base';
  constructor(windowInstance, eventBus) {
    this.eventBus = eventBus;
    this.window = windowInstance;
    this.element = windowInstance.element;
    this.controls = windowInstance.controls;
  }
  get meta() {
    return {
      ability: {
        canDrag: true,
        canResize: true,
        showHeader: true,
      },
      bind: {}
    };
  }
  onEnter() { throw Error('Not implemented'); }
  onExit() { throw Error('Not implemented'); }
}

export class IWindowInstance {
  constructor(id, title, url) {}
  setState(state) { throw Error('Not implemented'); }
  update() { throw Error('Not implemented'); }
  close() { throw Error('Not implemented'); }
}

export class IWindowManager {
  createWindow(title, url) { throw Error('Not implemented'); }
  closeWindow(id) { throw Error('Not implemented'); }
}