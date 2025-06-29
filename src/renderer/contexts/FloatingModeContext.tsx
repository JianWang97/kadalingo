import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FloatingModeSettings {
  /** 透明度 (0.0-1.0) */
  opacity: number;
}

interface FloatingModeContextType {
  /** 当前设置 */
  settings: FloatingModeSettings;
  /** 更新设置 */
  updateSettings: (newSettings: Partial<FloatingModeSettings>) => void;
}

const FloatingModeContext = createContext<FloatingModeContextType | null>(null);

interface FloatingModeProviderProps {
  children: ReactNode;
}

export const FloatingModeProvider: React.FC<FloatingModeProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<FloatingModeSettings>(() => {
    // 从localStorage读取保存的设置
    const saved = localStorage.getItem('floatingModeSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // 如果解析失败，使用默认值
      }
    }
    return {
      opacity: 0.3
    };
  });

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('floatingModeSettings', JSON.stringify(settings));
    // 更新CSS自定义属性
    document.documentElement.style.setProperty('--floating-opacity', settings.opacity.toString());
  }, [settings]);

  const updateSettings = (newSettings: Partial<FloatingModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const contextValue: FloatingModeContextType = {
    settings,
    updateSettings,
  };

  return (
    <FloatingModeContext.Provider value={contextValue}>
      {children}
    </FloatingModeContext.Provider>
  );
};

export const useFloatingModeSettings = (): FloatingModeContextType => {
  const context = useContext(FloatingModeContext);
  if (!context) {
    throw new Error('useFloatingModeSettings must be used within a FloatingModeProvider');
  }
  return context;
};

export default FloatingModeProvider;
