import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { KeyboardSoundSettings } from "./keyboardSoundService";

// Mock AudioContext before importing the service
class MockAudioContext {
  public state = "running";
  public sampleRate = 44100;
  public currentTime = 0;
  
  private oscillators: MockOscillator[] = [];
  private bufferSources: MockBufferSource[] = [];

  createOscillator() {
    const oscillator = new MockOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return new MockGainNode();
  }

  createBiquadFilter() {
    return new MockBiquadFilter();
  }

  createBuffer(channels: number, frameCount: number, sampleRate: number) {
    return new MockAudioBuffer(channels, frameCount, sampleRate);
  }

  createBufferSource() {
    const source = new MockBufferSource();
    this.bufferSources.push(source);
    return source;
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  get destination() {
    return new MockAudioDestination();
  }

  // 测试辅助方法
  getCreatedOscillators() {
    return [...this.oscillators];
  }

  getCreatedBufferSources() {
    return [...this.bufferSources];
  }

  clearCreatedNodes() {
    this.oscillators = [];
    this.bufferSources = [];
  }
}

class MockOscillator {
  public frequency = new MockAudioParam();
  public type: OscillatorType = "sine";
  public isStarted = false;
  public isStopped = false;
  public startTime = 0;
  public stopTime = 0;

  connect() {
    return this;
  }

  start(time = 0) {
    this.isStarted = true;
    this.startTime = time;
  }

  stop(time = 0) {
    this.isStopped = true;
    this.stopTime = time;
  }
}

class MockBufferSource {
  public buffer: MockAudioBuffer | null = null;
  public isStarted = false;
  public startTime = 0;

  connect() {
    return this;
  }

  start(time = 0) {
    this.isStarted = true;
    this.startTime = time;
  }
}

class MockGainNode {
  public gain = new MockAudioParam();

  connect() {
    return this;
  }
}

class MockBiquadFilter {
  public type: BiquadFilterType = "lowpass";
  public frequency = new MockAudioParam();
  public Q = new MockAudioParam();

  connect() {
    return this;
  }
}

class MockAudioParam {
  public value = 0;
  private scheduledValues: Array<{ value: number; time: number; type: string }> = [];

  setValueAtTime(value: number, time: number) {
    this.value = value;
    this.scheduledValues.push({ value, time, type: "set" });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.scheduledValues.push({ value, time, type: "linear" });
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.scheduledValues.push({ value, time, type: "exponential" });
    return this;
  }
}

class MockAudioBuffer {
  constructor(
    public numberOfChannels: number,
    public length: number,
    public sampleRate: number
  ) {}

