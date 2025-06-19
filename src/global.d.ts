// Electron Forge Vite 插件注入的全局变量
declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
  const MAIN_WINDOW_VITE_NAME: string;
  const __IS_WEB__: boolean; // Web 环境标识
  
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
