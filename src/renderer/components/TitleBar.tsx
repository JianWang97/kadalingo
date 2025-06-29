import React, { useState, useEffect } from "react";
import { useFloatingMode } from "../hooks/useFloatingMode";
import { isElectron } from "../utils/environment";

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title = "Kada Lingo" }) => {
  const isFloating = useFloatingMode();
  const inElectron = isElectron();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [starCount, setStarCount] = useState<number | null>(null);

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("https://api.github.com/repos/JianWang97/kadalingo")
      .then((res) => res.json())
      .then((data) => setStarCount(data.stargazers_count))
      .catch(() => setStarCount(null));
  }, []);

  // 小窗模式下隐藏标题栏
  if (isFloating) return null;
  // 只保留主标题栏和窗口控制按钮
  const handleMinimize = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.maximize();
    } catch (error) {
      console.error("Failed to maximize window:", error);
    }
  };

  const handleClose = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };
  return (
    <div className="titlebar-surface flex items-center justify-between h-12 px-6 select-none relative transition-all duration-300 border-surface-variant/10">
      {/* 拖拽区域 - 只在 Electron 中启用 */}
      {inElectron && (
        <div className="absolute inset-0 drag-region" style={{ zIndex: 0 }} />
      )}
      {/* 左侧：应用图标和标题 */}
      <div className="flex items-center gap-4 no-drag relative z-10">
        {/* GitHub 链接标记 */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (inElectron && window.electronAPI?.openExternalLink) {
              window.electronAPI.openExternalLink("https://github.com/JianWang97/kadalingo");
            } else {
              window.open("https://github.com/JianWang97/kadalingo", "_blank");
            }
          }}
          rel="noopener noreferrer"
          className="ml-2 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors text-xs text-gray-500 border border-gray-200"
          title="GitHub 仓库"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.687-.103-.254-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.396.1 2.65.64.7 1.028 1.594 1.028 2.687 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"
            />
          </svg>
          {title}
          <span className="ml-1 text-yellow-500 font-semibold">
            ★ {starCount !== null ? starCount : "-"}
          </span>
        </a>
      </div>
      {/* 中间：状态信息（可选） */}
      <div className="flex items-center gap-4 no-drag relative z-10">
        {currentTime && (
          <div className="time-display flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-container/20 to-secondary-container/10 backdrop-blur-sm border border-surface-variant/20">
            <svg
              width="14"
              height="14"
              viewBox="0 0 12 12"
              fill="none"
              className="text-primary"
            >
              <circle
                cx="6"
                cy="6"
                r="5"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                d="M6 3v3l2 2"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {currentTime}
            </span>
          </div>
        )}
      </div>{" "}
      {/* 右侧：窗口控制按钮 - 只在 Electron 环境中显示 */}
      {inElectron && (
        <div className="flex items-center gap-2 no-drag relative z-10">
          <button
            onClick={handleMinimize}
            className="window-control-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-surface-variant/20"
            title="最小化"
            aria-label="最小化窗口"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              className="text-on-surface-variant transition-colors duration-200 relative z-10"
            >
              <path
                d="M4 8h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="window-control-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-surface-variant/20"
            title="最大化/还原"
            aria-label="最大化或还原窗口"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              className="text-on-surface-variant transition-colors duration-200 relative z-10"
            >
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                rx="1.5"
              />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="window-control-btn close-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ml-1 hover:bg-red-500/10 hover:text-red-500"
            title="关闭"
            aria-label="关闭窗口"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-colors duration-200 relative z-10"
            >
              <path
                d="M5 5l6 6M5 11l6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
