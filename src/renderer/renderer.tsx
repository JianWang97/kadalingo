/**
 * 主题初始化：优先 localStorage，其次浏览器 prefers-color-scheme
 * 并监听 storage 事件，确保多标签页同步
 */
(function () {
  // Theme initialization is now handled by ThemeContext
})();
/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('👋 This message is being logged by "renderer.tsx", included via Vite');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
