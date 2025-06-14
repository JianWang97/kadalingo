# GitHub Copilot 指令

## 项目概述
这是一个使用 Electron Forge、TypeScript 和 Tailwind CSS 构建的 Electron React 应用程序。该应用程序是一个用于语言学习的句子练习工具。

## 项目结构
- **主进程**: `src/main.ts` - Electron 主进程
- **预加载脚本**: `src/preload.ts` - 主进程和渲染进程之间的安全桥梁
- **渲染进程**: `src/renderer.tsx` - React 应用程序入口
- **组件**: `src/components/` - 可重用的 React 组件
- **数据**: `src/data/` - 应用程序数据和类型
- **页面**: `src/page/` - 应用程序页面/屏幕

## 技术栈
- **Electron Forge**: 用于构建和打包
- **React**: 前端框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **Vite**: 构建工具和开发服务器

## 开发规范

### 文件命名约定
- React 组件使用 PascalCase（例如：`SentencePractice.tsx`）
- 工具文件和数据文件使用 camelCase（例如：`sentences.ts`）
- 配置文件使用 kebab-case（例如：`vite.main.config.ts`）

### 代码风格
- 所有源文件使用 TypeScript
- 遵循 React 函数组件模式和 hooks
- 使用 Tailwind CSS 类进行样式设置
- 保持主进程、预加载脚本和渲染进程的适当分离
- 添加新的功能时，尽可能的将其封装为独立的组件或模块

## 核心功能
- 句子练习功能
- 使用 Tailwind CSS 的现代 UI
- 自定义标题栏组件
- 响应式设计
