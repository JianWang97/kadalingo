/**
 * 环境检测和兼容性工具
 */

// 检测是否在 Electron 环境中运行
export const isElectron = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    window.electronAPI !== undefined &&
    typeof window.electronAPI === 'object'
  );
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
