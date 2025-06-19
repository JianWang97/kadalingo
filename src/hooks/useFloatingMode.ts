import { useState, useEffect } from "react";

export const useFloatingMode = () => {
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const checkFloatingMode = async () => {
      // 检查是否在 Electron 环境中
      if (window.electronAPI?.isFloatingMode) {
        try {
          const floating = await window.electronAPI.isFloatingMode();
          setIsFloating(floating);
        } catch (error) {
          console.warn('Failed to check floating mode:', error);
          setIsFloating(false);
        }
      } else {
        // Web 环境下不支持浮窗模式
        setIsFloating(false);
      }
    };

    checkFloatingMode();

    // 监听窗口大小变化来判断是否切换了模式
    const handleResize = () => {
      checkFloatingMode();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isFloating;
};
