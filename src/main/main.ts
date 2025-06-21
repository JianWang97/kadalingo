import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import path from 'node:path';

let mainWindow: BrowserWindow;

// IPC 处理程序
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// 小飘窗模式切换
let isFloatingMode = false;
let originalBounds: { x: number, y: number, width: number, height: number } | null = null;
let originalAlwaysOnTop = false;

ipcMain.handle('toggle-floating-mode', () => {
  if (!mainWindow) return;
  
  if (!isFloatingMode) {
    // 保存当前窗口状态
    originalBounds = mainWindow.getBounds();
    originalAlwaysOnTop = mainWindow.isAlwaysOnTop();
    
    // 获取屏幕工作区域
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // 设置长条形飘窗尺寸
    const floatingWidth = Math.min(500, screenWidth * 0.4);  // 最大不超过屏幕40%
    const floatingHeight = Math.min(280, screenHeight * 0.3); // 最大不超过屏幕30%
    
    // 定位到屏幕右上角，考虑任务栏
    const floatingX = screenWidth - floatingWidth - 20;
    const floatingY = 20;
    
    // 切换到长条飘窗模式
    mainWindow.setSize(floatingWidth, floatingHeight);
    mainWindow.setPosition(floatingX, floatingY);
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setResizable(true);
    
    // 设置最小尺寸限制
    mainWindow.setMinimumSize(300, 200);
    
    isFloatingMode = true;
  } else {
    // 恢复到正常模式
    if (originalBounds) {
      mainWindow.setBounds(originalBounds);
    }
    mainWindow.setAlwaysOnTop(originalAlwaysOnTop);
    mainWindow.setSkipTaskbar(false); // 默认恢复为显示在任务栏
    mainWindow.setResizable(true);
    
    // 恢复默认最小尺寸
    mainWindow.setMinimumSize(400, 300);
    
    isFloatingMode = false;
  }
  
  return isFloatingMode;
});

ipcMain.handle('is-floating-mode', () => {
  return isFloatingMode;
});


const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: '咔哒英语', // 设置窗口标题
    icon: path.join(__dirname, '../../assets/favicon.ico'), // 设置窗口图标
    frame: false, // 隐藏窗口边框和工具栏
    transparent: true, // 启用透明背景支持
    backgroundColor: '#00000000', // 设置完全透明的背景色
    minWidth: 400, // 设置最小宽度
    minHeight: 300, // 设置最小高度
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // 禁用沙盒模式以允许访问 IndexedDB
    },
  });

  // 在开发模式下使用开发服务器，在生产模式下加载本地文件
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  // 在生产环境下不打开开发工具，避免影响透明度
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // 清理全局快捷键
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 应用退出前清理全局快捷键
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
