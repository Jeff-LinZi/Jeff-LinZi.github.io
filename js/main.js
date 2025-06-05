// main.js
import { WindowManager } from './core/WindowManager.js';
import { EventBus } from './services/EventBus.js';

new WindowManager(new EventBus());