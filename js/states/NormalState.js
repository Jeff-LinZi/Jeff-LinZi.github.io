import { IWindowState } from '../services/interfaces.js';

export class NormalState extends IWindowState {
  static STATE_NAME = 'NORMAL';

  onEnter() {
    // 通过事件总线通知样式变更
    this.eventBus.publish('style-update', {
      windowId: this.window.id,
      styles: {
        position: 'absolute',
        transform: 'none',
        cursor: 'move'
      }
    });
    // 还原窗口位置和大小
    if (this.window.normalRect) {
      this.element.style.left = this.window.normalRect.left;
      this.element.style.top = this.window.normalRect.top;
      this.element.style.width = this.window.normalRect.width;
      this.element.style.height = this.window.normalRect.height;
    }
  }

  onExit() {
    // 清理状态痕迹
    this.element.removeAttribute('data-state');
    this.element.style.cursor = '';
    this.window.normalRect = this.rect; // 保存当前矩形
  }

  get rect() {
    return {
      left: this.element.style.left,
      top: this.element.style.top,
      width: this.element.offsetWidth + 'px', // 使用实际计算值
      height: this.element.offsetHeight + 'px'
      }
  }
}