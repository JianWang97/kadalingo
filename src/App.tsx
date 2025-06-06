import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* 主要内容卡片 */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 原有的主卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🚀 Electron + React + Vite
          </h1>
          <p className="text-gray-600 mb-6">
            欢迎使用你的 Electron React 应用！
          </p>
          
          <div className="mb-6">
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              点击次数: {count}
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              编辑 <code className="bg-gray-100 px-2 py-1 rounded text-xs">src/App.tsx</code> 并保存以测试热重载功能
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Electron</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">React</span>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Vite</span>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">TypeScript</span>
              <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Tailwind CSS</span>
            </div>
          </div>
        </div>

        {/* 渐变色示例卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎨 Tailwind 渐变色示例
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 水平渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white font-semibold">紫色到粉色 →</span>
            </div>
            
            {/* 垂直渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold">蓝色垂直 ↓</span>
            </div>
            
            {/* 对角线渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-semibold">绿色对角 ↘</span>
            </div>
            
            {/* 三色渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-r from-red-400 via-yellow-400 to-pink-400 flex items-center justify-center">
              <span className="text-white font-semibold">三色渐变</span>
            </div>
            
            {/* 彩虹渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-semibold">彩虹渐变</span>
            </div>
            
            {/* 暗色渐变 */}
            <div className="h-24 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-white font-semibold">暗色渐变</span>
            </div>
            
          </div>

          {/* 渐变按钮示例 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <button className="py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
              渐变按钮 1
            </button>
            
            <button className="py-3 px-6 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
              渐变按钮 2
            </button>
            
            <button className="py-3 px-6 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-white font-semibold hover:from-emerald-500 hover:to-cyan-500 transition-all duration-200">
              渐变按钮 3
            </button>
            
            <button className="py-3 px-6 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 text-white font-semibold hover:from-orange-500 hover:to-red-500 transition-all duration-200">
              渐变按钮 4
            </button>
            
          </div>
        </div>

        {/* 渐变文字示例 */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            渐变文字效果
          </h2>
          <p className="text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent font-semibold">
            这是一个渐变色的文字示例
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;
