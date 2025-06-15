import React from 'react';
import { useFloatingMode } from '../hooks/useFloatingMode';

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title = "咔哒英语" }) => {
  const isFloating = useFloatingMode();

  // 小窗模式下隐藏标题栏
  if (isFloating) return null;

  // 只保留主标题栏和窗口控制按钮
  const handleMinimize = async () => {
    try {
      await window.electronAPI?.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };
  const handleMaximize = async () => {
    try {
      await window.electronAPI?.maximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };
  const handleClose = async () => {
    try {
      await window.electronAPI?.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 shadow-sm h-10 bg-gradient-to-r from-white to-gray-50 select-none relative">
      {/* 拖拽区域 */}
      <div className="absolute inset-0 drag-region" style={{ zIndex: 0 }} />
      {/* 左侧：应用图标和标题 */}
      <div className="flex items-center space-x-3 no-drag relative z-10">
        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">📚</span>
        </div>
        <span className="text-sm font-medium text-gray-800">{title}</span>
      </div>
      {/* 右侧：窗口控制按钮 */}
      <div className="flex items-center space-x-1 no-drag relative z-10">
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
          title="最小化"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 active:bg-gray-200"
          title="最大化/还原"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-500 hover:text-white active:bg-red-600"
          title="关闭"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4l6 6M4 10l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
