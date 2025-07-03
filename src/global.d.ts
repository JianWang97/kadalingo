// 全局类型声明
declare global {
  const __IS_WEB__: boolean; // Web 环境标识
  const __DEV__: boolean; // 开发环境标识
  const __APP_VERSION__: string; // 应用版本号
  
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      toggleFloatingMode: () => Promise<boolean>;
      isFloatingMode: () => Promise<boolean>;
      openExternalLink: (url: string) => Promise<void>;
      setAlwaysOnTop: (value: boolean) => Promise<void>;
    };
    appInfo?: {
      version: string;
    };
  }
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

export {};
