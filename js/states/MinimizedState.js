
import { IWindowState } from '../services/interfaces.js';

export class MinimizedState extends IWindowState {
  static STATE_NAME = 'MINIMIZED';

  onEnter(prevState) {
    this.element.classList.add('minimized');
    this.element.dataset.state = MinimizedState.STATE_NAME;
    this.prevRect = prevState?.rect || this.window.getRect();
    
    // 隐藏窗口但保留布局空间
    this.element.style.visibility = 'hidden';
    this.element.style.pointerEvents = 'none';
  }

  onExit() {
    this.element.classList.remove('minimized');
    this.element.style.visibility = '';
    this.element.style.pointerEvents = '';
    this.element.removeAttribute('data-state');
  }

  get meta() {
    return {
      ...super.meta,
      canDrag: false,
      canResize: false,
      showInTaskbar: false
    };
  }
}