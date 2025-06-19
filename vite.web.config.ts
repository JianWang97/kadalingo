import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { join, resolve } from "path";
import fs from "fs";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    {
      name: "rename-index-web-html",
      closeBundle() {
        const dist = resolve(__dirname, "dist-web");
        const src = join(dist, "index.web.html");
        const dest = join(dist, "index.html");
        if (fs.existsSync(src)) {
          fs.renameSync(src, dest);
        }
      },
    },
  ] as PluginOption[],
  root: ".", // 设置根目录
  base: "./", // 设置为相对路径，便于部署
  build: {
    outDir: "dist-web", // 与 electron 构建目录区分
    rollupOptions: {
      input: resolve(__dirname, "index.web.html"), // 指定 web 版本的 HTML 入口
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          // 保持 .ico 文件名不变
          if (assetInfo.name && assetInfo.name.endsWith(".ico")) {
            return "[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  optimizeDeps: {
    include: ["scheduler"],
  },
  define: {
    // 在 web 环境中禁用 Electron API
    __IS_WEB__: JSON.stringify(true),
  },
  server: {
    port: 3000,
    host: true,
  },
});
