import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    root: 'src/renderer',
    plugins: [
      react(),
      ...(isProduction ? [visualizer({ open: true, filename: 'bundle-report.html', gzipSize: true, brotliSize: true })] : [])
    ] as PluginOption[],
    base: './',
    build: {
      outDir: '../../dist/renderer',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/renderer/index.html'),
        external: [],
      },
      // 只在生产环境中去除 console.log
      ...(isProduction && {
        minify: 'terser',
        terserOptions: {
          compress: {
            // 去除 console.log
            drop_console: true,
            // 去除 debugger
            drop_debugger: true,
            // 去除未使用的代码
            dead_code: true,
          },
          mangle: {
            // 混淆变量名
            toplevel: true,
          },
        },
      }),
    },
    optimizeDeps: {
      include: ['scheduler'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // 定义全局变量，用于代码中的条件编译
    define: {
      __DEV__: JSON.stringify(!isProduction),
    },
  };
});
