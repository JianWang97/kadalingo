import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()] as PluginOption[],
  root: '.', // 设置根目录
  base: './', // 设置为相对路径，便于部署
  build: {
    outDir: 'dist-web', // 与 electron 构建目录区分
    rollupOptions: {
      input: resolve(__dirname, 'index.web.html'), // 指定 web 版本的 HTML 入口
      external: [],
    },
  },
  optimizeDeps: {
    include: ['scheduler'],
  },
  define: {
    // 在 web 环境中禁用 Electron API
    '__IS_WEB__': JSON.stringify(true),
  },
  server: {
    port: 3000,
    host: true,
  },
});