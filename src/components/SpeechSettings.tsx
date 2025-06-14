import React from "react";
import { useSpeech } from "../contexts/SpeechContext";
import { useFloatingModeSettings } from "../contexts/FloatingModeContext";
import { useKeyboardSound } from "../contexts/KeyboardSoundContext";

interface SpeechSettingsProps {
  className?: string;
  compact?: boolean;
  onOpenSettings?: () => void;
}

const SpeechSettings: React.FC<SpeechSettingsProps> = ({
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
        className={`p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 ${className}`}
        title="语音设置"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm">设置</span>
      </button>
    );
  }

  if (!isSupported) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700">语音设置</h3>
        <div className="text-sm text-red-600">您的浏览器不支持语音播报功能</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700">语音设置</h3>

      <div className="space-y-3">
        {/* 启用/禁用语音功能 */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSettings({ enabled: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">启用语音功能</span>
        </label>
        {/* 自动播放设置 */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoPlay}
            onChange={(e) => updateSettings({ autoPlay: e.target.checked })}
            disabled={!settings.enabled}
            className="rounded border-gray-300 disabled:opacity-50"
          />
          <span className="text-sm text-gray-600">自动播放英文</span>
        </label>
        {/* 语音速度设置 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">语音速度</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={(e) => updateSettings({ rate: Number(e.target.value) })}
              disabled={!settings.enabled}
              className="flex-1 disabled:opacity-50"
            />
            <span className="text-sm text-gray-500 w-12">
              {settings.rate.toFixed(1)}x
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>慢</span>
            <span>快</span>
          </div>
        </div>
        {/* 音量设置 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">音量</label>
          <div className="flex items-center gap-3">
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
              className="flex-1 disabled:opacity-50"
            />
            <span className="text-sm text-gray-500 w-12">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>静音</span>
            <span>最大</span>
          </div>{" "}
        </div>
        {/* 浮窗透明度设置 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-600">浮窗透明度</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={floatingSettings.opacity}
              onChange={(e) =>
                updateFloatingSettings({ opacity: Number(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-12">
              {Math.round(floatingSettings.opacity * 100)}%
            </span>
          </div>{" "}
          <div className="flex justify-between text-xs text-gray-400">
            <span>透明</span>
            <span>不透明</span>
          </div>
        </div>
        {/* 键盘声音设置 */}
        {isKeyboardSoundSupported && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">键盘声音</h4>

              {/* 启用/禁用键盘声音 */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={keyboardSettings.enabled}
                  onChange={(e) =>
                    updateKeyboardSettings({ enabled: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  输入时播放按键声音
                </span>
              </label>

              {/* 声音类型设置 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">声音类型</label>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:bg-gray-100"
                >
                  <option value="mechanical">机械键盘</option>
                  <option value="soft">柔和声音</option>
                  <option value="typewriter">打字机</option>
                </select>
              </div>

              {/* 键盘声音音量设置 */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">按键音量</label>
                <div className="flex items-center gap-3">
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
                    className="flex-1 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-500 w-12">
                    {Math.round(keyboardSettings.volume * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>静音</span>
                  <span>最大</span>
                </div>
              </div>
            </div>
          </>
        )}{" "}
        {/* 重置设置 */}
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
          disabled={!settings.enabled}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          重置为默认设置
        </button>
      </div>
    </div>
  );
};

export default SpeechSettings;
