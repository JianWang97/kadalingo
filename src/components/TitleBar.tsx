import React, { useState, useEffect } from 'react';
import { useFloatingMode } from '../hooks/useFloatingMode';
import { isElectron } from '../utils/environment';

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title = "咔哒英语" }) => {
  const isFloating = useFloatingMode();
  const inElectron = isElectron();
  const [currentTime, setCurrentTime] = useState<string>('');

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // 小窗模式下隐藏标题栏
  if (isFloating) return null;
  // 只保留主标题栏和窗口控制按钮
  const handleMinimize = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };
  
  const handleMaximize = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.maximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };
  
  const handleClose = async () => {
    if (!inElectron) return;
    try {
      await window.electronAPI?.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };  return (
    <div className="titlebar-surface flex items-center justify-between h-12 px-6 select-none relative transition-all duration-300 border-surface-variant/10">
      {/* 拖拽区域 - 只在 Electron 中启用 */}
      {inElectron && (
        <div className="absolute inset-0 drag-region" style={{ zIndex: 0 }} />
      )}
      
      {/* 左侧：应用图标和标题 */}
      <div className="flex items-center gap-4 no-drag relative z-10">
        <div className="titlebar-icon w-9 h-9 rounded-2xl flex items-center justify-center">
          <img src="/assets/titlebar.ico" alt="App Icon" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="titlebar-title text-base font-semibold text-on-surface leading-tight tracking-wide">{title}</span>
          <span className="titlebar-subtitle text-xs text-on-surface-variant leading-none font-medium">语言学习助手</span>
        </div>
      </div>      {/* 中间：状态信息（可选） */}
      <div className="flex items-center gap-4 no-drag relative z-10">
        {currentTime && (
          <div className="time-display flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-container/20 to-secondary-container/10 backdrop-blur-sm border border-surface-variant/20">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-primary">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
              <path d="M6 3v3l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {currentTime}
            </span>
          </div>
        )}
      </div>      {/* 右侧：窗口控制按钮 - 只在 Electron 环境中显示 */}
      {inElectron && (
        <div className="flex items-center gap-2 no-drag relative z-10">
          <button
            onClick={handleMinimize}
            className="window-control-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-surface-variant/20"
            title="最小化"
            aria-label="最小化窗口"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-on-surface-variant transition-colors duration-200 relative z-10">
              <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="window-control-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-surface-variant/20"
            title="最大化/还原"
            aria-label="最大化或还原窗口"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-on-surface-variant transition-colors duration-200 relative z-10">
              <rect x="4" y="4" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1.5" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="window-control-btn close-btn w-11 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ml-1 hover:bg-red-500/10 hover:text-red-500"
            title="关闭"
            aria-label="关闭窗口"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="transition-colors duration-200 relative z-10">
              <path d="M5 5l6 6M5 11l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default TitleBar;
