export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentPromise: Promise<any> | null = null;

  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    // 如果已经有一个正在进行的请求，直接返回它
    if (currentPromise) {
      return currentPromise;
    }

    // 创建一个新的Promise
    currentPromise = new Promise((resolve, reject) => {
      // 如果已经有一个定时器，清除它
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 设置新的定时器
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          // 清理状态
          currentPromise = null;
          timeoutId = null;
        }
      }, wait);
    });

    return currentPromise;
  };
} 