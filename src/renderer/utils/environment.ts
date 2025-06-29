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
  return '1.0.3'; // 从 package.json 中读取
};

// 获取桌面版下载链接
export const getDesktopDownloadUrl = () => {
  const version = getAppVersion();
  return `https://download.kadalingo.top/kadalingo-${version}-Setup.exe`;
};
