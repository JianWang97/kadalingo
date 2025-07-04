// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import packageJson from '../../package.json';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  toggleFloatingMode: () => ipcRenderer.invoke('toggle-floating-mode'),
  isFloatingMode: () => ipcRenderer.invoke('is-floating-mode'),
  openExternalLink: (url: string) => ipcRenderer.invoke('open-external-link', url),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('set-always-on-top', value),
});

// 暴露应用信息
contextBridge.exposeInMainWorld('appInfo', {
  version: packageJson.version,
});
