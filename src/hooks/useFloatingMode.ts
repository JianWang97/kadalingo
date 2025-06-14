import { useState, useEffect } from "react";

export const useFloatingMode = () => {
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const checkFloatingMode = async () => {
      if (window.electronAPI?.isFloatingMode) {
        const floating = await window.electronAPI.isFloatingMode();
        setIsFloating(floating);
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
