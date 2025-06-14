/**
 * 键盘声音服务 - 管理输入时的键盘敲击声音
 */

export interface KeyboardSoundSettings {
  /** 是否启用键盘声音 */
  enabled: boolean;
  /** 音量 (0.0-1.0) */
  volume: number;
  /** 声音类型 */
  soundType: "mechanical" | "soft" | "typewriter";
}

interface SoundConfig {
  frequency: number;
  volume: number;
  attack: number;
  duration: number;
  waveType: OscillatorType;
}

class KeyboardSoundService {
  private _settings: KeyboardSoundSettings = {
    enabled: false,
    volume: 0.3,
    soundType: "mechanical",
  };

  private audioContext: AudioContext | null = null;

  constructor() {
    // 从 localStorage 恢复设置
    this.loadSettings();
    this.initAudioContext();
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem("keyboardSoundSettings");
      if (saved) {
        this._settings = { ...this._settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn("Failed to load keyboard sound settings:", error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        "keyboardSoundSettings",
        JSON.stringify(this._settings)
      );
    } catch (error) {
      console.warn("Failed to save keyboard sound settings:", error);
    }
  }
  private initAudioContext() {
    try {
      // 创建音频上下文
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioContextClass();
    } catch (error) {
      console.warn("Audio context not supported:", error);
    }
  }

  get settings(): KeyboardSoundSettings {
    return { ...this._settings };
  }

  updateSettings(newSettings: Partial<KeyboardSoundSettings>) {
    this._settings = { ...this._settings, ...newSettings };
    this.saveSettings();
  }
  /**
   * 播放键盘敲击声音
   * @param keyType 按键类型，默认为普通按键
   */
  playKeySound(keyType: "normal" | "space" | "enter" = "normal") {
    if (!this._settings.enabled || !this.audioContext) {
      return;
    }

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      this.generateKeySound(keyType);
    } catch (error) {
      console.warn("Failed to play key sound:", error);
    }
  }

  /**
   * 播放普通按键声音（兼容性方法）
   */
  playNormalKeySound() {
    this.playKeySound("normal");
  }

  /**
   * 播放空格键声音
   */
  playSpaceKeySound() {
    this.playKeySound("space");
  }

  /**
   * 播放回车键声音
   */
  playEnterKeySound() {
    this.playKeySound("enter");
  }
  private generateKeySound(keyType: "normal" | "space" | "enter" = "normal") {
    if (!this.audioContext) return;

    const soundConfig = this.getSoundConfig();

    if (this._settings.soundType === "mechanical") {
      // 根据按键类型生成不同的机械声音
      this.generateMechanicalClickSound(keyType);
    } else {
      // 其他声音类型的简单实现
      this.generateSimpleSound(soundConfig);
    }
  }  private generateMechanicalClickSound(keyType: 'normal' | 'space' | 'enter' = 'normal') {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const baseVolume = this._settings.volume;

    // 根据按键类型调整音效参数
    const keyConfig = this.getKeyTypeConfig(keyType);

    // 1. 超短脉冲"咔"声 - 模拟按键触发瞬间
    const clickPulse = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();

    clickPulse.connect(clickGain);
    clickGain.connect(this.audioContext.destination);

    clickPulse.frequency.setValueAtTime(keyConfig.clickFreq, currentTime);
    clickPulse.frequency.exponentialRampToValueAtTime(
      keyConfig.clickFreq * 0.7,
      currentTime + 0.004
    );
    clickPulse.type = "square";

    // 极短的脉冲，模拟真实按键的瞬间触发
    clickGain.gain.setValueAtTime(0, currentTime);
    clickGain.gain.linearRampToValueAtTime(
      baseVolume * keyConfig.clickVolume,
      currentTime + 0.001
    );
    clickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + keyConfig.clickDuration);

    clickPulse.start(currentTime);
    clickPulse.stop(currentTime + keyConfig.clickDuration);

    // 2. 白噪音脉冲 - 模拟塑料撞击声
    const noiseBuffer = this.createNoiseBuffer(keyConfig.noiseDuration);
    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    // 高通滤波器，只保留清脆的高频噪音
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(keyConfig.noiseFilter, currentTime);
    noiseFilter.Q.setValueAtTime(1, currentTime);

