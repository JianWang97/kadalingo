/**
 * 环境检测和兼容性工具
 */

// 检测是否在 Electron 环境中运行
export const isElectron = () => {
  return window.electronAPI !== undefined;
};

// 检测是否在 Web 环境中运行
export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && !isElectron();
};

// 检测是否支持 IndexedDB
export const isIndexedDBSupported = (): boolean => {
  return typeof window !== 'undefined' && 'indexedDB' in window;
};

// 获取运行环境信息
export const getEnvironmentInfo = () => {
  return {
    isElectron: isElectron(),
    isWeb: isWeb(),
    isIndexedDBSupported: isIndexedDBSupported(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
  };
};

// 获取应用标题（根据环境调整）
export const getAppTitle = (): string => {
  const baseTitle = '咔哒英语';
  if (isWeb()) {
    return `${baseTitle} - Web版`;
  }
  return baseTitle;
};

// 检查是否是 Windows 系统
export const isWindows = () => {
  return navigator.platform.indexOf('Win') > -1;
};

// 获取应用版本号
export const getAppVersion = () => {
  // 在 Electron 环境中从 preload 暴露的 appInfo 中读取
  if (isElectron()) {
    return window.appInfo?.version;
  }
  
  // 在 Web 环境中，从 Vite 注入的环境变量读取
  if (typeof __APP_VERSION__ !== 'undefined') {
    return __APP_VERSION__;
  }
  
  // 默认版本号
  return '0.0.0';
};

// 获取桌面版下载链接
export const getDesktopDownloadUrl = () => {
  const version = getAppVersion();
  return `https://download1.kadalingo.top/releases/v${version}/kadalingo-${version}-Setup.exe`;
};
