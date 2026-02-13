import React, { createContext, useContext, useState, ReactNode } from 'react';
import { aiApi } from '../services/api';

interface AiContextType {
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  targetGoal: string;
  setTargetGoal: (goal: string) => void;
  currentLevel: string;
  setCurrentLevel: (level: string) => void;
  aiOutput: string | null;
  setAiOutput: (output: string | null) => void;
  aiLoading: boolean;
  aiError: string | null;
  generatePlan: () => Promise<void>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
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
      // 构建详细的 prompt
      const prompt = `你是一个专业的学习规划师。请为我制定一份详细的学习计划。
      
      学习内容：${selectedTopic}
      当前水平：${currentLevel || '未填写'}
      目标水平：${targetGoal || '未填写'}
      
      请严格按照以下结构输出内容，**必须使用标准 Markdown 格式**。
      - **尽量精简**，只输出核心干货，不要废话。
      - **排期计划请务必使用 Markdown 表格** 展示，以便清晰阅读。
      - 不要使用 Markdown 代码块（如 \`\`\`markdown ... \`\`\`），直接输出 Markdown 源码即可。

      【结构要求】
      
      # ${selectedTopic} 学习计划
      
      ## 一、基础信息
      - **周期**：【预估周期】
      - **每日时长**：【建议时长】
      
      ## 二、阶段规划
      | 阶段 | 时间 | 核心目标 |
      | :--- | :--- | :--- |
      | **阶段一** | 【时间】 | 【目标】 |
      | **阶段二** | 【时间】 | 【目标】 |
      | **阶段三** | 【时间】 | 【目标】 |
      
      ## 三、详细计划
      
      ### 阶段一
      | 模块 | 每日任务 | 时长 |
      | :--- | :--- | :--- |
      | **【模块】** | 【任务】 | 【时长】 |

      ### 阶段二
      | 模块 | 每日任务 | 时长 |
      | :--- | :--- | :--- |
      | **【模块】** | 【任务】 | 【时长】 |
      
      ### 阶段三
      | 模块 | 每日任务 | 时长 |
      | :--- | :--- | :--- |
      | **【模块】** | 【任务】 | 【时长】 |
      
      ## 四、每周必做
      1. **1次模拟/复盘**
      2. **整理错题/重点**
      `;

      // 这里的 Promise 在组件卸载后仍然会继续执行，因为 Context 依然存在
      const data = await aiApi.deepseek(prompt, 'plan');
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
      selectedTopic, setSelectedTopic,
      targetGoal, setTargetGoal,
      currentLevel, setCurrentLevel,
      aiOutput, setAiOutput,
      aiLoading, aiError, generatePlan
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
