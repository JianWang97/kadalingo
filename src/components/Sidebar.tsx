import React, { useState } from "react";
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  onOpenSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => setIsExpanded(true);
  const handleMouseLeave = () => setIsExpanded(false);

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
      {" "}
      {/* Navigation Menu */}{" "}
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
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                dark:focus:ring-offset-surface-dark
              `}
              title={!isExpanded ? item.label : undefined}
              role="menuitem"
              aria-current={isActive ? "page" : undefined}
            >
              {" "}
              {/* Icon */}{" "}              <div
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
      </nav>{" "}
      {/* Settings Button */}{" "}
      <footer className={`${isExpanded ? "p-3" : "p-3"}`}>
        <button
          onClick={onOpenSettings}
          className={`
            w-full flex items-center rounded-xl
            transition-all duration-300 ease-out
            ${isExpanded ? "p-3" : "p-1"}
            sidebar-item
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            dark:focus:ring-offset-surface-dark
          `}
          title={!isExpanded ? "设置" : undefined}
          role="menuitem"
        >
          {" "}
          {/* Icon */}{" "}          <div
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
