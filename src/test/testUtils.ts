import { vi } from "vitest";

/**
 * 测试工具类
 */
export class TestUtils {  /**
   * 抑制控制台错误输出，返回 spy 对象用于验证和恢复
   * @returns console.error 的 spy 对象
   */
  static suppressConsoleError() {
    return vi.spyOn(console, 'error').mockImplementation(() => {
      // 静默处理错误输出
    });
  }
  /**
   * 抑制控制台警告输出，返回 spy 对象用于验证和恢复
   * @returns console.warn 的 spy 对象
   */
  static suppressConsoleWarn() {
    return vi.spyOn(console, 'warn').mockImplementation(() => {
      // 静默处理警告输出
    });
  }
  /**
   * 抑制控制台日志输出，返回 spy 对象用于验证和恢复
   * @returns console.log 的 spy 对象
   */
  static suppressConsoleLog() {
    return vi.spyOn(console, 'log').mockImplementation(() => {
      // 静默处理日志输出
    });
  }

  /**
   * 创建一个延迟函数
   * @param ms 延迟毫秒数
   * @returns Promise
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建一个模拟的异步错误
   * @param message 错误消息
   * @returns 拒绝的 Promise
   */
  static createAsyncError(message: string): Promise<never> {
    return Promise.reject(new Error(message));
  }
}
