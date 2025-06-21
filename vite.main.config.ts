import { defineConfig } from 'vite';
import path from 'node:path';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/main.ts',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', 'path', 'node:path'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: false, // 关闭压缩以便调试
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
