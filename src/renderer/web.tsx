/**
 * Web 版入口文件
 * 这个文件用于 Web 版本，不包含 Electron 相关代码
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🌐 Web version of 咔哒英语 is running');

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root element not found');
}
