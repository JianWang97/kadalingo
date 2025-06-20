import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { speechService, SpeechSettings } from '../services/speechService';

interface SpeechContextType {
  /** 当前语音设置 */
  settings: SpeechSettings;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 更新设置 */
  updateSettings: (newSettings: Partial<SpeechSettings>) => void;
  /** 播放中文 */
  speakChinese: (text: string) => Promise<void>;
  /** 播放英文 */
  speakEnglish: (text: string) => Promise<void>;
  /** 停止播放 */
  stop: () => void;
  /** 是否支持语音功能 */
  isSupported: boolean;
}

const SpeechContext = createContext<SpeechContextType | null>(null);

interface SpeechProviderProps {
  children: ReactNode;
}

export const SpeechProvider: React.FC<SpeechProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SpeechSettings>(speechService.settings);
  const [isPlaying, setIsPlaying] = useState(speechService.isPlaying);
  const [isSupported] = useState(speechService.isSupported());

  useEffect(() => {
    // 监听播放状态变化
    const handlePlayStateChange = (playing: boolean) => {
      setIsPlaying(playing);
    };

    speechService.onPlayStateChange(handlePlayStateChange);

    return () => {
      speechService.offPlayStateChange(handlePlayStateChange);
    };
  }, []);

  const updateSettings = (newSettings: Partial<SpeechSettings>) => {
    speechService.updateSettings(newSettings);
    setSettings(speechService.settings);
  };

  const speakChinese = async (text: string) => {
    try {
      await speechService.speakChinese(text);
    } catch (error) {
      console.error('播放中文失败:', error);
    }
  };

  const speakEnglish = async (text: string) => {
    try {
      await speechService.speakEnglish(text);
    } catch (error) {
      console.error('播放英文失败:', error);
    }
  };

  const stop = () => {
    speechService.stop();
  };

  const contextValue: SpeechContextType = {
    settings,
    isPlaying,
    updateSettings,
    speakChinese,
    speakEnglish,
    stop,
    isSupported,
  };

  return (
    <SpeechContext.Provider value={contextValue}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = (): SpeechContextType => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};

export default SpeechProvider;
