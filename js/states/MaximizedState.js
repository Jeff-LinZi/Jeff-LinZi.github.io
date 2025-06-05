import { IWindowState } from '../services/interfaces.js';

export class MaximizedState extends IWindowState {
  static STATE_NAME = 'MAXIMIZED';

  onEnter() {
    this.eventBus.publish('maximized-state-entered', this.window);
    // 具体实现...
    this.element.classList.add('maximized');
    this.element.dataset.state = MaximizedState.STATE_NAME;


    // 最大化
    this.element.style.left = '0';
    this.element.style.top = '0';
    this.element.style.width = '100vw';
    this.element.style.height = '100vh';

    // 控制按钮状态
    this.window.controls.maxBtn.textContent = '🗗'; // 更改图标

  }
  
  onExit() {
    this.element.classList.remove('maximized');
    this.element.removeAttribute('data-state');

    // 恢复控制按钮状态
    this.window.controls.maxBtn.textContent = '□';
  }

  get meta() {
    return {
      ability: {
        canDrag: false,
        canResize: false,
        showHeader: true,
      },
      bind: {
        maxBtn: 'NORMAL' // 绑定最大化按钮
      }
    };
  }
}