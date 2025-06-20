/**
 * LLM Context - 大语言模型配置管理
 *
 * 提供全局的LLM配置管理功能，包括：
 * - 配置的增删改查
 * - 连接状态管理
 * - 当前选中配置管理
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createLLMService } from "../services/llmService";

export interface LLMSettings {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  createdAt: string;
  isConnected?: boolean;
  lastTestedAt?: string;
}

interface LLMContextType {
  // 配置列表
  settings: LLMSettings[];
  // 当前选中的配置ID
  selectedSettingsId: string;
  // 当前选中的配置
  currentSettings: LLMSettings | null;
  // 连接状态
  isConnected: boolean;
  // 操作方法
  saveSettings: (settings: LLMSettings) => Promise<void>;
  deleteSettings: (id: string) => void;
  selectSettings: (id: string) => void;
  testConnection: (settings: LLMSettings) => Promise<boolean>;
  // 获取默认配置
  getDefaultSettings: () => LLMSettings;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

const STORAGE_KEY = "llm_settings_list";
const SELECTED_SETTINGS_KEY = "llm_selected_settings_id";

// localStorage 管理函数
const saveLLMSettingsToStorage = (settings: LLMSettings[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const loadLLMSettingsFromStorage = (): LLMSettings[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("加载 LLM 配置失败:", error);
    return [];
  }
};

const saveSelectedSettingsId = (id: string) => {
  localStorage.setItem(SELECTED_SETTINGS_KEY, id);
};

const loadSelectedSettingsId = (): string => {
  try {
    return localStorage.getItem(SELECTED_SETTINGS_KEY) || "";
  } catch (error) {
    console.error("加载选中的 LLM 配置 ID 失败:", error);
    return "";
  }
};

interface LLMProviderProps {
  children: ReactNode;
}

export const LLMProvider: React.FC<LLMProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<LLMSettings[]>([]);
  const [selectedSettingsId, setSelectedSettingsId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  // 初始化加载设置
  useEffect(() => {
    const savedSettings = loadLLMSettingsFromStorage();
    const savedSelectedId = loadSelectedSettingsId();

    setSettings(savedSettings);

    if (savedSettings.length > 0) {
      // 优先使用上次保存的选中配置
      let targetSettings: LLMSettings | undefined;

      if (savedSelectedId) {
        targetSettings = savedSettings.find((s) => s.id === savedSelectedId);
      }

      // 如果没有找到上次选中的配置，使用第一个
      if (!targetSettings) {
        targetSettings = savedSettings[0];
      }

      setSelectedSettingsId(targetSettings.id);

      // 如果配置标记为已连接，直接恢复连接状态和初始化服务
      if (targetSettings.isConnected) {
        setIsConnected(true);
        createLLMService({
          baseUrl: targetSettings.baseUrl,
          apiKey: targetSettings.apiKey,
          model: targetSettings.model,
        });
      }
    }
  }, []);

  // 获取当前选中的配置
  const currentSettings =
    settings.find((s) => s.id === selectedSettingsId) || null;

  // 获取默认配置
  const getDefaultSettings = (): LLMSettings => ({
    id: "",
    name: "",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-3.5-turbo",
    createdAt: "",
    isConnected: false,
  });
  // 保存设置
  const saveSettings = async (newSettings: LLMSettings) => {
    const settingsToSave: LLMSettings = {
      ...newSettings,
      id: newSettings.id || Date.now().toString(),
      createdAt: newSettings.createdAt || new Date().toISOString(),
    };

    const existingSettings = [...settings];
    const existingIndex = existingSettings.findIndex(
      (s) => s.id === settingsToSave.id
    );

    if (existingIndex >= 0) {
      // 更新现有设置
      existingSettings[existingIndex] = settingsToSave;
    } else {
      // 添加新设置
      existingSettings.push(settingsToSave);
    }

    setSettings(existingSettings);
    saveLLMSettingsToStorage(existingSettings);
    setSelectedSettingsId(settingsToSave.id);
    saveSelectedSettingsId(settingsToSave.id); // 保存选中的配置 ID
  };
  // 删除设置
  const deleteSettings = (id: string) => {
    const filteredSettings = settings.filter((s) => s.id !== id);
    setSettings(filteredSettings);
    saveLLMSettingsToStorage(filteredSettings);

    // 如果删除的是当前选中的设置，重置选择
    if (id === selectedSettingsId) {
      if (filteredSettings.length > 0) {
        // 如果还有其他配置，选择第一个
        const newSelected = filteredSettings[0];
        setSelectedSettingsId(newSelected.id);
        saveSelectedSettingsId(newSelected.id);

        // 如果新选中的配置之前已连接，恢复连接状态
        if (newSelected.isConnected) {
          setIsConnected(true);
          createLLMService({
            baseUrl: newSelected.baseUrl,
            apiKey: newSelected.apiKey,
            model: newSelected.model,
          });
        } else {
          setIsConnected(false);
        }
      } else {
        // 如果没有其他配置了，清空选择
        setSelectedSettingsId("");
        saveSelectedSettingsId("");
        setIsConnected(false);
      }
    }
  };
  // 选择设置
  const selectSettings = (id: string) => {
    const selected = settings.find((s) => s.id === id);
    if (selected) {
      setSelectedSettingsId(id);
      saveSelectedSettingsId(id); // 保存选中的配置 ID

      // 如果之前测试过连接且成功，直接恢复连接状态
      if (selected.isConnected) {
        setIsConnected(true);
        createLLMService({
          baseUrl: selected.baseUrl,
          apiKey: selected.apiKey,
          model: selected.model,
        });
      } else {
        setIsConnected(false);
      }
    }
  };

  // 测试连接
  const testConnection = async (
    testSettings: LLMSettings
  ): Promise<boolean> => {
    if (!testSettings.baseUrl || !testSettings.apiKey) {
      return false;
    }

    try {
      const llmService = createLLMService({
        baseUrl: testSettings.baseUrl,
        apiKey: testSettings.apiKey,
        model: testSettings.model,
      });

      const connected = await llmService.testConnection();

      if (connected) {
        // 更新设置的连接状态
        const updatedSettings = {
          ...testSettings,
          isConnected: true,
          lastTestedAt: new Date().toISOString(),
        };
        await saveSettings(updatedSettings);
        setIsConnected(true);
      }

      return connected;
    } catch (error) {
      console.error("连接测试失败:", error);
      return false;
    }
  };

  const value: LLMContextType = {
    settings,
    selectedSettingsId,
    currentSettings,
    isConnected,
    saveSettings,
    deleteSettings,
    selectSettings,
    testConnection,
    getDefaultSettings,
  };

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
};

export const useLLM = (): LLMContextType => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error("useLLM must be used within a LLMProvider");
  }
  return context;
};
