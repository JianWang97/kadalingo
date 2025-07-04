import React, { useState } from "react";
import { Modal, Toast, Drawer } from "../components/common";
import StreamingCoursePreview from "../components/StreamingCoursePreview";
import { useLLM } from "../contexts/LLMContext";

const AddContent: React.FC = () => {
  const { isConnected } = useLLM();

  // 生成配置
  const [generateConfig, setGenerateConfig] = useState({
    topic: "",
    description: "", // 课程详情描述
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    lessonCount: 5, // 课程课时数
    sentencesPerLesson: 10, // 每课时句子数量
  }); // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  // 抽屉状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 模态框状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCourseInfo, setSavedCourseInfo] = useState<{
    title: string;
    id: number;
    lessonCount: number;
    totalSentences: number;
  } | null>(null);

  // Toast 状态
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });
  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  }; // 生成内容
  const handleGenerate = async () => {
    if (!isConnected) {
      setError("请先在设置中配置并连接 LLM 服务");
      return;
    }

    if (!generateConfig.topic) {
      setError("请输入主题");
      return;
    }

    setIsGenerating(true);
    setError("");
    setIsDrawerOpen(true); // 立即打开抽屉显示生成过程
  }; // 流式生成完成回调
  const handleStreamingComplete = () => {
    setIsGenerating(false);
  };

  // 流式生成错误回调
  const handleStreamingError = (error: string) => {
    setError("生成失败：" + error);
    setIsGenerating(false);
    setIsDrawerOpen(false);
  };
  return (
    <div className="min-h-[calc(100vh-3rem)] w-full bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="h-full overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto">
          {/* 错误信息 */}
          {error && (
            <div className="mb-4 backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-1 bg-red-100 rounded-full">
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
          {/* 连接状态提示 */}
          {!isConnected && (
            <div className="mb-4 backdrop-blur-sm bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-1 bg-amber-100 rounded-full">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-amber-800">
                      需要配置 AI 模型
                    </p>
                    <p className="text-xs text-amber-700">
                      请先在设置中配置 AI 服务并测试连接
                    </p>
                  </div>
                </div>
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}{" "}
          {/* 生成配置表单 */}
          <div className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/40 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>{" "}
                  <h2 className="text-lg font-bold text-white">
                    AI智能课程生成
                  </h2>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium backdrop-blur-sm">
                  🤖 AI驱动
                </div>
              </div>
            </div>{" "}
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧 - 课程主题和描述 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      课程主题 *
                    </label>
                    <div className="relative">
                      {" "}
                      <input
                        type="text"
                        value={generateConfig.topic}
                        onChange={(e) =>
                          setGenerateConfig({
                            ...generateConfig,
                            topic: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 pl-9 border-0 bg-gray-50 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm text-gray-900 dark:text-gray-100"
                        placeholder="例如：日常对话、商务英语、旅游英语等"
                      />
                      <svg
                        className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      课程描述（可选）
                    </label>
                    <div className="relative">
                      {" "}
                      <textarea
                        value={generateConfig.description}
                        onChange={(e) =>
                          setGenerateConfig({
                            ...generateConfig,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-3 py-2.5 border-0 bg-gray-50 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none text-gray-900 dark:text-gray-100"
                        placeholder="详细描述课程内容和学习目标..."
                      />
                    </div>
                  </div>
                </div>

                {/* 右侧 - 课程设置 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      课程等级
                    </label>
                    <div className="relative">
                      {" "}
                      <select
                        value={generateConfig.level}
                        onChange={(e) =>
                          setGenerateConfig({
                            ...generateConfig,
                            level: e.target.value as
                              | "beginner"
                              | "intermediate"
                              | "advanced",
                          })
                        }
                        className="w-full px-3 py-2.5 pr-8 border-0 bg-gray-50 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all duration-200 appearance-none text-sm text-gray-900 dark:text-gray-100"
                      >
                        <option value="beginner">🌱 初级</option>
                        <option value="intermediate">🌿 中级</option>
                        <option value="advanced">🌳 高级</option>
                      </select>
                      <svg
                        className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      课时数量
                    </label>
                    <div className="relative">
                      {" "}
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={generateConfig.lessonCount}
                        onChange={(e) =>
                          setGenerateConfig({
                            ...generateConfig,
                            lessonCount: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-full px-3 py-2.5 pl-9 border-0 bg-gray-50 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all duration-200 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <svg
                        className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      每课时句子数
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={generateConfig.sentencesPerLesson}
                        onChange={(e) =>
                          setGenerateConfig({
                            ...generateConfig,
                            sentencesPerLesson: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-full px-3 py-2.5 pl-9 border-0 bg-gray-50 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all duration-200 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <svg
                        className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>{" "}
                    </div>
                  </div>

                  {/* 统计信息卡片 */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900/40">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      生成预览
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                          {generateConfig.lessonCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">课时</div>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
                          {generateConfig.sentencesPerLesson}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">句子/课时</div>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
                          {generateConfig.lessonCount *
                            generateConfig.sentencesPerLesson}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">总句子</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 生成按钮 */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating || !isConnected || !generateConfig.topic.trim()
                  }
                  className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center space-x-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>AI 生成中...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-1 bg-white/20 rounded-lg">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <span>AI生成课程</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>{" "}
          {/* 生成内容抽屉 */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="AI实时生成课程"
            width="xl"
          >
            <StreamingCoursePreview
              generateConfig={generateConfig}
              isGenerating={isGenerating}
              onSaveSuccess={(savedCourseInfo) => {
                setSavedCourseInfo(savedCourseInfo);
                setShowSuccessModal(true);
                setIsDrawerOpen(false);
              }}
              onSaveError={(error) => {
                setError(error);
              }}
              onGenerationComplete={handleStreamingComplete}
              onGenerationError={handleStreamingError}
              isInDrawer={true}
            />
          </Drawer>
          {/* Toast 组件 */}
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.show}
            onClose={hideToast}
            duration={3000}
          />{" "}
          {/* 保存成功模态框 */}
          {showSuccessModal && savedCourseInfo && (
            <Modal
              isOpen={showSuccessModal}
              onClose={() => setShowSuccessModal(false)}
              title="课程保存成功"
              maxWidth="max-w-md"
            >
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 mb-6">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  课程创建成功！
                </h3>
                <p className="text-lg font-semibold text-gray-800 mb-6">
                  "{savedCourseInfo.title}"
                </p>

                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                        #{savedCourseInfo.id}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">课程ID</div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                        {savedCourseInfo.lessonCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">课时数</div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-300">
                        {savedCourseInfo.totalSentences}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">句子数</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  开始学习
                </button>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddContent;
