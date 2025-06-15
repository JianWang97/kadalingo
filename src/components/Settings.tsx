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

import React from "react";
import { useSpeech } from "../contexts/SpeechContext";
import { useFloatingModeSettings } from "../contexts/FloatingModeContext";
import { useKeyboardSound } from "../contexts/KeyboardSoundContext";

interface SettingsProps {
  className?: string;
  compact?: boolean;
  onOpenSettings?: () => void;
}

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

  // 紧凑模式：只显示一个设置按钮
  if (compact) {
    return (
      <button
        onClick={onOpenSettings}
        className={`p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center group ${className}`}
        title="设置"
      >
        <svg className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
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
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 语音设置区域 */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">语音设置</h4>
        
        {/* 启用/禁用语音功能 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">启用语音功能</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          </label>
        </div>
        
        {/* 自动播放设置 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">自动播放英文</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoPlay}
              onChange={(e) => updateSettings({ autoPlay: e.target.checked })}
              disabled={!settings.enabled}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              settings.autoPlay && settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            } ${!settings.enabled ? 'opacity-50' : ''}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                settings.autoPlay && settings.enabled ? 'translate-x-5' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          </label>
        </div>
        
        {/* 语音速度设置 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">语音速度</span>
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
              onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
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
            <span className="text-sm font-medium text-gray-700">音量</span>
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

      {/* 界面设置区域 */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">界面设置</h4>
        
        {/* 浮窗透明度设置 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">浮窗透明度</span>
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
      
      {/* 键盘声音设置 */}
      {isKeyboardSoundSupported && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">键盘声音</h4>
          
          <div className="space-y-4">
            {/* 启用/禁用键盘声音 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">输入时播放按键声音</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={keyboardSettings.enabled}
                  onChange={(e) =>
                    updateKeyboardSettings({ enabled: e.target.checked })
                  }
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  keyboardSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    keyboardSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </label>
            </div>
            
            {/* 声音类型设置 */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-gray-700">声音类型</span>
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
                <span className="text-sm font-medium text-gray-700">按键音量</span>
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
                    updateKeyboardSettings({ volume: Number(e.target.value) })
                  }
                  disabled={!keyboardSettings.enabled}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider_thumb]:h-4 
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
        </div>
      )}
      
      {/* 重置设置 */}
      <div className="pt-4 border-t border-gray-100">
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
    </div>
  );
};

export default Settings;
