// 全局类型声明
declare global {
  const __IS_WEB__: boolean; // Web 环境标识
  const __DEV__: boolean; // 开发环境标识
  
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      toggleFloatingMode: () => Promise<boolean>;
      isFloatingMode: () => Promise<boolean>;
    };
  }
}

export {};
