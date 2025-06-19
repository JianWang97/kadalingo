# Web 版本部署指南

## 概述

你的 `vite + electron-forge` 项目现在支持 Web 端部署！这意味着你可以将应用程序同时作为桌面应用和 Web 应用发布。

## 可用的构建命令

### Electron 版本（桌面应用）
```powershell
# 开发模式
npm run dev
# 或
npm start

# 构建 Electron 应用
npm run build
```

### Web 版本（浏览器应用）
```powershell
# Web 开发服务器（推荐用于开发测试）
npm run web:dev

# 构建 Web 静态文件
npm run web:build

# 预览构建的 Web 版本
npm run web:preview
```

## Web 版本特性

### ✅ 完全兼容的功能
- 所有 React 组件和页面
- Tailwind CSS 样式
- 句子练习功能
- 课程管理
- IndexedDB 数据存储
- Material Design 3 UI

### ⚠️ 仅 Electron 版本支持的功能
- 自定义标题栏和窗口控制
- 小窗浮动模式
- 全局快捷键
- 系统托盘集成
- 文件系统直接访问

### 🔧 自动处理的兼容性
- 组件会自动检测运行环境
- Electron API 调用在 Web 环境中会被忽略
- 标题栏在 Web 版本中自动隐藏窗口控制按钮

## 部署 Web 版本

### 构建静态文件
```powershell
npm run web:build
```

构建完成后，静态文件会生成在 `dist-web/` 目录中。

### 部署选项

#### 1. 静态文件托管服务
将 `dist-web/` 目录的内容上传到：
- Netlify
- Vercel  
- GitHub Pages
- Azure Static Web Apps
- AWS S3 + CloudFront

#### 2. 自己的服务器
将 `dist-web/` 目录复制到你的 Web 服务器（如 Nginx、Apache）。

#### 3. 本地预览
```powershell
npm run web:preview
```

## 环境检测

项目中包含了环境检测工具 (`src/utils/environment.ts`)：

```typescript
import { isElectron, isWeb, getAppTitle } from '../utils/environment';

// 检测当前环境
if (isElectron()) {
  // Electron 特定代码
} else if (isWeb()) {
  // Web 特定代码
}
```

## 注意事项

1. **数据存储**: Web 版本使用 IndexedDB，数据存储在浏览器本地
2. **跨域**: 如果需要访问外部 API，注意 CORS 配置
3. **性能**: Web 版本可能在某些复杂操作上性能略低于桌面版
4. **功能限制**: 一些系统级功能（如文件系统访问）在 Web 版本中不可用

## 开发建议

1. **优先开发 Web 兼容功能**: 这样可以确保两个版本都能正常工作
2. **使用环境检测**: 对于 Electron 特定功能，始终先检测环境
3. **测试两种环境**: 在开发过程中定期测试两个版本

## 示例部署脚本

```powershell
# 完整的部署流程
npm run clean        # 清理旧构建文件
npm run web:build    # 构建 Web 版本
npm run build        # 构建 Electron 版本

# 现在你有了：
# - dist-web/     (Web 静态文件)  
# - out/          (Electron 安装包)
```

这样你就可以同时维护和发布桌面版和 Web 版的应用了！
