import React from 'react';
import { Header, Card, Counter } from './components';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 页面标题 */}
        <Header 
          title="Electron + React + Tailwind" 
          subtitle="🎉 现代化的桌面应用开发模板"
        />
        
        {/* 计数器组件 */}
        <Counter />
        
        {/* 技术栈介绍 */}
        <Card title="🛠️ 技术栈">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">前端技术</h3>
              <ul className="space-y-1 text-sm">
                <li>⚛️ React 18 - 现代化 UI 库</li>
                <li>🎨 Tailwind CSS 4 - 实用优先的 CSS 框架</li>
                <li>📘 TypeScript - 类型安全</li>
                <li>⚡ Vite - 快速构建工具</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">桌面应用技术</h3>
              <ul className="space-y-1 text-sm">
                <li>🖥️ Electron - 跨平台桌面应用框架</li>
                <li>🔨 Electron Forge - 完整的工具链</li>
                <li>🔒 安全的预加载脚本</li>
                <li>📦 多平台打包支持</li>
              </ul>
            </div>
          </div>
        </Card>
        
        {/* 特性介绍 */}
        <Card title="✨ 主要特性">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-semibold mb-1">快速开发</h4>
              <p className="text-sm">热重载、TypeScript 支持，开发体验极佳</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-semibold mb-1">现代化 UI</h4>
              <p className="text-sm">Tailwind CSS 提供美观的界面设计</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">📦</div>
              <h4 className="font-semibold mb-1">跨平台</h4>
              <p className="text-sm">一次开发，支持 Windows、macOS、Linux</p>
            </div>
          </div>
        </Card>
        
        {/* 快速开始 */}
        <Card title="🎯 快速开始">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">开发命令</h4>
              <div className="bg-gray-100 rounded p-3 font-mono text-sm space-y-1">
                <div><span className="text-blue-600">npm run dev</span> - 启动开发服务器</div>
                <div><span className="text-blue-600">npm run build</span> - 构建应用</div>
                <div><span className="text-blue-600">npm run lint</span> - 代码检查</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">项目结构</h4>
              <div className="bg-gray-100 rounded p-3 font-mono text-xs">
                <div>src/</div>
                <div>├── components/     # React 组件</div>
                <div>├── App.tsx        # 主应用组件</div>
                <div>├── main.ts        # Electron 主进程</div>
                <div>├── preload.ts     # 预加载脚本</div>
                <div>└── renderer.tsx   # 渲染进程入口</div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* 版权信息 */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>
            Built with ❤️ using Electron Forge + React + Tailwind CSS
          </p>
          <p className="mt-1">
            MIT License - Feel free to use this template for your projects!
          </p>
        </div>
        
      </div>
    </div>
  );
}

export default App;