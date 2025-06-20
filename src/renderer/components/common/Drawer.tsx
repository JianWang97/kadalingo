import React, { useEffect, useRef } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'md'
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // 获取抽屉宽度的 Tailwind 类
  const getWidthClass = () => {
    switch (width) {
      case 'sm':
        return 'w-80';
      case 'md':
        return 'w-96';
      case 'lg':
        return 'w-[32rem]';
      case 'xl':
        return 'w-[40rem]';
      default:
        return 'w-96';
    }
  };

  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 点击外部区域关闭
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-in-out"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* 抽屉内容 */}
      <div className="ml-auto relative">
        <div
          ref={drawerRef}
          className={`
            ${getWidthClass()}
            h-full
            bg-white
            shadow-2xl
            transform
            transition-all
            duration-300
            ease-in-out
            flex
            flex-col
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            border-l border-gray-200
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'drawer-title' : undefined}
        >
          {/* 抽屉头部 */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 
                id="drawer-title"
                className="text-lg font-semibold text-gray-800"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                className="
                  w-8 h-8
                  rounded-full
                  flex items-center justify-center
                  text-gray-500
                  hover:bg-gray-100
                  hover:text-gray-700
                  focus:bg-gray-100
                  focus:outline-none
                  transition-all
                  duration-200
                "
                aria-label="关闭抽屉"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}          {/* 抽屉内容区域 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 drawer-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