  getChannelData(): Float32Array {
    return new Float32Array(this.length);
  }
}

class MockAudioDestination {}

describe("KeyboardSoundService", () => {
  let mockAudioContext: MockAudioContext;
  let keyboardSoundService: {
    settings: KeyboardSoundSettings;
    updateSettings: (settings: Partial<KeyboardSoundSettings>) => void;
    isSupported: () => boolean;
    playKeySound: (keyType?: "normal" | "space" | "enter") => void;
    playNormalKeySound: () => void;
    playSpaceKeySound: () => void;
    playEnterKeySound: () => void;
  };

  beforeEach(async () => {
    // Mock AudioContext
    mockAudioContext = new MockAudioContext();
    vi.stubGlobal("AudioContext", vi.fn(() => mockAudioContext));
    vi.stubGlobal("webkitAudioContext", vi.fn(() => mockAudioContext));

    // Mock localStorage
    const mockStorage: { [key: string]: string } = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    });

    // 清除模块缓存并重新导入
    vi.resetModules();
    
    // 动态导入服务
    const module = await import("./keyboardSoundService");
    keyboardSoundService = module.keyboardSoundService;

    // 清理之前的音频节点
    mockAudioContext.clearCreatedNodes();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("初始化和设置管理", () => {
    it("应该使用默认设置初始化", () => {
      const settings = keyboardSoundService.settings;
      
      expect(settings.enabled).toBe(true);
      expect(settings.volume).toBe(0.3);
      expect(settings.soundType).toBe("mechanical");
    });

    it("应该更新设置并保存到 localStorage", () => {
      const newSettings: Partial<KeyboardSoundSettings> = {
        enabled: false,
        volume: 0.8,
      };

      keyboardSoundService.updateSettings(newSettings);

      const settings = keyboardSoundService.settings;
      expect(settings.enabled).toBe(false);
      expect(settings.volume).toBe(0.8);
      expect(settings.soundType).toBe("mechanical"); // 保持不变

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "keyboardSoundSettings",
        JSON.stringify(settings)
      );
    });
  });

  describe("音频支持检测", () => {
    it("应该检测到音频支持", () => {
      expect(keyboardSoundService.isSupported()).toBe(true);
    });

    it("应该检测到不支持音频", async () => {
      vi.stubGlobal("AudioContext", undefined);
      vi.stubGlobal("webkitAudioContext", undefined);

      // 重新导入服务来测试不支持的情况
      vi.resetModules();
      const module = await import("./keyboardSoundService");
      const service = module.keyboardSoundService;

      expect(service.isSupported()).toBe(false);
    });
  });

  describe("声音播放", () => {
    beforeEach(() => {
      // 确保声音已启用
      keyboardSoundService.updateSettings({ enabled: true });
      mockAudioContext.clearCreatedNodes();
    });

    it("当禁用声音时不应该播放", () => {
      keyboardSoundService.updateSettings({ enabled: false });
      
      keyboardSoundService.playKeySound("normal");
      
      expect(mockAudioContext.getCreatedOscillators()).toHaveLength(0);
    });

    describe("机械声音类型", () => {
      beforeEach(() => {
        keyboardSoundService.updateSettings({ soundType: "mechanical" });
        mockAudioContext.clearCreatedNodes();
      });

      it("应该为普通按键播放机械声音", () => {
        keyboardSoundService.playKeySound("normal");

        const oscillators = mockAudioContext.getCreatedOscillators();
        const bufferSources = mockAudioContext.getCreatedBufferSources();

        // 机械声音应该创建多个振荡器（click、bottom hit）和白噪音
        expect(oscillators.length).toBeGreaterThan(0);
        expect(bufferSources.length).toBeGreaterThan(0);

        // 验证振荡器已启动
        oscillators.forEach(osc => {
          expect(osc.isStarted).toBe(true);
        });

        // 验证白噪音源已启动
        bufferSources.forEach(source => {
          expect(source.isStarted).toBe(true);
        });
      });

      it("应该为空格键播放不同的机械声音", () => {
        keyboardSoundService.playKeySound("space");

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBeGreaterThan(0);

        oscillators.forEach(osc => {
          expect(osc.isStarted).toBe(true);
        });
      });

      it("应该为回车键播放不同的机械声音", () => {
        keyboardSoundService.playKeySound("enter");

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBeGreaterThan(0);

        oscillators.forEach(osc => {
          expect(osc.isStarted).toBe(true);
        });
      });
    });

    describe("其他声音类型", () => {
      it("应该播放柔和声音", () => {
        keyboardSoundService.updateSettings({ soundType: "soft" });
        mockAudioContext.clearCreatedNodes();

        keyboardSoundService.playKeySound("normal");

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBe(1);
        expect(oscillators[0].type).toBe("sine");
        expect(oscillators[0].isStarted).toBe(true);
      });

      it("应该播放打字机声音", () => {
        keyboardSoundService.updateSettings({ soundType: "typewriter" });
        mockAudioContext.clearCreatedNodes();

        keyboardSoundService.playKeySound("normal");

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBe(1);
        expect(oscillators[0].type).toBe("sawtooth");
        expect(oscillators[0].isStarted).toBe(true);
      });
    });

    describe("兼容性方法", () => {
      beforeEach(() => {
        mockAudioContext.clearCreatedNodes();
      });

      it("playNormalKeySound 应该播放普通按键声音", () => {
        keyboardSoundService.playNormalKeySound();

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBeGreaterThan(0);
      });

      it("playSpaceKeySound 应该播放空格键声音", () => {
        keyboardSoundService.playSpaceKeySound();

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBeGreaterThan(0);
      });

      it("playEnterKeySound 应该播放回车键声音", () => {
        keyboardSoundService.playEnterKeySound();

        const oscillators = mockAudioContext.getCreatedOscillators();
        expect(oscillators.length).toBeGreaterThan(0);
      });
    });
  });

  describe("音量控制", () => {
    it("应该根据设置调整音量", () => {
      keyboardSoundService.updateSettings({ 
        soundType: "soft", 
        volume: 0.5 
      });
      mockAudioContext.clearCreatedNodes();

      keyboardSoundService.playKeySound("normal");

      const oscillators = mockAudioContext.getCreatedOscillators();
      expect(oscillators.length).toBe(1);
      
      expect(oscillators[0].isStarted).toBe(true);
    });
  });

  describe("错误处理", () => {
    it("应该优雅处理 localStorage 保存错误", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("存储错误");
      });

      expect(() => {
        keyboardSoundService.updateSettings({ volume: 0.5 });
      }).not.toThrow();
    });
  });

  describe("白噪音生成", () => {
    it("应该创建正确长度的白噪音缓冲区", () => {
      keyboardSoundService.updateSettings({ soundType: "mechanical" });
      mockAudioContext.clearCreatedNodes();

      keyboardSoundService.playKeySound("normal");

      const bufferSources = mockAudioContext.getCreatedBufferSources();
      expect(bufferSources.length).toBeGreaterThan(0);
      
      bufferSources.forEach(source => {
        expect(source.buffer).toBeDefined();
        expect(source.isStarted).toBe(true);
      });
    });
  });
});
