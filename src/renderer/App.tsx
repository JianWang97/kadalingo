import { useState } from "react";
import TitleBar from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import SentencePractice from "./page/SentencePractice";
import Courses from "./page/Courses";
import AddContent from "./page/AddContent";
import { Settings } from "./components/Settings";
import { Modal } from "./components/common";
import { SpeechProvider } from "./contexts/SpeechContext";
import { FloatingModeProvider } from "./contexts/FloatingModeContext";
import { KeyboardSoundProvider } from "./contexts/KeyboardSoundContext";
import { LLMProvider } from "./contexts/LLMContext";
import { useEffect, useState as useReactState } from "react";

// 移植 Sidebar 的 useIsMobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useReactState(false);
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);
  return isMobile;
}
import { useFloatingMode } from "./hooks/useFloatingMode";
import { Course } from "../data/types";
import { VocabularyBooks } from "./page/VocabularyBooks";

function App() {
  const [currentPage, setCurrentPage] = useState<
    "courses" | "practice" | "add" | "vocabulary"
  >("courses"); // 默认到课程页面
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const isFloating = useFloatingMode();
  const isMobile = useIsMobile();
  const handleStartCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentPage("practice");
  };

  const handleSidebarExpand = () => setIsSidebarExpanded(true);
  const handleSidebarCollapse = () => setIsSidebarExpanded(false);

  const renderPage = () => {
    switch (currentPage) {
      case "practice":
        return <SentencePractice selectedCourse={selectedCourse} />;
      case "add":
        return <AddContent />;
      case "vocabulary":
        return <VocabularyBooks />;
      case "courses":
      default:
        return <Courses onStartCourse={handleStartCourse} />;
    }
  };
  return (
    <FloatingModeProvider>
      <SpeechProvider>
        <KeyboardSoundProvider>
          <LLMProvider>
            <div
              className={`h-screen flex flex-col overflow-hidden ${
                isFloating
                  ? "floating-mode-background"
                  : "bg-gradient-to-br from-blue-50 to-indigo-100"
              }`}
            >              {/* 自定义顶部工具栏 - 固定在顶部 */}
              <div
                className={
                  isFloating || isMobile
                    ? ""
                    : isSidebarExpanded
                      ? "ml-56 transition-all duration-300"
                      : "ml-[48px] transition-all duration-300"
                }
              >
                <TitleBar />
              </div>
              
              {/* 主体内容区域 */}
              <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏 - 在小飘窗模式下隐藏 */}
                {!isFloating && (
                  <Sidebar
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isExpanded={isSidebarExpanded}
                    onExpand={handleSidebarExpand}
                    onCollapse={handleSidebarCollapse}
                  />
                )}

                {/* 主要内容区域 - 可滚动区域 */}
                <div
                  className={`flex-1 overflow-y-auto ${
                    isFloating
                      ? "floating-mode-content m-2"
                      : isMobile
                        ? ""
                        : isSidebarExpanded
                          ? "ml-56 transition-all duration-300"
                          : "ml-[48px] transition-all duration-300"
                  }`}
                >
                    {renderPage()}
                </div>
              </div>
            </div>

            {/* 设置模态框 */}
            {isSettingsOpen && (
              <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="设置"
                maxWidth="max-w-2xl"
              >
                <Settings />
              </Modal>
            )}
          </LLMProvider>
        </KeyboardSoundProvider>
      </SpeechProvider>
    </FloatingModeProvider>
  );
}

export default App;
