// core/WindowInstance.js
import { IWindowInstance } from '../services/interfaces.js';
import { EventBus } from '../services/EventBus.js';
import { STATES } from '../config/states.js';

export class WindowInstance extends IWindowInstance {
  constructor(id, title, url, eventBus) {
    super();
    if (!eventBus) throw new Error('EventBus is required');
    
    // 核心属性
    this.id = id;
    this.title = title;
    this.url = url;
    this.eventBus = eventBus;
    this.currentState = null;
    this.normalRect = null;
    this.dragHandler = null;
    this.resizeHandler = null;

    // 初始化流程
    this.eventBus.subscribe(EventBus.EVENTS.WINDOW_CREATED, (data) => {
      if (data.id !== this.id) return;
      this.initElement();
      this.initControls();
      this.setState(STATES.NORMAL);
      this.initContent();
      setTimeout(() => this.initBehavior());
      document.getElementById('window-container').appendChild(this.element);
      console.log(`打开窗口：Window ${data.id} created with URL: ${data.url}`);
    });
  }


  // 实现接口方法
  setState(StateClass) {
    if (!Object.values(STATES).includes(StateClass)) {
      throw new Error(`Invalid state class: ${StateClass}`);
    }

    // 状态切换前发布事件
    this.eventBus.publish(EventBus.EVENTS.STATE_CHANGED, {
      windowId: this.id,
      previousState: this.currentState?.constructor.STATE_NAME,
      newState: StateClass.STATE_NAME
    });

    // 执行状态切换
    this.currentState?.onExit();
    this.currentState = new StateClass(this, this.eventBus);
    this.currentState.onEnter();
    this.update();
  }

  update() {
    const { ability = {}, bind = {} } = this.currentState?.meta || {};
    this.configureAbilities(ability);
    this.configureBindings(bind);
    this.updateZIndex();
    this.saveWindowState();
  }

  close() {
    this.eventBus.publish(EventBus.EVENTS.WINDOW_CLOSED, this.id);
    this.cleanup();
    console.log(`Window ${this.id} closed.`);
  }

  // 私有方法
  initElement() {
    this.element = document.createElement('div');
    this.element.className = 'window';
    this.element.id = this.id; // 用 id 属性
    this.element.dataset.url = this.url;
    this.element.innerHTML = `
      <div class="window-header" data-no-window>
        <span class="window-title">${this.title}</span>
        <div class="window-controls">
          <button class="window-pin" title="固定/取消固定">📌</button>
          <button class="window-newtab" title="新标签页">↗</button>
          <button class="window-min" title="最小化">−</button>
          <button class="window-max" title="最大化">□</button>
          <button class="window-close" title="关闭">×</button>
        </div>
      </div>
      <div class="window-content">加载中...</div>
      <div class="window-resize-handle"></div>
    `;
  }