    noiseGain.gain.setValueAtTime(0, currentTime);
    noiseGain.gain.linearRampToValueAtTime(
      baseVolume * keyConfig.noiseVolume,
      currentTime + 0.002
    );
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + keyConfig.noiseDuration);

    noiseSource.start(currentTime);

    // 3. "哒"声 - 按键到底的撞击声
    const bottomHit = this.audioContext.createOscillator();
    const bottomGain = this.audioContext.createGain();

    bottomHit.connect(bottomGain);
    bottomGain.connect(this.audioContext.destination);

    bottomHit.frequency.setValueAtTime(keyConfig.bottomFreq, currentTime + 0.006);
    bottomHit.frequency.exponentialRampToValueAtTime(keyConfig.bottomFreq * 0.5, currentTime + keyConfig.bottomDuration);
    bottomHit.type = "triangle";

    bottomGain.gain.setValueAtTime(0, currentTime + 0.006);
    bottomGain.gain.linearRampToValueAtTime(
      baseVolume * keyConfig.bottomVolume,
      currentTime + 0.008
    );
    bottomGain.gain.exponentialRampToValueAtTime(0.001, currentTime + keyConfig.bottomDuration);

    bottomHit.start(currentTime + 0.006);
    bottomHit.stop(currentTime + keyConfig.bottomDuration);
  }

  // 获取不同按键类型的音效配置
  private getKeyTypeConfig(keyType: 'normal' | 'space' | 'enter') {
    switch (keyType) {
      case 'space':
        return {
          clickFreq: 1800,      // 空格键稍低的频率
          clickVolume: 0.9,     // 更大的音量
          clickDuration: 0.012, // 稍长的持续时间
          noiseFilter: 1500,    // 更低的噪音滤波频率
          noiseVolume: 0.5,     // 更大的噪音音量
          noiseDuration: 0.020, // 更长的噪音持续时间
          bottomFreq: 600,      // 更低的撞击频率
          bottomVolume: 0.7,    // 更大的撞击音量
          bottomDuration: 0.035 // 更长的撞击持续时间
        };
      case 'enter':
        return {
          clickFreq: 2500,      // 回车键更高的频率
          clickVolume: 1.0,     // 最大音量
          clickDuration: 0.010, // 标准持续时间
          noiseFilter: 2500,    // 更高的噪音滤波频率
          noiseVolume: 0.6,     // 更大的噪音音量
          noiseDuration: 0.025, // 更长的噪音持续时间
          bottomFreq: 900,      // 更高的撞击频率
          bottomVolume: 0.8,    // 更大的撞击音量
          bottomDuration: 0.040 // 最长的撞击持续时间
        };
      default: // normal
        return {
          clickFreq: 2200,      // 普通按键标准频率
          clickVolume: 0.8,     // 标准音量
          clickDuration: 0.008, // 标准持续时间
          noiseFilter: 2000,    // 标准噪音滤波频率
          noiseVolume: 0.4,     // 标准噪音音量
          noiseDuration: 0.015, // 标准噪音持续时间
          bottomFreq: 800,      // 标准撞击频率
          bottomVolume: 0.5,    // 标准撞击音量
          bottomDuration: 0.025 // 标准撞击持续时间
        };
    }
  }

  // 创建白噪音缓冲区
  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not available");

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成白噪音
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  private generateSimpleSound(soundConfig: SoundConfig) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // 连接音频节点
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 设置频率
    oscillator.frequency.setValueAtTime(
      soundConfig.frequency,
      this.audioContext.currentTime
    );

    // 设置音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this._settings.volume * soundConfig.volume,
      this.audioContext.currentTime + soundConfig.attack
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + soundConfig.duration
    );

    // 设置波形类型
    oscillator.type = soundConfig.waveType;

    // 播放声音
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + soundConfig.duration);
  }

  private getSoundConfig(): SoundConfig {
    switch (this._settings.soundType) {
      case "mechanical":
        return {
          frequency: 1200,
          volume: 0.18,
          attack: 0.005,
          duration: 0.05,
          waveType: "square" as OscillatorType,
        };
      case "soft":
        return {
          frequency: 500,
          volume: 0.1,
          attack: 0.02,
          duration: 0.12,
          waveType: "sine" as OscillatorType,
        };
      case "typewriter":
        return {
          frequency: 1200,
          volume: 0.2,
          attack: 0.005,
          duration: 0.06,
          waveType: "sawtooth" as OscillatorType,
        };
      default:
        return {
          frequency: 800,
          volume: 0.15,
          attack: 0.01,
          duration: 0.08,
          waveType: "square" as OscillatorType,
        };
    }
  }
  /**
   * 检查是否支持音频播放
   */
  isSupported(): boolean {
    return !!(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    );
  }
}

// 创建全局实例
export const keyboardSoundService = new KeyboardSoundService();

export default keyboardSoundService;
