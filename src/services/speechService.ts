/**
 * 语音服务 - 全局语音配置和管理
 */

export interface SpeechSettings {
  /** 语音速度 (0.5-2.0) */
  rate: number;
  /** 语音音量 (0.0-1.0) */
  volume: number;
  /** 自动播放英文 */
  autoPlay: boolean;
  /** 是否启用语音功能 */
  enabled: boolean;
}

export interface SpeechServiceInterface {
  /** 当前设置 */
  settings: SpeechSettings;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 更新设置 */
  updateSettings: (newSettings: Partial<SpeechSettings>) => void;
  /** 播放中文文本 */
  speakChinese: (text: string) => Promise<void>;
  /** 播放英文文本 */
  speakEnglish: (text: string) => Promise<void>;
  /** 播放文本（指定语言） */
  speak: (text: string, language: 'zh-CN' | 'en-US') => Promise<void>;
  /** 停止播放 */
  stop: () => void;
  /** 检查浏览器是否支持语音合成 */
  isSupported: () => boolean;
  /** 获取可用的语音列表 */
  getVoices: () => SpeechSynthesisVoice[];
  /** 设置回调函数 */
  onPlayStateChange: (callback: (isPlaying: boolean) => void) => void;
  /** 移除回调函数 */
  offPlayStateChange: (callback: (isPlaying: boolean) => void) => void;
}

class SpeechService implements SpeechServiceInterface {
  private _settings: SpeechSettings = {
    rate: 0.9,
    volume: 0.8,
    autoPlay: true,
    enabled: true,
  };

  private _isPlaying = false;
  private _playStateCallbacks: Set<(isPlaying: boolean) => void> = new Set();
  private _currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    // 从本地存储加载设置
    this.loadSettings();
  }

  get settings(): SpeechSettings {
    return { ...this._settings };
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  updateSettings(newSettings: Partial<SpeechSettings>): void {
    this._settings = { ...this._settings, ...newSettings };
    this.saveSettings();
  }

  async speakChinese(text: string): Promise<void> {
    return this.speak(text, 'zh-CN');
  }

  async speakEnglish(text: string): Promise<void> {
    return this.speak(text, 'en-US');
  }

  async speak(text: string, language: 'zh-CN' | 'en-US'): Promise<void> {
    if (!this._settings.enabled || !this.isSupported()) {
      console.warn('语音功能未启用或不支持');
      return;
    }

    // 停止当前播放
    this.stop();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = this._settings.rate;
      utterance.volume = this._settings.volume;

      // 尝试选择合适的语音
      const voices = this.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(language.split('-')[0])
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.setPlayState(true);
      };

      utterance.onend = () => {
        this.setPlayState(false);
        this._currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.setPlayState(false);
        this._currentUtterance = null;
        console.error('语音播放错误:', event);
        reject(new Error(`语音播放失败: ${event.error}`));
      };

      this._currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.setPlayState(false);
    this._currentUtterance = null;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) {
      return [];
    }
    return window.speechSynthesis.getVoices();
  }

  onPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this._playStateCallbacks.add(callback);
  }

  offPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this._playStateCallbacks.delete(callback);
  }

  private setPlayState(isPlaying: boolean): void {
    if (this._isPlaying !== isPlaying) {
      this._isPlaying = isPlaying;
      this._playStateCallbacks.forEach(callback => {
        try {
          callback(isPlaying);
        } catch (error) {
          console.error('播放状态回调错误:', error);
        }
      });
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('speechSettings', JSON.stringify(this._settings));
    } catch (error) {
      console.error('保存语音设置失败:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('speechSettings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        this._settings = { ...this._settings, ...parsedSettings };
      }
    } catch (error) {
      console.error('加载语音设置失败:', error);
    }
  }
}

// 单例实例
export const speechService = new SpeechService();

// 默认导出类以便测试
export default SpeechService;
