import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Electron + React + Vite</h1>
        <p>欢迎使用你的 Electron React 应用！</p>
        
        <div className="counter-section">
          <button onClick={() => setCount(count + 1)}>
            点击次数: {count}
          </button>
        </div>
        
        <div className="info-section">
          <p>
            编辑 <code>src/App.tsx</code> 并保存以测试热重载功能
          </p>
          <div className="tech-stack">
            <span className="tech-badge">Electron</span>
            <span className="tech-badge">React</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">TypeScript</span>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
