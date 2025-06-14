# 语音服务 (Speech Service)

语音服务是一个全局的语音合成管理服务，用于统一管理应用程序中的所有语音功能。

## 特性

- 🎯 **全局统一配置** - 所有语音设置在一处管理
- 🔧 **灵活的设置选项** - 支持语音速度、音量、自动播放等设置
- 💾 **持久化设置** - 设置自动保存到本地存储
- 🎭 **多语言支持** - 支持中文和英文语音合成
- 🎮 **播放状态管理** - 实时监听和管理播放状态
- 🔒 **类型安全** - 完整的 TypeScript 类型支持

## 架构设计

### 1. 服务层 (Service Layer)
- `speechService.ts` - 核心语音服务实现
- 单例模式，确保全局唯一实例
- 提供底层语音合成 API 封装

### 2. 上下文层 (Context Layer)
- `SpeechContext.tsx` - React 上下文提供者
- 将服务层功能包装为 React hooks
- 管理组件级别的状态同步

### 3. 组件层 (Component Layer)
- `SpeechSettings.tsx` - 语音设置组件
- 可重用的设置界面组件
- 自动同步全局设置

## 使用方法

### 1. 基础设置

在应用程序根组件中包装 `SpeechProvider`：

```tsx
import { SpeechProvider } from './contexts/SpeechContext';

function App() {
  return (
    <SpeechProvider>
      {/* 你的应用组件 */}
    </SpeechProvider>
  );
}
```

### 2. 在组件中使用语音功能

```tsx
import { useSpeech } from '../contexts/SpeechContext';

function MyComponent() {
  const { speakEnglish, speakChinese, isPlaying, stop } = useSpeech();

  const handlePlayEnglish = () => {
    speakEnglish('Hello, world!');
  };

  const handlePlayChinese = () => {
    speakChinese('你好，世界！');
  };

  return (
    <div>
      <button onClick={handlePlayEnglish} disabled={isPlaying}>
        播放英文
      </button>
      <button onClick={handlePlayChinese} disabled={isPlaying}>
        播放中文
      </button>
      <button onClick={stop}>停止播放</button>
    </div>
  );
}
```

### 3. 添加设置界面

```tsx
import { SpeechSettings } from '../components';

function SettingsPage() {
  return (
    <div>
      <h2>语音设置</h2>
      <SpeechSettings />
    </div>
  );
}
```

### 4. 直接使用服务 (高级用法)

```tsx
import { speechService } from '../services/speechService';

// 直接播放
speechService.speakEnglish('Direct usage example');

// 监听播放状态
speechService.onPlayStateChange((isPlaying) => {
  console.log('播放状态:', isPlaying);
});

// 更新设置
speechService.updateSettings({
  rate: 1.2,
  volume: 0.9,
  autoPlay: false,
});
```

## API 文档

### SpeechService 类

#### 属性

- `settings: SpeechSettings` - 当前语音设置
- `isPlaying: boolean` - 当前播放状态

#### 方法

- `speakChinese(text: string): Promise<void>` - 播放中文文本
- `speakEnglish(text: string): Promise<void>` - 播放英文文本
- `speak(text: string, language: 'zh-CN' | 'en-US'): Promise<void>` - 播放指定语言的文本
- `stop(): void` - 停止当前播放
- `updateSettings(settings: Partial<SpeechSettings>): void` - 更新设置
- `isSupported(): boolean` - 检查浏览器是否支持语音合成
- `getVoices(): SpeechSynthesisVoice[]` - 获取可用的语音列表

#### 事件监听

- `onPlayStateChange(callback: (isPlaying: boolean) => void): void` - 监听播放状态变化
- `offPlayStateChange(callback: (isPlaying: boolean) => void): void` - 移除播放状态监听器

### SpeechSettings 接口

```typescript
interface SpeechSettings {
  rate: number;      // 语音速度 (0.5-2.0)
  volume: number;    // 语音音量 (0.0-1.0)
  autoPlay: boolean; // 自动播放英文
  enabled: boolean;  // 是否启用语音功能
}
```

### useSpeech Hook

```typescript
interface SpeechContextType {
  settings: SpeechSettings;
  isPlaying: boolean;
  updateSettings: (newSettings: Partial<SpeechSettings>) => void;
  speakChinese: (text: string) => Promise<void>;
  speakEnglish: (text: string) => Promise<void>;
  stop: () => void;
  isSupported: boolean;
}
```

## 开发和测试

在开发环境中，语音服务提供了测试工具：

```javascript
// 在浏览器控制台中运行
window.speechTester.runAllTests();

// 或者单独测试
window.speechTester.testBasicSpeech();
window.speechTester.testSettings();
window.speechTester.testBrowserSupport();
```

## 配置选项

### 默认设置

```typescript
const defaultSettings = {
  rate: 0.9,        // 语音速度稍慢一点，便于理解
  volume: 0.8,      // 音量适中
  autoPlay: true,   // 默认启用自动播放
  enabled: true,    // 默认启用语音功能
};
```

### 本地存储

设置会自动保存到 `localStorage` 中的 `speechSettings` 键，应用重启后会自动恢复。

## 浏览器兼容性

- ✅ Chrome 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Edge 14+
- ❌ Internet Explorer (不支持)

## 注意事项

1. **用户交互要求**: 某些浏览器要求用户先进行交互操作后才能播放语音
2. **网络连接**: 某些语音可能需要网络连接才能使用
3. **权限设置**: 确保浏览器允许播放音频
4. **性能考虑**: 避免同时播放多个语音，服务会自动停止之前的播放

## 故障排除

### 常见问题

1. **语音不播放**
   - 检查浏览器是否支持 Web Speech API
   - 确保用户已进行过交互操作
   - 检查浏览器音频设置

2. **设置不保存**
   - 检查浏览器是否支持 localStorage
   - 确保没有禁用本地存储

3. **播放状态不更新**
   - 检查是否正确注册了状态监听器
   - 确保在组件卸载时移除监听器

### 调试方法

```javascript
// 检查服务状态
console.log('语音服务状态:', {
  settings: speechService.settings,
  isPlaying: speechService.isPlaying,
  isSupported: speechService.isSupported(),
  voices: speechService.getVoices().length,
});
```
