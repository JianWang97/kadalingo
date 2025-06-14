import React, { useState } from "react";
import { Header, Card, TitleBar, Sidebar } from "./components";
import SentencePractice from "./page/SentencePractice";
import { SpeechProvider } from "./contexts/SpeechContext";

// 在开发环境中导入测试工具
if (process.env.NODE_ENV === "development") {
  import("./utils/speechServiceTester");
}

function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "practice">("home");

  const renderPage = () => {
    switch (currentPage) {
      case "practice":
        return <SentencePractice />;
      case "home":
      default:
        return (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 页面标题 */}
            <Header title="哑巴英语" subtitle="悄悄努力然后惊艳所有人！" />

            {/* 功能卡片 */}
            <div className="grid md:grid-cols-1 gap-6">
              <Card
                title="英语句子练习"
                className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                onClick={() => setCurrentPage("practice")}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    中英文翻译练习
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    根据中文短语拼写英文句子，提升英语水平
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    开始练习 →
                  </div>
                </div>
              </Card>
            </div>

            {/* 版权信息 */}
            <div className="text-center text-sm text-gray-500 pt-4">
              <p>Built with ❤️ using Electron Forge + React + Tailwind CSS</p>{" "}
              <p className="mt-1">
                MIT License - Feel free to use this template for your projects!
              </p>{" "}
            </div>
          </div>
        );
    }
  };
  return (
    <SpeechProvider>
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
        {/* 自定义顶部工具栏 - 固定在顶部 */}
        <TitleBar title="Whisper Language" />

        {/* 主体内容区域 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 侧边栏 */}
          <Sidebar
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />{" "}          {/* 主要内容区域 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto">
            <div className={currentPage === "practice" ? "h-full" : "p-6"}>
              {renderPage()}
            </div>
          </div>
        </div>
      </div>
    </SpeechProvider>
  );
}

export default App;
