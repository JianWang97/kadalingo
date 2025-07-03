import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { join, resolve } from "path";
import fs from "fs";
import packageJson from "./package.json";

// https://vitejs.dev/config
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
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
      // 定义开发模式标识
      __DEV__: JSON.stringify(!isProduction),
      // 注入应用版本号
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
