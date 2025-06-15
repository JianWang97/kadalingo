# 设置组件重构说明

## 概述

将原来的 `SpeechSettings` 组件重构为更通用的 `Settings` 组件，以便未来添加更多的应用设置功能。

## 重构内容

### 新增文件
- `src/components/Settings.tsx` - 新的统一设置组件

### 修改文件
- `src/components/SpeechSettings.tsx` - 改为重新导出 Settings 组件，保持向后兼容性
- `src/components/index.ts` - 添加新的 Settings 组件导出
- `src/page/SentencePractice.tsx` - 更新组件引用

## 新的设置组件结构

新的 `Settings` 组件按功能模块组织设置：

### 1. 语音设置
- 启用/禁用语音功能
- 自动播放英文
- 语音速度控制
- 音量控制

### 2. 界面设置
- 浮窗透明度设置

### 3. 键盘声音设置
- 启用/禁用按键声音
- 声音类型选择
- 按键音量控制

## 向后兼容性

- 保留了原有的 `SpeechSettings` 组件名称，现在它重新导出 `Settings` 组件
- 所有现有代码可以无缝迁移，无需立即修改
- 推荐新代码使用 `Settings` 组件

## 未来扩展

这个新结构便于添加更多设置功能，例如：
- 主题设置
- 快捷键配置
- 学习进度设置
- 数据同步设置
- 等等

## 使用方式

```tsx
import { Settings } from '../components';

// 完整设置面板
<Settings />

// 紧凑模式（只显示设置按钮）
<Settings 
  compact={true} 
  onOpenSettings={() => setIsDrawerOpen(true)} 
/>
```

## 注意事项

- 组件接口保持不变，所有原有的 props 都继续支持
- 设置的分组使代码更易维护和扩展
- 保持了原有的设计风格和用户体验
