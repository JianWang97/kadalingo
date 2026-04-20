# 咔哒英语

🚀 基于 Electron + React + TypeScript 构建的语言学习桌面应用程序

## 功能特色

- 📝 **句子翻译练习** - 中英文互译
- 📝 **生/错词本** - 记录生错词 
- 🔊 **语音合成** - TTS语音播放功能
- 🎨 **Material Design 3** - 现代化界面设计
- 💾 **本地存储** - 基于 IndexedDB 的离线数据存储

## 应用截图

### 课程中心
![课程中心](screenshots/20250622-162426.jpg)

### 练习模式
![练习模式](screenshots/20250622-162439.jpg)

### 浮窗模式
![浮窗模式](screenshots/20250622-162442.jpg)

### 设置页面
![设置页面](screenshots/20250622-162446.jpg)


### AI课程生成
![AI课程生成](screenshots/ai-course-generation.png)

## 技术栈

- Electron + React + TypeScript
- Vite
- Tailwind CSS
- IndexedDB (Dexie)

## 平台支持

- 🪟 **Windows** - Windows 10/11 (x64)
  - NSIS 安装包
  - 便携版
- 🍎 **macOS** - macOS 10.13+
  - Intel (x64) 和 Apple Silicon (arm64)
  - DMG 安装包
  - ZIP 压缩包
- 🐧 **Linux** - Ubuntu/Debian/Fedora (x64)
  - AppImage
  - DEB 包
  - RPM 包

详细的 macOS 打包说明请参考 [docs/MAC_PACKAGING.md](docs/MAC_PACKAGING.md)

## 快速开始

### 环境要求
- Node.js >= 20.0.0
- npm >= 8.0.0

### 安装运行
```bash
# 克隆项目
git clone https://github.com/JianWang97/kadalingo.git
cd kadalingo

# 安装依赖
npm install

# 启动应用
npm start
```

### 构建打包
```bash
# 构建应用（通用）
npm run build

# 生成安装包（通用）
npm run dist

# 仅构建 macOS 版本
npm run build:mac

# 生成目录包（不生成安装包，用于测试）
npm run dist:dir
```

> **macOS 构建说明**: 首次构建需要生成 `.icns` 图标文件，详见 [docs/MAC_ICON_GENERATION.md](docs/MAC_ICON_GENERATION.md)

## 项目结构

```
src/
├── main/               # Electron 主进程
├── renderer/           # React 渲染进程
├── components/         # React 组件
├── data/              # 数据管理
├── hooks/             # 自定义 Hooks
├── page/              # 页面组件
└── services/          # 业务服务
```

## 开发

```bash
# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 许可证

 Apache License

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！
