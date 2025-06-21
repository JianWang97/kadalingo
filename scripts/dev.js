#!/usr/bin/env node

const { spawn } = require('child_process');

// 在 Windows 上需要使用 .cmd 后缀
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// 启动 Vite 开发服务器
const viteProcess = spawn(npxCmd, ['vite', '--config', 'vite.renderer.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// 等待几秒钟让 Vite 服务器启动
setTimeout(() => {
  // 构建主进程和预加载脚本
  const buildMain = spawn(npxCmd, ['vite', 'build', '--config', 'vite.main.config.ts', '--mode', 'development'], {
    stdio: 'inherit'
  });

  buildMain.on('close', (code) => {
    if (code === 0) {
      const buildPreload = spawn(npxCmd, ['vite', 'build', '--config', 'vite.preload.config.ts', '--mode', 'development'], {
        stdio: 'inherit'
      });

      buildPreload.on('close', (code) => {
        if (code === 0) {
          // 启动 Electron
          const electronProcess = spawn(npxCmd, ['electron', 'dist/main.js'], {
            stdio: 'inherit',
            env: { 
              ...process.env, 
              NODE_ENV: 'development',
              VITE_DEV_SERVER_URL: 'http://localhost:5173'
            }
          });

          electronProcess.on('close', () => {
            viteProcess.kill();
            process.exit(0);
          });
        }
      });
    }
  });
}, 3000);

// 清理进程
process.on('SIGINT', () => {
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});
