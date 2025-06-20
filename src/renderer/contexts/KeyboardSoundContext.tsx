import React, { createContext, useContext, useState, ReactNode } from 'react';
import { keyboardSoundService, KeyboardSoundSettings } from '../services/keyboardSoundService';

interface KeyboardSoundContextType {
  /** 当前设置 */
  settings: KeyboardSoundSettings;
  /** 更新设置 */
  updateSettings: (newSettings: Partial<KeyboardSoundSettings>) => void;
  /** 播放按键声音 */
  playKeySound: (type: "normal" | "space" | "enter") => void;
  /** 是否支持音频功能 */
  isSupported: boolean;
}

const KeyboardSoundContext = createContext<KeyboardSoundContextType | null>(null);

interface KeyboardSoundProviderProps {
  children: ReactNode;
}

export const KeyboardSoundProvider: React.FC<KeyboardSoundProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<KeyboardSoundSettings>(keyboardSoundService.settings);
  const [isSupported] = useState(keyboardSoundService.isSupported());

  const updateSettings = (newSettings: Partial<KeyboardSoundSettings>) => {
    keyboardSoundService.updateSettings(newSettings);
    setSettings(keyboardSoundService.settings);
  };

  const playKeySound = (type: "normal" | "space" | "enter") => {
    keyboardSoundService.playKeySound(type);
  };

  const contextValue: KeyboardSoundContextType = {
    settings,
    updateSettings,
    playKeySound,
    isSupported,
  };

  return (
    <KeyboardSoundContext.Provider value={contextValue}>
      {children}
    </KeyboardSoundContext.Provider>
  );
};

export const useKeyboardSound = (): KeyboardSoundContextType => {
  const context = useContext(KeyboardSoundContext);
  if (!context) {
    throw new Error('useKeyboardSound must be used within a KeyboardSoundProvider');
  }
  return context;
};

export default KeyboardSoundProvider;
