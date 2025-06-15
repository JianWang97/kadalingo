import React, { useState } from "react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: "courses" | "practice" | "add") => void;
}

interface MenuItem {
  id: "courses" | "practice" | "add";
  label: string;
  icon: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: "courses",
    label: "课程中心",
    icon: "📚",
    description: "选择学习课程",
  },
  {
    id: "practice",
    label: "句子练习",
    icon: "📝",
    description: "中英文翻译练习",
  },
  {
    id: "add",
    label: "添加内容",
    icon: "➕",
    description: "添加课程和句子",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div
      className={`bg-white shadow-md border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-44" : "w-12"
      } flex flex-col h-full relative`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {" "}
      {/* 侧边栏头部 */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <div className="text-lg">💫</div>
          {isExpanded && (
            <div className="ml-2 overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                开始咔哒吧~
              </h2>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                Language Learning
              </p>
            </div>
          )}
        </div>
      </div>{" "}
      {/* 菜单项 */}
      <nav className="flex-1 p-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center p-2 rounded-md transition-all duration-200 group ${
              currentPage === item.id
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
            title={!isExpanded ? item.label : ""}
          >
            <div className="text-base flex-shrink-0 flex items-center justify-center w-5">
              {item.icon}
            </div>
            {isExpanded && (
              <div className="ml-2 text-left overflow-hidden">
                <div className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {item.description}
                  </div>
                )}
              </div>
            )}

            {/* 活动指示器 */}
            {currentPage === item.id && !isExpanded && (
              <div className="absolute right-0 w-0.5 h-4 bg-blue-500 rounded-l-full"></div>
            )}
          </button>
        ))}
      </nav>{" "}
      {/* 侧边栏底部 */}
      <div className="p-2 border-t border-gray-200">
        <div className="flex items-center justify-center text-gray-400">
          <div className="text-base">⚙️</div>
          {isExpanded && (
            <div className="ml-2 text-sm">
              <div className="text-gray-600">设置</div>
            </div>
          )}
        </div>
      </div>{" "}
    </div>
  );
};

export default Sidebar;
