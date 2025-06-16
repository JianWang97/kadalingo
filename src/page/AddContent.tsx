import React, { useState, useEffect } from "react";
import { Modal, Toast } from "../components/common";
import {
  createLLMService,
  getLLMService,
  type GeneratedSentence,
  type GeneratedCourse,
} from "../services/llmService";
import {
  RepositoryFactory,
  StorageType,
} from "../data/repositories/RepositoryFactory";
import type { Course, Lesson, SentencePair } from "../data/types";

interface LLMSettings {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  createdAt: string;
  isConnected?: boolean; // 添加连接状态
  lastTestedAt?: string; // 最后测试时间
}

const STORAGE_KEY = "llm_settings_list";

// localStorage 管理函数
const saveLLMSettingsToStorage = (settings: LLMSettings[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const loadLLMSettingsFromStorage = (): LLMSettings[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("加载 LLM 配置失败:", error);
    return [];
  }
};

const AddContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"settings" | "generate">(
    "settings"
  );
  const [savedSettings, setSavedSettings] = useState<LLMSettings[]>([]);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>("");
  const [llmSettings, setLLMSettings] = useState<LLMSettings>({
    id: "",
    name: "",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: "",
    model: "doubao-seed-1-6-250615",
    createdAt: "",
    isConnected: false,
  });
  // 加载保存的设置
  useEffect(() => {
    const settings = loadLLMSettingsFromStorage();
    setSavedSettings(settings);

    // 如果有保存的设置，选择第一个
    if (settings.length > 0) {
      const firstSetting = settings[0];
      setLLMSettings(firstSetting);
      setSelectedSettingsId(firstSetting.id);

      // 如果配置标记为已连接，直接恢复连接状态和初始化服务
      if (firstSetting.isConnected) {
        setIsConnected(true);
        createLLMService({
          baseUrl: firstSetting.baseUrl,
          apiKey: firstSetting.apiKey,
          model: firstSetting.model,
        });
      }
    }
  }, []);  // 生成配置
  const [generateConfig, setGenerateConfig] = useState({
    topic: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    lessonCount: 5, // 课程课时数
    sentencesPerLesson: 10, // 每课时句子数量
  });

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedCourse | null>(null);
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 模态框状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCourseInfo, setSavedCourseInfo] = useState<{
    title: string;
    id: number;
    lessonCount: number;
    totalSentences: number;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSettingsId, setDeleteSettingsId] = useState<string>("");

  // 配置表单 Modal 状态
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  // Toast 状态
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // 显示 Toast 的工具函数
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };  // 测试连接
  const handleTestConnection = async () => {
    if (!llmSettings.baseUrl || !llmSettings.apiKey) {
      setError("请填写Base URL和API Key");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const llmService = createLLMService({
        baseUrl: llmSettings.baseUrl,
        apiKey: llmSettings.apiKey,
        model: llmSettings.model,
      });

      const connected = await llmService.testConnection();
      setIsConnected(connected);

      if (connected) {
        // 连接成功，直接保存带有连接状态的设置
        await handleSaveSettingsWithStatus(true);
        showToast("连接成功！配置已保存", "success");
        setTimeout(() => {
          setShowConfigModal(false);
        }, 1500); // 1.5秒后关闭Modal，让用户看到成功提示
      } else {
        setError("连接失败，请检查配置");
      }
    } catch (err) {
      setError("连接失败：" + (err as Error).message);
      setIsConnected(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存设置（带连接状态参数）
  const handleSaveSettingsWithStatus = async (connectionStatus?: boolean) => {
    if (!llmSettings.name || !llmSettings.baseUrl || !llmSettings.apiKey) {
      setError("请填写配置名称、Base URL和API Key");
      return;
    }

    const currentConnectionStatus =
      connectionStatus !== undefined ? connectionStatus : isConnected;

    const newSettings: LLMSettings = {
      ...llmSettings,
      id: llmSettings.id || Date.now().toString(),
      createdAt: llmSettings.createdAt || new Date().toISOString(),
      isConnected: currentConnectionStatus,
      lastTestedAt: currentConnectionStatus
        ? new Date().toISOString()
        : llmSettings.lastTestedAt,
    };

    const existingSettings = [...savedSettings];
    const existingIndex = existingSettings.findIndex(
      (s) => s.id === newSettings.id
    );

    if (existingIndex >= 0) {
      // 更新现有设置
      existingSettings[existingIndex] = newSettings;
    } else {
      // 添加新设置
      existingSettings.push(newSettings);
    }

    setSavedSettings(existingSettings);
    saveLLMSettingsToStorage(existingSettings);
    setLLMSettings(newSettings);
    setSelectedSettingsId(newSettings.id);
  };  // 保存设置（原版本，为了兼容性）
  const handleSaveSettings = async () => {
    await handleSaveSettingsWithStatus();
    if (!error) {
      showToast("配置保存成功", "success");
      setShowConfigModal(false);
    }
  };// 选择已保存的设置
  const handleSelectSettings = (settingsId: string) => {
    const selected = savedSettings.find((s) => s.id === settingsId);
    if (selected) {
      console.log(
        "选择配置:",
        selected.name,
        "之前的连接状态:",
        selected.isConnected
      );

      setLLMSettings(selected);
      setSelectedSettingsId(settingsId);

      // 如果之前测试过连接且成功，直接恢复连接状态
      if (selected.isConnected) {
        console.log("恢复连接状态为已连接");
        setIsConnected(true);
        createLLMService({
          baseUrl: selected.baseUrl,
          apiKey: selected.apiKey,
          model: selected.model,
        });
      } else {
        // 只有在选择的配置未连接时才清除连接状态
        console.log("设置连接状态为未连接");
        setIsConnected(false);
      }
    }
  };
  // 删除设置
  const handleDeleteSettings = (settingsId: string) => {
    setDeleteSettingsId(settingsId);
    setShowDeleteModal(true);
  };

  // 确认删除设置
  const confirmDeleteSettings = () => {
    const filteredSettings = savedSettings.filter(
      (s) => s.id !== deleteSettingsId
    );
    setSavedSettings(filteredSettings);
    saveLLMSettingsToStorage(filteredSettings);

    // 如果删除的是当前选中的设置，重置为默认
    if (deleteSettingsId === selectedSettingsId) {
      const defaultSettings: LLMSettings = {
        id: "",
        name: "",
        baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
        apiKey: "",
        model: "doubao-seed-1-6-250615",
        createdAt: "",
        isConnected: false,
      };
      setLLMSettings(defaultSettings);
      setSelectedSettingsId("");
      setIsConnected(false);
    }

    setShowDeleteModal(false);
    setDeleteSettingsId("");
  };  // 新建设置
  const handleNewSettings = () => {
    const defaultSettings: LLMSettings = {
      id: "",
      name: "",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-3.5-turbo",
      createdAt: "",
      isConnected: false,
    };
    setLLMSettings(defaultSettings);
    setSelectedSettingsId("");
    setIsConnected(false);
    setIsEditingConfig(false);
    setShowConfigModal(true);
  };

  // 编辑设置
  const handleEditSettings = (settingsId: string) => {
    const selected = savedSettings.find((s) => s.id === settingsId);
    if (selected) {
      setLLMSettings(selected);
      setSelectedSettingsId(settingsId);
      setIsEditingConfig(true);
      setShowConfigModal(true);
      
      // 如果之前测试过连接且成功，直接恢复连接状态
      if (selected.isConnected) {
        setIsConnected(true);
        createLLMService({
          baseUrl: selected.baseUrl,
          apiKey: selected.apiKey,
          model: selected.model,
        });
      } else {
        setIsConnected(false);
      }
    }
  };

  // 关闭配置 Modal
  const handleCloseConfigModal = () => {
    setShowConfigModal(false);
    setError("");
  };
  // 生成内容
  const handleGenerate = async () => {
    if (!isConnected) {
      setError("请先测试连接");
      return;
    }

    if (!generateConfig.topic) {
      setError("请输入主题");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedContent(null);

    try {
      const llmService = getLLMService();
      if (!llmService) {
        throw new Error("LLM服务未初始化");
      }

      // 计算总句子数量
      const totalSentences =
        generateConfig.lessonCount * generateConfig.sentencesPerLesson;

      const course = await llmService.generateCourse(
        generateConfig.topic,
        generateConfig.level,
        totalSentences
      );
      setGeneratedContent(course);
    } catch (err) {
      setError("生成失败：" + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }; // 保存生成的内容
  const handleSaveContent = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    setError("");

    try {
      // 获取数据存储库
      const factory = RepositoryFactory.getInstance();
      const repository = await factory.createRepository({
        type: StorageType.INDEXEDDB,
      });

      // 将生成的课程转换为数据库格式
      const course: Course = await convertGeneratedCourseToDbFormat(
        generatedContent
      );

      // 保存到数据库
      const savedCourse = await repository.createCourse(course);
      console.log("课程保存成功:", savedCourse);

      // 设置保存成功的课程信息
      setSavedCourseInfo({
        title: generatedContent.title,
        id: savedCourse.id,
        lessonCount: generateConfig.lessonCount,
        totalSentences:
          generateConfig.lessonCount * generateConfig.sentencesPerLesson,
      });

      // 显示成功模态框
      setShowSuccessModal(true);
    } catch (error) {
      console.error("保存课程失败:", error);
      setError("保存课程失败：" + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 将生成的课程转换为数据库格式
  const convertGeneratedCourseToDbFormat = async (
    generatedCourse: GeneratedCourse
  ): Promise<Course> => {
    // 按课时分组句子
    const lessons: Lesson[] = [];

    for (
      let lessonIndex = 0;
      lessonIndex < generateConfig.lessonCount;
      lessonIndex++
    ) {
      const startIndex = lessonIndex * generateConfig.sentencesPerLesson;
      const endIndex = startIndex + generateConfig.sentencesPerLesson;
      const lessonSentences = generatedCourse.sentences.slice(
        startIndex,
        endIndex
      );

      // 转换句子格式
      const sentences: SentencePair[] = lessonSentences.map(
        (sentence, index) => ({
          id: startIndex + index + 1,
          chinese: sentence.chinese,
          english: sentence.english,
          difficulty: sentence.difficulty,
        })
      );

      lessons.push({
        id: lessonIndex + 1,
        title: `第${lessonIndex + 1}课时`,
        description: `${generatedCourse.title} - 第${lessonIndex + 1}课时`,
        sentences,
        estimatedTime: Math.ceil(sentences.length * 2), // 每个句子预计2分钟
      });
    }

    // 构建课程对象
    const course: Course = {
      id: 0, // 数据库会自动分配ID
      name: generatedCourse.title,
      description: generatedCourse.description,
      difficulty: generatedCourse.level,
      category: generateConfig.topic,
      lessons,
      totalLessons: lessons.length,
      estimatedHours: Math.ceil(
        lessons.reduce(
          (total, lesson) => total + (lesson.estimatedTime || 0),
          0
        ) / 60
      ),
      tags: [generateConfig.topic, generatedCourse.level],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return course;
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI 内容生成</h1>
              <p className="text-sm text-gray-600 mt-1">智能生成英语学习课程内容</p>
            </div>
            {/* 状态指示器 */}
            {isConnected && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">已连接</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* 标签页切换 */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "settings"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>模型配置</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "generate"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>生成内容</span>
            </div>
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}{" "}        {/* LLM 配置页面 */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* 配置列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">模型配置</h3>
                    <p className="text-sm text-gray-600 mt-1">管理你的 LLM 服务配置</p>
                  </div>
                  <button
                    onClick={handleNewSettings}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>新建配置</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {savedSettings.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无配置</h3>
                    <p className="text-sm text-gray-600 mb-4">创建你的第一个 LLM 配置来开始生成内容</p>
                    <button
                      onClick={handleNewSettings}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      创建配置
                    </button>
                  </div>
                ) : (
                  savedSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        selectedSettingsId === setting.id ? "bg-blue-50 border-r-4 border-blue-500" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg">{setting.name}</h4>
                            {setting.isConnected && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 border border-green-200 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-700 font-medium">已验证</span>
                              </div>
                            )}
                            {selectedSettingsId === setting.id && (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded-full">
                                <span className="text-xs text-blue-700 font-medium">当前使用</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{setting.baseUrl}</p>
                          <p className="text-sm text-gray-500">模型: {setting.model}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-2">
                            <span>创建: {new Date(setting.createdAt).toLocaleDateString()}</span>
                            {setting.lastTestedAt && (
                              <span>最后测试: {new Date(setting.lastTestedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSelectSettings(setting.id)}
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            选择
                          </button>
                          <button
                            onClick={() => handleEditSettings(setting.id)}
                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteSettings(setting.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除配置"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}{" "}        {/* 生成内容页面 */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            {/* 连接状态提示 */}
            {!isConnected && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-900">需要先配置 LLM</h3>
                    <p className="text-sm text-amber-700 mt-1">请先在模型配置页面设置并测试连接后再进行内容生成。</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                  >
                    去配置
                  </button>
                </div>
              </div>
            )}

            {/* 生成配置表单 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">课程生成配置</h3>
                <p className="text-sm text-gray-600 mt-1">设置课程主题和参数，AI 将自动生成对应的学习内容</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      课程主题 *
                    </label>
                    <input
                      type="text"
                      value={generateConfig.topic}
                      onChange={(e) =>
                        setGenerateConfig({
                          ...generateConfig,
                          topic: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="例如：日常对话、商务英语、旅游英语、餐厅点餐等"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      课程等级
                    </label>
                    <select
                      value={generateConfig.level}
                      onChange={(e) =>
                        setGenerateConfig({
                          ...generateConfig,
                          level: e.target.value as "beginner" | "intermediate" | "advanced",
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="beginner">初级 (Beginner)</option>
                      <option value="intermediate">中级 (Intermediate)</option>
                      <option value="advanced">高级 (Advanced)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      课程课时数
                    </label>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">建议 1-20 个课时</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      每课时句子数量
                    </label>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">建议 5-30 个句子</p>
                  </div>
                </div>

                {/* 课程统计信息 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">课程预览</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {generateConfig.lessonCount}
                      </div>
                      <div className="text-xs text-gray-600">课时</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {generateConfig.sentencesPerLesson}
                      </div>
                      <div className="text-xs text-gray-600">句子/课时</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {generateConfig.lessonCount * generateConfig.sentencesPerLesson}
                      </div>
                      <div className="text-xs text-gray-600">总句子数</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !isConnected || !generateConfig.topic.trim()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>生成中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>开始生成</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 生成结果 */}
            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{generatedContent.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{generatedContent.description}</p>
                    </div>
                    <button
                      onClick={handleSaveContent}
                      disabled={isSaving}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span>保存课程</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center space-x-4 mt-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      generatedContent.level === "beginner"
                        ? "bg-green-100 text-green-800"
                        : generatedContent.level === "intermediate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {generatedContent.level === "beginner" ? "初级" : 
                       generatedContent.level === "intermediate" ? "中级" : "高级"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {generateConfig.lessonCount} 课时 • {generateConfig.lessonCount * generateConfig.sentencesPerLesson} 个句子
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: generateConfig.lessonCount }, (_, lessonIndex) => {
                      const startIndex = lessonIndex * generateConfig.sentencesPerLesson;
                      const endIndex = startIndex + generateConfig.sentencesPerLesson;
                      const lessonSentences = generatedContent.sentences.slice(startIndex, endIndex);

                      return (
                        <div key={lessonIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="font-medium text-gray-900">
                              第 {lessonIndex + 1} 课时
                              <span className="ml-2 text-sm text-gray-500">({lessonSentences.length} 个句子)</span>
                            </h4>
                          </div>
                          
                          <div className="p-4">
                            <div className="space-y-3">
                              {lessonSentences.map((sentence: GeneratedSentence, sentenceIndex: number) => (
                                <div key={startIndex + sentenceIndex} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-gray-500 font-mono">
                                      #{startIndex + sentenceIndex + 1}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      sentence.difficulty === "easy"
                                        ? "bg-green-100 text-green-800"
                                        : sentence.difficulty === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}>
                                      {sentence.difficulty === "easy" ? "简单" : 
                                       sentence.difficulty === "medium" ? "中等" : "困难"}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-gray-900 text-sm">
                                      <span className="font-medium text-gray-600">中文：</span>
                                      {sentence.chinese}
                                    </p>
                                    <p className="text-gray-900 text-sm">
                                      <span className="font-medium text-gray-600">英文：</span>
                                      {sentence.english}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}{" "}      </div>

      {/* 配置表单 Modal */}
      {showConfigModal && (
        <Modal
          isOpen={showConfigModal}
          onClose={handleCloseConfigModal}
          title={isEditingConfig ? "编辑配置" : "新建配置"}
          maxWidth="max-w-2xl"
        >
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配置名称 *
                </label>
                <input
                  type="text"
                  value={llmSettings.name}
                  onChange={(e) =>
                    setLLMSettings({ ...llmSettings, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="例如：OpenAI GPT-4、豆包模型等"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="text"
                  value={llmSettings.baseUrl}
                  onChange={(e) =>
                    setLLMSettings({ ...llmSettings, baseUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://api.openai.com/v1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持 OpenAI 兼容的 API 接口
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={llmSettings.apiKey}
                  onChange={(e) =>
                    setLLMSettings({ ...llmSettings, apiKey: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称 *
                </label>
                <input
                  type="text"
                  value={llmSettings.model}
                  onChange={(e) =>
                    setLLMSettings({ ...llmSettings, model: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="gpt-3.5-turbo"
                />
              </div>

              {isConnected && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-700 font-medium">
                      连接成功！配置已自动保存。
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseConfigModal}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  取消
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    保存配置
                  </button>

                  <button
                    onClick={handleTestConnection}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>测试中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>测试连接</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}      {/* Toast 组件 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
        duration={1000}
      />

      {/* 保存成功模态框 */}
      {showSuccessModal && savedCourseInfo && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="课程保存成功"
          maxWidth="max-w-md"
        >
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              "{savedCourseInfo.title}" 已成功保存
            </h3>
            <div className="text-sm text-gray-600 space-y-1 mb-6">
              <p>课程ID: {savedCourseInfo.id}</p>
              <p>课时数: {savedCourseInfo.lessonCount} 课时</p>
              <p>句子总数: {savedCourseInfo.totalSentences} 个</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              确定
            </button>
          </div>
        </Modal>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="确认删除配置"
          maxWidth="max-w-md"
        >
          <div className="py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                确定要删除此配置吗？
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                删除后，该 LLM 配置将无法恢复。如果这是当前选中的配置，将重置为默认设置。
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteSettings}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AddContent;
