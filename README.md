# Electron + React + Vite 应用

这是一个使用 Electron Forge、React 和 Vite 构建的桌面应用程序。

## 🚀 技术栈

- **Electron**: 跨平台桌面应用框架
- **React**: 用户界面库
- **Vite**: 快速的前端构建工具
- **TypeScript**: 提供类型安全
- **Electron Forge**: Electron 应用的完整工具链

## 📦 项目结构

```
my-new-app/
├── src/
│   ├── App.tsx          # 主 React 组件
│   ├── App.css          # 应用样式
│   ├── renderer.tsx     # React 渲染器入口
│   ├── main.ts          # Electron 主进程
│   ├── preload.ts       # 预加载脚本
│   └── index.css        # 全局样式
├── index.html           # HTML 模板
├── package.json         # 项目依赖和脚本
├── tsconfig.json        # TypeScript 配置
├── forge.config.ts      # Electron Forge 配置
├── vite.main.config.ts  # 主进程 Vite 配置
├── vite.preload.config.ts # 预加载 Vite 配置
└── vite.renderer.config.ts # 渲染器 Vite 配置
```

## 🛠️ 开发命令

### 启动开发服务器
```bash
npm start
```

### 构建应用
```bash
npm run make
```

### 打包应用
```bash
npm run package
```

### 代码检查
```bash
npm run lint
```

## 🎯 功能特性

- ✅ React 18 支持
- ✅ TypeScript 支持
- ✅ 热重载开发
- ✅ 现代化 UI 设计
- ✅ 响应式布局
- ✅ Electron 安全最佳实践

## 🎨 自定义开发

### 添加新的 React 组件
在 `src/` 目录下创建新的组件文件，然后在 `App.tsx` 中导入使用。

### 修改样式
- 全局样式：编辑 `src/index.css`
- 组件样式：编辑 `src/App.css` 或创建新的 CSS 文件

### 配置 Electron
- 主进程配置：编辑 `src/main.ts`
- 窗口设置：在 `main.ts` 中的 `BrowserWindow` 配置

## 📱 打包发布

使用 Electron Forge 可以轻松打包为各种格式：

- Windows: `.exe` 安装包
- macOS: `.dmg` 或 `.app`
- Linux: `.deb`, `.rpm`, `.AppImage`

```bash
npm run make
```

## 🔧 常见问题

### Q: 如何添加新的依赖？
A: 使用 `npm install package-name` 或 `cnpm install package-name`

### Q: 如何调试 React 组件？
A: 启动应用后，按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Opt+I` (macOS) 打开开发者工具

### Q: 如何修改窗口大小或标题？
A: 编辑 `src/main.ts` 中的 `BrowserWindow` 配置

## 📄 许可证

MIT License
