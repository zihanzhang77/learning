import React, { createContext, useContext, useState, ReactNode } from 'react';
import { aiApi } from '../services/api';

interface AiContextType {
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  aiOutput: string | null;
  aiLoading: boolean;
  aiError: string | null;
  generatePlan: () => Promise<void>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTopic, setSelectedTopic] = useState('雅思/托福');
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const generatePlan = async () => {
    if (!selectedTopic) return;
    
    // 如果已经在生成中，不要重复触发
    if (aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    setAiOutput(null);
    
    try {
      // 这里的 Promise 在组件卸载后仍然会继续执行，因为 Context 依然存在
      const data = await aiApi.deepseek(selectedTopic, 'plan');
      setAiOutput(data.answer);
    } catch (error: any) {
      console.error('AI 请求失败:', error);
      // 获取更详细的错误信息
      let errorMessage = error.message || '生成计划失败，请重试';
      if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = `${errorMessage} (详情: ${JSON.stringify(errorData)})`;
        } catch (e) {
          errorMessage = `${errorMessage} (状态码: ${error.response.status})`;
        }
      }
      setAiError(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AiContext.Provider value={{
      selectedTopic,
      setSelectedTopic,
      aiOutput,
      aiLoading,
      aiError,
      generatePlan
    }}>
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (context === undefined) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};
