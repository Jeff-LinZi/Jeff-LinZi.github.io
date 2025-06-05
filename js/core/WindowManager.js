// core/WindowManager.js
import { IWindowManager } from '../services/interfaces.js';
import { EventBus } from '../services/EventBus.js';
import { WindowInstance } from './WindowInstance.js';
import { STATES } from '../config/states.js';

export class WindowManager extends IWindowManager {
  constructor(eventBus) {
    super();
    if (!eventBus) throw new Error('EventBus is required');
    if (WindowManager.initialized) return; // 防止重复初始化
    
    this.windows = new Map();  // key: window URL
    this.zIndexBase = 1000;
    this.eventBus = eventBus;
    WindowManager.initialized = false;
    
    // 初始化事件监听
    this.initEventHandlers();
    WindowManager.initialized = true; // 设置标志位
    
    // 恢复持久化状态
    //this.restoreWindows();
  }


  // 实现接口方法
  createWindow(title, url) {
    // 存在性检查
    if (this.windows.has(url)) {
      return this.focusWindow(url);
    }

    // 创建新窗口实例
    const win = new WindowInstance(
      this.generateWindowId(),
      title,
      url,
      this.eventBus
    );
    
    // 添加到窗口Map
    this.windows.set(url, win); // 使用URL作为键

    // 发布创建事件
    this.eventBus.publish(EventBus.EVENTS.WINDOW_CREATED, {
      id: win.id,
      url: url,
      title: title,
      element: win.element
    });

    return win;
  }

  closeWindow(windowId) {
    // 查找并删除窗口
    if (!windowId) return; // 如果没有提供ID则不执行
    const win = this.findWindowById(windowId);
    if (!win) return; // 如果窗口不存在则不执行
    const url = win.url; // 获取窗口的URL
    if (!url) return; // 如果仍然没有URL则不执行
    // 关闭窗口
    this.windows.delete(url);
    console.log('窗口已关闭:', url, '当前窗口Map:', Array.from(this.windows.keys()));
  }


  // 私有方法
  initEventHandlers() {
    // 订阅窗口关闭事件，统一用 closeWindow 处理
    this.eventBus.subscribe(EventBus.EVENTS.WINDOW_CLOSED, (winId) => {
      this.closeWindow(winId);
      console.log(`Window ${winId} closed.`);
    });

    // 订阅窗口状态恢复事件
    this.eventBus.subscribe(EventBus.EVENTS.STATE_RESTORE, (windowId) => {
      const states = JSON.parse(localStorage.getItem('windowStates') || '{}');
      const state = states[windowId];
      if (state) {
        const win = this.findWindowById(windowId);
        console.log(`恢复窗口状态：Window ${windowId} with state:`, state);
        if (win) {
          win.normalRect = state.rect;
          win.setState(STATES[state.state]);
        }
      }
    });

    // 处理z-index请求
    this.eventBus.subscribe(EventBus.EVENTS.REQUEST_Z_INDEX, (windowId) => {
      this.updateWindowZIndex(windowId);
      console.log(`置顶：请求处理Z-index updated for window: ${windowId}`);
    });

    // 处理新标签页请求
    this.eventBus.subscribe(EventBus.EVENTS.OPEN_NEW_TAB, (url) => {
      if (typeof url !== 'string' || !url.startsWith('http')) {
      console.warn('忽略无效的OPEN_NEW_TAB事件:', url);
      return;
  }
      window.open(url, '_blank');
      console.log(`新标签页打开：URL ${url}`);
    });

    // 处理状态持久化
    this.eventBus.subscribe(EventBus.EVENTS.STATE_SAVE, (stateData) => {
      this.saveWindowState(stateData);
    });

    // 处理DOM点击事件委托
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      // 窗口打开逻辑
      if (this.shouldHandleLink(a, e)) {
        this.handleWindowLinkClick(a, e);
      }
    });
  }

  shouldHandleLink(a, event) {
    if (event.target.tagName === 'BUTTON') return false;
    return this.isInternalLink(a) &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !a.hasAttribute('data-no-window') &&
          !a.classList.contains('footnote-link');
  }

  isInternalLink(a) {
    return a && a.href && a.href.startsWith(window.location.origin);
  }

  generateWindowId() {
    return `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  focusWindow(url) {
    const win = this.windows.get(url);
    if (!win) return;

    // 更新z-index
    this.updateWindowZIndex(win.id);
    
    // 还原最小化状态
    //if (win.currentState.constructor === STATES.MINIMIZED) {
      //win.setState(STATES.NORMAL);
    //}
    
    return win;
  }

  updateWindowZIndex(windowId) {
    this.zIndexBase += 1;
    const win = this.findWindowById(windowId);
    if (win) {
      win.element.style.zIndex = this.zIndexBase;
      this.windows.forEach(win => win.element.classList.remove('active'));
      win.element.classList.add('active');
    }
    console.log(`置顶：更新窗口 ${windowId} 的 z-index: ${this.zIndexBase}`);
  }

  findWindowById(windowId) {
    console.log('查找窗口ID:', windowId);
    return Array.from(this.windows.values())
      .find(win => win.id === windowId);
  }

  handleWindowLinkClick(link, event) {
    event.preventDefault();
    const url = link.href;
    const title = link.dataset.windowTitle || link.textContent.trim();
    this.createWindow(title, url);
  }

  // 持久化相关方法
  saveWindowState(stateData) {
      if (!stateData.id || typeof stateData.id !== 'string') return;
      const states = JSON.parse(localStorage.getItem('windowStates') || '{}');
      let id = stateData.id;
      if (typeof id === 'object' && id !== null) {
        id = id.windowId || id.id;
      }
      const url = this.findWindowById(id)?.url;
      console.log('保存窗口状态:', id, 'URL:', url);
      if (!url) {
        console.warn('无法保存窗口状态：未找到URL');
        return; // 没有url就不保存
      }
      states[id] = {
        state: stateData.state,
        rect: stateData.rect,
        url: url
      };
      localStorage.setItem('windowStates', JSON.stringify(states));
      console.log('保存窗口状态成功');
    }

  restoreWindows() {
    const savedStates = JSON.parse(localStorage.getItem('windowStates') || '{}');
    Object.entries(savedStates).forEach(([winId, state]) => {
      if (!state.url) return; // 跳过无url的项
      let title = state.url.split('/').filter(Boolean).pop() || state.url;
      const win = this.createWindow(title, state.url);
      
      // 延迟恢复状态以确保DOM就绪
      setTimeout(() => {
        win.normalRect = state.rect;
        win.setState(STATES[state.state]);
      }, 50);
    });
  }

  // 窗口布局管理
  arrangeWindows(mode = 'cascade') {
    const OFFSET = 30;
    let x = 0, y = 0;
    
    this.windows.forEach(win => {
      if (mode === 'cascade') {
        win.element.style.left = `${x}px`;
        win.element.style.top = `${y}px`;
        x += OFFSET;
        y += OFFSET;
      } else if (mode === 'tile') {
        // 实现平铺布局逻辑
      }
    });
  }
}