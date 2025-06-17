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
  const [editingLLMSettings, setEditingLLMSettings] = useState<LLMSettings | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSettingsId, setDeleteSettingsId] = useState<string>("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("speech");

  // Toast 工具函数
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
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

    if (!editingLLMSettings.name || !editingLLMSettings.baseUrl || !editingLLMSettings.apiKey) {
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">LLM 配置管理</h3>
          <button
            onClick={handleNewLLMConfig}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建配置
          </button>
        </div>

        {/* 配置列表 */}
        <div className="space-y-3">
          {llmContext.settings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🤖</div>
              <p>暂无 LLM 配置</p>
              <p className="text-sm mt-2">点击"新建配置"添加您的第一个配置</p>
            </div>
          ) : (
            llmContext.settings.map((setting) => (
              <div
                key={setting.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  setting.id === llmContext.selectedSettingsId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{setting.name}</h4>
                      <div className="flex items-center gap-2">
                        {setting.isConnected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            已连接
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                            未连接
                          </span>
                        )}
                        {setting.id === llmContext.selectedSettingsId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            当前选中
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>模型: {setting.model}</p>
                      <p>Base URL: {setting.baseUrl}</p>
                      {setting.lastTestedAt && (
                        <p>
                          最后测试: {new Date(setting.lastTestedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {setting.id !== llmContext.selectedSettingsId && (
                      <button
                        onClick={() => llmContext.selectSettings(setting.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        使用
                      </button>
                    )}
                    <button
                      onClick={() => handleEditLLMConfig(setting)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteLLMConfig(setting.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      删除
                    </button>
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
                    settings.enabled ? "bg-blue-600" : "bg-gray-200"
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
                      ? "bg-blue-600"
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
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
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
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
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
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                    [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
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
                      clipRule="evenodd"
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
                        keyboardSettings.enabled ? "bg-blue-600" : "bg-gray-200"
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                        [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
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
        );      case "general":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              通用设置
            </h3>

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
                className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
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
                  <p>语言学习练习工具</p>
                  <p>版本: 1.0.0</p>
                  <p>基于 Electron + React 构建</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "llm":
        return renderLLMSettings();

      default:
        return null;
    }  };
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
                    ? "bg-blue-100 text-blue-700"
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
      </div>      {/* LLM 配置 Modal */}
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
          <div className="space-y-4">
            {/* 配置名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配置名称 *
              </label>
              <input
                type="text"
                value={editingLLMSettings.name}
                onChange={(e) =>
                  setEditingLLMSettings({
                    ...editingLLMSettings,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：OpenAI GPT-3.5"
              />
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL *
              </label>
              <input
                type="text"
                value={editingLLMSettings.baseUrl}
                onChange={(e) =>
                  setEditingLLMSettings({
                    ...editingLLMSettings,
                    baseUrl: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={editingLLMSettings.apiKey}
                onChange={(e) =>
                  setEditingLLMSettings({
                    ...editingLLMSettings,
                    apiKey: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk-..."
              />
            </div>

            {/* 模型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={editingLLMSettings.model}
                onChange={(e) =>
                  setEditingLLMSettings({
                    ...editingLLMSettings,
                    model: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="gpt-3.5-turbo"
              />
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleTestLLMConnection}
                disabled={isTestingConnection}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTestingConnection ? "测试中..." : "测试连接"}
              </button>
              <button
                onClick={handleSaveLLMConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存配置
              </button>
              <button
                onClick={() => {
                  setShowLLMModal(false);
                  setEditingLLMSettings(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>      {/* 删除确认 Modal */}
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
          <p className="text-gray-600">确定要删除这个 LLM 配置吗？此操作无法撤销。</p>
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
      </Modal>      {/* Toast 通知 */}
      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};

export default Settings;
