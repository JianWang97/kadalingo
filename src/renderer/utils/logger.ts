/**
 * 智能日志工具
 * 在生产环境中会被完全移除
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  log: (...args: any[]) => void;
}

const createLogger = (): Logger => {
  // 在生产环境中返回空函数，这样可以被 Terser 优化掉
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      log: () => {},
    };
  }

  // 开发环境中返回真实的 console 方法
  return {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    log: console.log.bind(console),
  };
};

// 导出单例 logger
export const logger = createLogger();

// 默认导出，方便使用
export default logger;

// 添加一些便捷方法
export const logGroup = (title: string, fn: () => void) => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  console.group(title);
  fn();
  console.groupEnd();
};

export const logTime = (label: string) => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  console.time(label);
};

export const logTimeEnd = (label: string) => {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
  console.timeEnd(label);
};