  initControls() {
    const getElement = (selector) => this.element.querySelector(selector);
    
    this.controls = {
      header: getElement('.window-header'),
      pinBtn: getElement('.window-pin'),
      newtabBtn: getElement('.window-newtab'),
      minBtn: getElement('.window-min'),
      maxBtn: getElement('.window-max'),
      closeBtn: getElement('.window-close'),
      resizeHandle: getElement('.window-resize-handle')
    };

    // 通用事件绑定
    this.controls.closeBtn.onclick = () => this.close();
    this.controls.newtabBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation(); // 阻止冒泡，避免触发窗口的 mousedown 事件
      e.stopImmediatePropagation(); // 阻止同元素其他处理器
      this.eventBus.publish(EventBus.EVENTS.OPEN_NEW_TAB, this.url);
      console.log(`New tab opened for URL: ${this.url}`);
    }
  }

  async initContent() {
    try {
      const response = await fetch(`${this.url}?window=1`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mainContent = doc.querySelector('main')?.innerHTML ?? '<div class="window-error">未找到内容</div>';
      this.element.querySelector('.window-content').innerHTML = mainContent;
      this.eventBus.publish(EventBus.EVENTS.CONTENT_LOADED, {
        windowId: this.id,
        url: this.url
      });
    } catch (error) {
      this.element.querySelector('.window-content').innerHTML =
        `<div class="window-error">无法加载内容: ${error.message}</div>`;
      this.eventBus.publish(EventBus.EVENTS.CONTENT_ERROR, {
        windowId: this.id,
        error: error.message
      });
    }
  }

  initBehavior() {
    this.setupFocusHandling();
    this.setupPersistentState();
    this.restorePreviousState();
  }

  configureAbilities(ability) {
    this.toggleDrag(ability.canDrag);
    this.toggleResize(ability.canResize);
    this.controls.header.style.display = ability.showHeader ? '' : 'none';
    this.element.classList.toggle('windowbar-visible', ability.showInWindowbar);
  }

  configureBindings(bindings) {
    this.controls.pinBtn.onclick = () => 
      this.setState(bindings.pinBtn === 'NORMAL' ? STATES.NORMAL : STATES.PINNED);
      
    this.controls.maxBtn.onclick = () => 
      this.setState(bindings.maxBtn === 'NORMAL' ? STATES.NORMAL : STATES.MAXIMIZED);
    
    this.controls.minBtn.onclick = () => 
      this.setState(STATES.MINIMIZED);
  }

  // 获取焦点时自动置顶
  setupFocusHandling() {
    this.element.addEventListener('mousedown', () => {
      this.updateZIndex();
    });
  }

  // 持久化窗口状态（如位置、大小等）
  setupPersistentState() {
    // 示例：窗口移动或缩放时保存状态
    this.element.addEventListener('mouseup', () => {
      this.saveWindowState();
    });
  }
  
  // 状态持久化相关
  saveWindowState() {
    this.eventBus.publish(EventBus.EVENTS.STATE_SAVE, {
      id: this.id,
      state: this.currentState.constructor.STATE_NAME,
      rect: this.normalRect
    });
  }

  restorePreviousState() {
    this.eventBus.publish(EventBus.EVENTS.STATE_RESTORE, this.id);
  }

  // 其他核心功能实现...
  // [保持之前的拖拽/缩放实现，但改为通过事件总线通信]
  toggleDrag(enabled) {
    if (enabled) {
      this.dragHandler = (e) => {
        if (e.button !== 0) return; // 只响应左键
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = this.element.getBoundingClientRect();
        const offsetX = startX - rect.left;
        const offsetY = startY - rect.top;

        const onMouseMove = (moveEvent) => {
          this.element.style.left = `${moveEvent.clientX - offsetX}px`;
          this.element.style.top = `${moveEvent.clientY - offsetY}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      this.controls.header.addEventListener('mousedown', this.dragHandler);
    } else {
      this.controls.header.removeEventListener('mousedown', this.dragHandler);
      console.log(`拖拽：Window ${this.id} drag disabled.`);
      this.element.style.cursor = ''; // 恢复默认光标
    }
  }

  toggleResize(enabled) {
    if (enabled) {
      this.resizeHandler = (e) => {
        if (e.button !== 0) return;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = this.element.offsetWidth;
        const startHeight = this.element.offsetHeight;

        const onMouseMove = (moveEvent) => {
          this.element.style.width = `${startWidth + (moveEvent.clientX - startX)}px`;
          this.element.style.height = `${startHeight + (moveEvent.clientY - startY)}px`;
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
      this.controls.resizeHandle.addEventListener('mousedown', this.resizeHandler);
    } else {
      this.controls.resizeHandle.removeEventListener('mousedown', this.resizeHandler);
      console.log(`缩放：Window ${this.id} resize disabled.`);
      this.element.style.cursor = ''; // 恢复默认光标
    }
  }

  updateZIndex() {
    this.eventBus.publish(EventBus.EVENTS.REQUEST_Z_INDEX, this.id);
    console.log(`置顶：发布请求Window ${this.id} z-index updated.`);
}

  cleanup() {
    // 移除窗口的 DOM 元素
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    // 移除所有事件监听（如有绑定，可以在这里解绑）
    // 例如：this.element.removeEventListener(...)
    // 清理引用，帮助垃圾回收
    this.element = null;
    this.controls = null;
    this.currentState = null;
  }
}