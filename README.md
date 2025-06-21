# 咔哒英语

🚀 基于 Electron + React + TypeScript 构建的语言学习桌面应用程序

## 功能特色

- 📝 **句子翻译练习** - 中英文互译，支持填空和完整翻译模式
- 🔊 **语音合成** - TTS语音播放功能
- 📊 **学习统计** - 进度跟踪和成绩分析
- 🎨 **Material Design 3** - 现代化界面设计
- 💾 **本地存储** - 基于 IndexedDB 的离线数据存储

## 技术栈

- Electron + React + TypeScript
- Vite + Electron Forge
- Tailwind CSS
- IndexedDB (Dexie)

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
# 打包应用
npm run package

# 构建安装包
npm run make
```

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

GPL-3.0 License

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！
