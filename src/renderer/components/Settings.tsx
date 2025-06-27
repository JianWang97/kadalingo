/**
 * Settings 组件 - 应用程序设置面板
 *
 * 这个组件整合了原来的语音设置以及其他应用设置功能，
 * 提供了一个统一的设置界面，便于未来扩展更多设置选项。
 *
 * 功能模块：
 * - 语音设置：语音播放相关配置
 * - 界面设置：UI相关配置（如浮窗透明度）
 * - 键盘声音：按键音效配置
 *
 * 支持紧凑模式和完整模式两种显示方式。
 */

import React, { useState } from "react";
import { useSpeech } from "../contexts/SpeechContext";
import { useFloatingModeSettings } from "../contexts/FloatingModeContext";
import { useKeyboardSound } from "../contexts/KeyboardSoundContext";
import { useLLM, type LLMSettings } from "../contexts/LLMContext";
import { Modal, Toast } from "./common";

interface SettingsProps {
  className?: string;
  compact?: boolean;
  onOpenSettings?: () => void;
}

type SettingsTab = "speech" | "interface" | "keyboard" | "llm" | "general";

export const Settings: React.FC<SettingsProps> = ({
  className = "",
  compact = false,
  onOpenSettings,
}) => {
  const { settings, updateSettings, isSupported } = useSpeech();
  const { settings: floatingSettings, updateSettings: updateFloatingSettings } =
    useFloatingModeSettings();
  const {
    settings: keyboardSettings,
    updateSettings: updateKeyboardSettings,
    isSupported: isKeyboardSoundSupported,
  } = useKeyboardSound();

  // LLM 相关状态和方法
  const llmContext = useLLM();
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [editingLLMSettings, setEditingLLMSettings] =
    useState<LLMSettings | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSettingsId, setDeleteSettingsId] = useState<string>("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("speech");

  // 导入导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Toast 工具函数
  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setToast({
      show: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // LLM 配置相关处理函数
  const handleNewLLMConfig = () => {
    setEditingLLMSettings(llmContext.getDefaultSettings());
    setShowLLMModal(true);
  };

  const handleEditLLMConfig = (settings: LLMSettings) => {
    setEditingLLMSettings(settings);
    setShowLLMModal(true);
  };

  const handleDeleteLLMConfig = (id: string) => {
    setDeleteSettingsId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteLLMConfig = () => {
    llmContext.deleteSettings(deleteSettingsId);
    setShowDeleteModal(false);
    setDeleteSettingsId("");
    showToast("配置已删除", "success");
  };

  const handleTestLLMConnection = async () => {
    if (!editingLLMSettings) return;

    setIsTestingConnection(true);
    try {
      const success = await llmContext.testConnection(editingLLMSettings);
      if (success) {
        showToast("连接成功！配置已保存", "success");
        setShowLLMModal(false);
        setEditingLLMSettings(null);
      } else {
        showToast("连接失败，请检查配置", "error");
      }
    } catch (error) {
      showToast("连接失败：" + (error as Error).message, "error");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveLLMConfig = async () => {
    if (!editingLLMSettings) return;

    if (
      !editingLLMSettings.name ||
      !editingLLMSettings.baseUrl ||
      !editingLLMSettings.apiKey
    ) {
      showToast("请填写配置名称、Base URL和API Key", "error");
      return;
    }

    try {
      await llmContext.saveSettings(editingLLMSettings);
      showToast("配置保存成功", "success");
      setShowLLMModal(false);
      setEditingLLMSettings(null);
    } catch (error) {
      showToast("保存失败：" + (error as Error).message, "error");
    }
  };

  // 渲染 LLM 设置页面
  const renderLLMSettings = () => {
    return (
      <div className="space-y-6">
        {/* 头部区域 */}
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
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
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">LLM 配置管理</h3>
              <p className="text-sm text-gray-500">管理您的 AI 模型配置</p>
            </div>
          </div>
          <button
            onClick={handleNewLLMConfig}
            className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <span className="relative z-10 flex items-center gap-2">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              新建配置
            </span>
          </button>
        </div>{" "}
        {/* 配置列表 */}
        <div className="space-y-3">
          {llmContext.settings.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-100 rounded-xl mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-1">
                暂无 LLM 配置
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                开始添加您的第一个 AI 模型配置
              </p>
              <button
                onClick={handleNewLLMConfig}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-purple-700 transition-all duration-200"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                创建配置
              </button>
            </div>
          ) : (
            llmContext.settings.map((setting) => (
              <div
                key={setting.id}
                className={`group relative overflow-visible rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                  setting.id === llmContext.selectedSettingsId
                    ? "border-purple-500 bg-gradient-to-r from-purple-50 to-purple-50 shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* 选中指示器 */}
                {setting.id === llmContext.selectedSettingsId && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* 主要信息 - 紧凑显示 */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            setting.isConnected ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${
                              setting.isConnected
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          {" "}
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {setting.name}
                            </h4>
                            {/* 连接状态指示器 */}
                            <div
                              className={`w-2 h-2 rounded-full ${
                                setting.isConnected
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                              title={setting.isConnected ? "已连接" : "未连接"}
                            ></div>
                            {/* 使用状态指示器 */}
                            {setting.id === llmContext.selectedSettingsId && (
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full"
                                title="当前使用中"
                              >
                                <div className="w-full h-full bg-purple-600 rounded-full animate-ping"></div>
                              </div>
                            )}
                          </div>
                          {/* 基本信息 - 单行显示 */}
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span
                              className="truncate max-w-[120px]"
                              title={setting.model}
                            >
                              <span className="font-medium">模型:</span>{" "}
                              {setting.model}
                            </span>
                            <span
                              className="truncate max-w-[180px]"
                              title={setting.baseUrl}
                            >
                              <span className="font-medium">URL:</span>{" "}
                              {setting.baseUrl}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 详细信息 - 悬停时显示 */}
                      <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-100 rounded">
                              <svg
                                className="w-3 h-3 text-purple-600"
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
                            <div>
                              <p className="text-gray-500 font-medium">模型</p>
                              <p className="text-gray-900 font-semibold">
                                {setting.model}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-100 rounded">
                              <svg
                                className="w-3 h-3 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-gray-500 font-medium">
                                Base URL
                              </p>
                              <p
                                className="text-gray-900 font-semibold truncate"
                                title={setting.baseUrl}
                              >
                                {setting.baseUrl}
                              </p>
                            </div>
                          </div>
                        </div>
                        {setting.lastTestedAt && (
                          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                            <div className="p-1 bg-green-100 rounded">
                              <svg
                                className="w-3 h-3 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">
                                最后测试
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {new Date(setting.lastTestedAt).toLocaleString(
                                  "zh-CN",
                                  {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 - 紧凑布局 */}
                    <div className="flex items-center gap-1.5 ml-4">
                      {setting.id !== llmContext.selectedSettingsId && (
                        <button
                          onClick={() => llmContext.selectSettings(setting.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium rounded-md hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                          title="设为当前使用"
                        >
                          使用
                        </button>
                      )}
                      <button
                        onClick={() => handleEditLLMConfig(setting)}
                        className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all duration-200"
                        title="编辑配置"
                      >
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteLLMConfig(setting.id)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200"
                        title="删除配置"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  // 标签页定义
  const tabs = [
    { id: "speech" as SettingsTab, name: "语音设置", icon: "🔊" },
    { id: "interface" as SettingsTab, name: "界面设置", icon: "🎨" },
    { id: "keyboard" as SettingsTab, name: "键盘声音", icon: "⌨️" },
    { id: "llm" as SettingsTab, name: "LLM配置", icon: "🤖" },
    { id: "general" as SettingsTab, name: "通用设置", icon: "⚙️" },
  ];

  // 紧凑模式：只显示一个设置按钮
  if (compact) {
    return (
      <button
        onClick={onOpenSettings}
        className={`p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center group ${className}`}
        title="设置"
      >
        <svg
          className="w-5 h-5 group-hover:scale-105 transition-transform duration-200"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  if (!isSupported) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>

          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">语音功能不可用</h3>
            <p className="text-sm text-red-700">您的浏览器不支持语音播报功能</p>
          </div>
        </div>
      </div>
    );
  }

  // 渲染标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case "speech":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              语音设置
            </h3>

            {/* 启用/禁用语音功能 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  启用语音功能
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  开启后可以播放句子的语音
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) =>
                    updateSettings({ enabled: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings.enabled ? "bg-purple-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      settings.enabled ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </div>
              </label>
            </div>

            {/* 自动播放设置 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  自动播放英文
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  显示新句子时自动播放语音
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) =>
                    updateSettings({ autoPlay: e.target.checked })
                  }
                  disabled={!settings.enabled}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    settings.autoPlay && settings.enabled
                      ? "bg-purple-600"
                      : "bg-gray-200"
                  } ${!settings.enabled ? "opacity-50" : ""}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      settings.autoPlay && settings.enabled
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </div>
              </label>
            </div>

            {/* 语音速度设置 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    语音速度
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    调整语音播放的速度
                  </p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {settings.rate.toFixed(1)}x
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) =>
                    updateSettings({ rate: Number(e.target.value) })
                  }
                  disabled={!settings.enabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>慢 (0.5x)</span>
                  <span>快 (2.0x)</span>
                </div>
              </div>
            </div>

            {/* 音量设置 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    音量
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    调整语音播放的音量
                  </p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) =>
                    updateSettings({ volume: Number(e.target.value) })
                  }
                  disabled={!settings.enabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>静音 (0%)</span>
                  <span>最大 (100%)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "interface":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              界面设置
            </h3>

            {/* 浮窗透明度设置 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    浮窗透明度
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    调整悬浮窗口的透明度
                  </p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {Math.round(floatingSettings.opacity * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={floatingSettings.opacity}
                  onChange={(e) =>
                    updateFloatingSettings({ opacity: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>透明 (0%)</span>
                  <span>不透明 (100%)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "keyboard":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              键盘声音
            </h3>

            {!isKeyboardSoundSupported ? (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      />
                    </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    键盘声音不可用
                  </h4>
                  <p className="text-sm text-yellow-700">
                    当前环境不支持键盘音效功能
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 启用/禁用键盘声音 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      启用按键声音
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      输入时播放按键音效
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keyboardSettings.enabled}
                      onChange={(e) =>
                        updateKeyboardSettings({ enabled: e.target.checked })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        keyboardSettings.enabled ? "bg-purple-600" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          keyboardSettings.enabled
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>

                {/* 声音类型设置 */}
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      声音类型
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      选择不同的按键音效
                    </p>
                  </div>
                  <select
                    value={keyboardSettings.soundType}
                    onChange={(e) =>
                      updateKeyboardSettings({
                        soundType: e.target.value as
                          | "mechanical"
                          | "soft"
                          | "typewriter",
                      })
                    }
                    disabled={!keyboardSettings.enabled}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mechanical">机械键盘</option>
                    <option value="soft">柔和声音</option>
                    <option value="typewriter">打字机</option>
                  </select>
                </div>

                {/* 键盘声音音量设置 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        按键音量
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        调整按键音效的音量
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {Math.round(keyboardSettings.volume * 100)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={keyboardSettings.volume}
                      onChange={(e) =>
                        updateKeyboardSettings({
                          volume: Number(e.target.value),
                        })
                      }
                      disabled={!keyboardSettings.enabled}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>静音 (0%)</span>
                      <span>最大 (100%)</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case "general":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              通用设置
            </h3>

            {/* 导入导出设置 */}
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">数据导入/导出</span>
                <p className="text-xs text-gray-500 mt-1">导出或导入所有应用数据（包括所有 IndexDB 数据）</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      // 导出所有 IndexedDB 数据
                      const exportAllIndexedDB = async () => {
                        const dbs = await window.indexedDB.databases();
                        const result: Record<string, any> = {};
                        for (const dbInfo of dbs) {
                          const dbName = dbInfo.name;
                          if (!dbName) continue;
                          const req = window.indexedDB.open(dbName);
                          await new Promise((resolve, reject) => {
                            req.onsuccess = () => {
                              const db = req.result;
                              const tx = db.transaction(db.objectStoreNames, "readonly");
                              const stores: Record<string, any[]> = {};
                              let pending = db.objectStoreNames.length;
                              if (pending === 0) {
                                db.close();
                                resolve(null);
                              }
                              for (const storeName of db.objectStoreNames) {
                                const store = tx.objectStore(storeName);
                                const getAllReq = store.getAll();
                                getAllReq.onsuccess = () => {
                                  stores[storeName] = getAllReq.result;
                                  pending--;
                                  if (pending === 0) {
                                    db.close();
                                    result[dbName] = stores;
                                    resolve(null);
                                  }
                                };
                                getAllReq.onerror = reject;
                              }
                            };
                            req.onerror = reject;
                          });
                        }
                        return result;
                      };
                      const data = await exportAllIndexedDB();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `kadalingo-indexeddb-backup-${Date.now()}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast("导出成功", "success");
                    } catch (e) {
                      showToast("导出失败: " + (e as Error).message, "error");
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  className={`px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 ${isExporting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={isExporting}
                >
                  {isExporting ? '导出中…' : '导出数据'}
                </button>
                <label className={`px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 cursor-pointer ${isImporting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {isImporting ? '导入中…' : '导入数据'}
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    disabled={isImporting}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImportFile(file);
                      setShowImportConfirm(true);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* 重置设置 */}
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  重置设置
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  将所有设置恢复为默认值
                </p>
              </div>
              <button
                onClick={() => {
                  updateSettings({
                    rate: 0.9,
                    volume: 0.8,
                    autoPlay: true,
                    enabled: true,
                  });
                  updateFloatingSettings({
                    opacity: 0.3,
                  });
                  updateKeyboardSettings({
                    enabled: false,
                    volume: 0.3,
                    soundType: "mechanical",
                  });
                }}
                className="w-full px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                重置为默认设置
              </button>
            </div>

            {/* 应用信息 */}
            <div className="pt-4 border-t border-gray-100">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    应用信息
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>版本: 1.0.3</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "llm":
        return renderLLMSettings();

      default:
        return null;
    }
  };
  return (
    <>
      <div className={`flex h-full bg-white overflow-hidden ${className}`}>
        {/* 左侧标签页 */}
        <div
          className="w-48 bg-gray-50 border-gray-200 flex flex-col h-full overflow-hidden"
          style={{ height: "450px" }}
        >
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>{" "}
        {/* 右侧内容区域 */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ height: "450px" }}
        >
          <div className="flex-1 overflow-y-auto p-6">
            <div className="h-full">{renderTabContent()}</div>
          </div>
        </div>
      </div>{" "}
      {/* LLM 配置 Modal */}
      <Modal
        isOpen={showLLMModal}
        onClose={() => {
          setShowLLMModal(false);
          setEditingLLMSettings(null);
        }}
        title={editingLLMSettings?.id ? "编辑 LLM 配置" : "新建 LLM 配置"}
        maxWidth="max-w-2xl"
      >
        {editingLLMSettings && (
          <div className="space-y-5">
            {/* 表单网格布局 */}
            <div className="grid grid-cols-1 gap-4">
              {/* 配置名称 */}
              <div className="group">
                {" "}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1.5">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  配置名称
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingLLMSettings.name}
                    onChange={(e) =>
                      setEditingLLMSettings({
                        ...editingLLMSettings,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm 
                             focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 
                             transition-all duration-200 group-hover:border-gray-300"
                    placeholder="例如：OpenAI GPT-3.5"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Base URL */}
              <div className="group">
                {" "}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1.5">
                  <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                  Base URL
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingLLMSettings.baseUrl}
                    onChange={(e) =>
                      setEditingLLMSettings({
                        ...editingLLMSettings,
                        baseUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm 
                             focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 
                             transition-all duration-200 group-hover:border-gray-300"
                    placeholder="https://api.openai.com/v1"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="group">
                {" "}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1.5">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  API Key
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={editingLLMSettings.apiKey}
                    onChange={(e) =>
                      setEditingLLMSettings({
                        ...editingLLMSettings,
                        apiKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm 
                             focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 
                             transition-all duration-200 group-hover:border-gray-300"
                    placeholder="sk-..."
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 模型 */}
              <div className="group">
                {" "}
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1.5">
                  <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                  模型名称
                  <span className="text-gray-400 text-xs ml-auto">可选</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingLLMSettings.model}
                    onChange={(e) =>
                      setEditingLLMSettings({
                        ...editingLLMSettings,
                        model: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm 
                             focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 
                             transition-all duration-200 group-hover:border-gray-300"
                    placeholder="gpt-3.5-turbo"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-gray-100 pt-4"></div>

            {/* 按钮组 - 紧凑设计 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestLLMConnection}
                disabled={isTestingConnection}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 
                         text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-green-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
                         shadow-sm hover:shadow-md disabled:shadow-none min-w-[100px]"
              >
                {isTestingConnection ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    测试中
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    测试连接
                  </>
                )}
              </button>

              <button
                onClick={handleSaveLLMConfig}
                className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 
                         text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-700 
                         transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-4 h-4"
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
                保存配置
              </button>

              <button
                onClick={() => {
                  setShowLLMModal(false);
                  setEditingLLMSettings(null);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 text-sm font-medium 
                         border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 
                         transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* 删除确认 Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteSettingsId("");
        }}
        title="确认删除"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除这个 LLM 配置吗？此操作无法撤销。
          </p>
          <div className="flex gap-3">
            <button
              onClick={confirmDeleteLLMConfig}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              确认删除
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteSettingsId("");
              }}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </Modal>{" "}
      {/* Toast 通知 */}
      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
      {/* 导入确认弹窗 */}
      <Modal
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setImportFile(null);
        }}
        title="确认导入"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">导入数据将覆盖现有的所有 IndexDB 数据，确定继续吗？</p>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (!importFile) return;
                setIsImporting(true);
                setShowImportConfirm(false);
                try {
                  const text = await importFile.text();
                  const data = JSON.parse(text);
                  // 导入所有 IndexedDB 数据
                  const importAllIndexedDB = async (data: Record<string, any>) => {
                    for (const dbName in data) {
                      const dbData = data[dbName];
                      const req = window.indexedDB.open(dbName);
                      await new Promise((resolve, reject) => {
                        req.onsuccess = () => {
                          const db = req.result;
                          const tx = db.transaction(db.objectStoreNames, "readwrite");
                          for (const storeName of db.objectStoreNames) {
                            const store = tx.objectStore(storeName);
                            // 清空原有数据
                            store.clear();
                            // 写入新数据
                            const items = dbData[storeName] || [];
                            for (const item of items) {
                              try { store.add(item); } catch { /* ignore */ }
                            }
                          }
                          tx.oncomplete = () => {
                            db.close();
                            resolve(null);
                          };
                          tx.onerror = reject;
                        };
                        req.onerror = reject;
                      });
                    }
                  };
                  await importAllIndexedDB(data);
                  showToast("导入成功", "success");
                } catch (e) {
                  showToast("导入失败: " + (e as Error).message, "error");
                } finally {
                  setIsImporting(false);
                  setImportFile(null);
                }
              }}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={isImporting}
            >
              确认导入
            </button>
            <button
              onClick={() => {
                setShowImportConfirm(false);
                setImportFile(null);
              }}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isImporting}
            >
              取消
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Settings;
