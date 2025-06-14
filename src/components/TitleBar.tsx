import React from 'react';

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title = "Electron App" }) => {
  const handleMinimize = () => {
    // 通过 IPC 与主进程通信来最小化窗口
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    // 通过 IPC 与主进程通信来最大化/还原窗口
    window.electronAPI?.maximize();
  };

  const handleClose = () => {
    // 通过 IPC 与主进程通信来关闭窗口
    window.electronAPI?.close();
  };  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 h-10 px-4 drag-region shadow-sm">
      {/* 左侧：应用图标和标题 */}
      <div className="flex items-center space-x-3 no-drag">
        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">W</span>
        </div>
        <span className="text-sm font-medium text-gray-800 select-none">{title}</span>
      </div>

      {/* 中间：可拖拽区域 - 使用 Tailwind 的 flex-1 和自定义 drag-region */}
      <div className="flex-1 h-full drag-region cursor-move"></div>

      {/* 右侧：窗口控制按钮 */}
      <div className="flex items-center space-x-1 no-drag">
        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 rounded-md transition-all duration-150 group"
          title="最小化"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:scale-110 transition-transform">
            <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* 最大化/还原按钮 */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 rounded-md transition-all duration-150 group"
          title="最大化/还原"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:scale-110 transition-transform">
            <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none" rx="1"/>
          </svg>
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white active:bg-red-600 rounded-md transition-all duration-150 group"
          title="关闭"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:scale-110 transition-transform">
            <path d="M4 4l6 6M4 10l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
