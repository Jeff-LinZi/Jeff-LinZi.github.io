// states/PinnedState.js
import { IWindowState } from '../services/interfaces.js';

export class PinnedState extends IWindowState {
  static STATE_NAME = 'PINNED';

  onEnter(prevState) {
    // 保存进入状态前的信息
    this.prevStateData = {
      rect: prevState?.rect || this.window.getRect(),
      zIndex: this.element.style.zIndex
    };

    // 应用状态样式
    this.element.dataset.state = PinnedState.STATE_NAME;
    this.element.style.transform = 'none';
    this.element.style.cursor = 'default';

    // 更新控制按钮
    if (this.controls.pinBtn) {
      this.controls.pinBtn.textContent = '📍';
      this.controls.pinBtn.classList.add('active');
      this.controls.pinBtn.disabled = false;
    }
  }

  onExit() {
    // 清理状态痕迹
    this.element.removeAttribute('data-state');
    this.element.style.cursor = '';
    if (this.controls.pinBtn) {
      this.controls.pinBtn.textContent = '📌';
      this.controls.pinBtn.classList.remove('active');
      this.controls.pinBtn.disabled = false;
    }
  }

  get meta() {
    return {
      ...super.meta,
      canDrag: false,
      canResize: false,
      showControls: false // 隐藏控制按钮
    };
  }
}