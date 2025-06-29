import React, { useState, useEffect } from "react";
import { MdSchool, MdEdit, MdSmartToy, MdSettings } from "react-icons/md";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: "courses" | "practice" | "add") => void;
  onOpenSettings?: () => void;
}

interface MenuItem {
  id: "courses" | "practice" | "add";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: "courses",
    label: "课程中心",
    icon: MdSchool,
    description: "选择学习课程",
  },
  {
    id: "practice",
    label: "句子练习",
    icon: MdEdit,
    description: "中英文翻译练习",
  },
  {
    id: "add",
    label: "AI 智能创作",
    icon: MdSmartToy,
    description: "AI 生成课程内容",
  },
];

// 检测是否为移动设备
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  onOpenSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  };

  // 移动端底部导航栏
  if (isMobile) {
    return (
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-900
          border-t border-gray-200 dark:border-gray-700
          shadow-lg backdrop-blur-sm
          px-2 py-2
        "
        role="navigation"
        aria-label="底部导航"
      >
        <div className="flex items-center justify-around space-x-1">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            const isAI = item.id === "add";
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  flex flex-col items-center justify-center
                  flex-1 py-2 px-1 rounded-lg
                  transition-all duration-200 ease-out
                  touch-manipulation
                  ${isAI 
                    ? isActive 
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    : isActive 
                      ? "bg-purple-100 dark:bg-purple-900/30" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }
                `}
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  <item.icon
                    className={`
                      w-6 h-6 transition-colors duration-200
                      ${isAI 
                        ? "text-purple-500 drop-shadow-sm" 
                        : isActive 
                          ? "text-purple-600 dark:text-purple-400" 
                          : "text-gray-600 dark:text-gray-400"
                      }
                    `}
                  />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </div>
                <span
                  className={`
                    text-xs mt-1 font-medium
                    ${isAI 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600" 
                      : isActive 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-gray-600 dark:text-gray-400"
                    }
                  `}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* 设置按钮 */}
          <button
            onClick={onOpenSettings}
            className="
              flex flex-col items-center justify-center
              flex-1 py-2 px-1 rounded-lg
              transition-all duration-200 ease-out
              touch-manipulation
              hover:bg-gray-50 dark:hover:bg-gray-800
            "
            role="menuitem"
          >
            <MdSettings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="text-xs mt-1 font-medium text-gray-600 dark:text-gray-400">
              设置
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // 桌面端侧边栏
  return (
    <aside
      className={`
        sidebar-surface dark:sidebar-surface
        shadow-lg
        transition-all duration-300 ease-out
        ${isExpanded ? "w-56" : "w-12"}
        flex flex-col h-full relative
        backdrop-blur-sm
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="主导航"
    >
      {/* Navigation Menu */}
      <nav className={`flex-1 p-3 space-y-2`} role="menu">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          const isAI = item.id === "add";
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center rounded-xl
                transition-all duration-300 ease-out
                ${isExpanded ? "p-3" : "p-0"}
                ${
                  isAI
                    ? isActive && isExpanded
                      ? "sidebar-item-active-ai"
                      : "sidebar-item-ai"
                    : isActive && isExpanded
                    ? "sidebar-item-active"
                    : "sidebar-item"
                }
              `}
              title={!isExpanded ? item.label : undefined}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon */}
              <div
                className={`
                  flex-shrink-0 flex items-center justify-center
                  transition-all duration-300
                  ${isExpanded ? "w-8 h-8" : "w-6 h-6"}
                  ${isAI ? "filter drop-shadow-lg" : ""}
                `}
              >
                <item.icon
                  className={`
                    transition-colors duration-300
                    ${isExpanded ? "w-8 h-8" : "w-6 h-6"}
                    ${
                      isAI
                        ? "text-purple-500 drop-shadow-sm"
                        : isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  `}
                />
              </div>
              {/* Label & Description */}
              <div
                className={`
                  ml-4 text-left transition-all duration-300
                  ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}
                `}
              >
                <div
                  className={`
                  text-sm font-medium whitespace-nowrap leading-tight
                  ${
                    isAI
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600"
                      : ""
                  }
                `}
                >
                  {item.label}
                </div>
                {item.description && (
                  <div
                    className={`
                    text-xs whitespace-nowrap mt-0.5
                    ${
                      isAI
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400"
                        : "text-on-surface-variant dark:text-on-surface-variant-dark"
                    }
                  `}
                  >
                    {item.description}
                  </div>
                )}
              </div>
              {/* Active Indicator */}
              {isActive && (
                <div
                  className={`
                    absolute right-0 w-1 h-8 rounded-l-full
                    transition-all duration-200
                    ${isExpanded ? "opacity-0" : "opacity-100"}
                    bg-primary
                  `}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Settings Button */}
      <footer className={`${isExpanded ? "p-3" : "p-3"}`}>
        <button
          onClick={onOpenSettings}
          className={`
            w-full flex items-center rounded-xl
            transition-all duration-300 ease-out
            ${isExpanded ? "p-3" : "p-1"}
            sidebar-item
          `}
          title={!isExpanded ? "设置" : undefined}
          role="menuitem"
        >
          {/* Icon */}
          <div
            className={`
            flex-shrink-0 flex items-center justify-center
            transition-all duration-300
            ${isExpanded ? "w-6 h-6" : "w-4 h-4"}
          `}
          >
            <MdSettings className={`
              transition-colors duration-300
              ${isExpanded ? "w-6 h-6" : "w-4 h-4"}
              text-gray-600 dark:text-gray-400
            `} />
          </div>
          {/* Label & Description */}
          <div
            className={`
              ml-4 text-left transition-all duration-300
              ${isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"}
            `}
          >
            <div className="text-sm font-medium whitespace-nowrap leading-tight">
              设置
            </div>
            <div className="text-xs text-on-surface-variant dark:text-on-surface-variant-dark whitespace-nowrap mt-0.5">
              应用设置
            </div>
          </div>
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
