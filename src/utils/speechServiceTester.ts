import { speechService } from "../services/speechService";

/**
 * 语音服务测试工具
 * 用于测试语音服务的各种功能
 */
export class SpeechServiceTester {
  /**
   * 测试基本语音播放功能
   */
  static async testBasicSpeech(): Promise<void> {
    console.log("测试基本语音播放功能...");

    try {
      // 测试英文播放
      console.log("播放英文测试...");
      await speechService.speakEnglish("Hello, this is a test.");

      // 等待一秒
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 测试中文播放
      console.log("播放中文测试...");
      await speechService.speakChinese("这是一个中文测试。");

      console.log("基本语音播放测试完成！");
    } catch (error) {
      console.error("基本语音播放测试失败:", error);
    }
  }

  /**
   * 测试语音设置功能
   */
  static testSettings(): void {
    console.log("测试语音设置功能...");

    // 获取当前设置
    const currentSettings = speechService.settings;
    console.log("当前设置:", currentSettings);

    // 更新设置
    speechService.updateSettings({
      rate: 1.5,
      volume: 0.6,
      autoPlay: false,
    });

    const updatedSettings = speechService.settings;
    console.log("更新后设置:", updatedSettings);

    // 恢复默认设置
    speechService.updateSettings({
      rate: 0.9,
      volume: 0.8,
      autoPlay: true,
    });

    console.log("语音设置测试完成！");
  }

  /**
   * 测试浏览器支持情况
   */
  static testBrowserSupport(): void {
    console.log("测试浏览器支持情况...");

    const isSupported = speechService.isSupported();
    console.log("语音合成支持:", isSupported);

    if (isSupported) {
      const voices = speechService.getVoices();
      console.log("可用语音数量:", voices.length);
      console.log(
        "可用语音列表:",
        voices.map((voice) => ({
          name: voice.name,
          lang: voice.lang,
          localService: voice.localService,
        }))
      );
    }

    console.log("浏览器支持测试完成！");
  }

  /**
   * 测试播放状态监听
   */
  static testPlayStateListener(): void {
    console.log("测试播放状态监听...");

    const handlePlayStateChange = (isPlaying: boolean) => {
      console.log("播放状态变化:", isPlaying ? "开始播放" : "停止播放");
    };

    // 注册监听器
    speechService.onPlayStateChange(handlePlayStateChange);

    // 播放测试
    speechService
      .speakEnglish("Testing play state listener.")
      .then(() => {
        console.log("播放状态监听测试完成！");
        // 移除监听器
        speechService.offPlayStateChange(handlePlayStateChange);
      })
      .catch((error) => {
        console.error("播放状态监听测试失败:", error);
        speechService.offPlayStateChange(handlePlayStateChange);
      });
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    console.log("开始运行语音服务全套测试...");

    this.testBrowserSupport();
    this.testSettings();
    this.testPlayStateListener();

    // 最后测试基本播放功能
    await this.testBasicSpeech();

    console.log("所有语音服务测试完成！");
  }
}

// 在开发环境中，将测试工具挂载到 window 对象上
if (process.env.NODE_ENV === "development") {
  (
    window as typeof window & { speechTester: typeof SpeechServiceTester }
  ).speechTester = SpeechServiceTester;
}

export default SpeechServiceTester;
