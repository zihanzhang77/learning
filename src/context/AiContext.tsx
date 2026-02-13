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
  aiLoading: boolean;
  aiError: string | null;
  generatePlan: () => Promise<void>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTopic, setSelectedTopic] = useState('雅思/托福');
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
      
      请严格按照以下【通用学习计划表】的结构输出内容，不要使用Markdown代码块（如 \`\`\` ），直接输出清晰的文本。确保排版清晰，不要出现乱码。

      【通用学习计划表结构要求】
      
      一、基础信息（必填）
      - 起点：【根据当前水平填写】
      - 目标：【根据目标水平填写】
      - 周期：【根据内容预估，如：2个月（8周）】
      - 每日时长：【建议时长，如：2小时】
      - 核心逻辑：【填写适配该内容的核心思路】
      
      二、总阶段规划（固定3阶段）
      1. 基础夯实期
         - 时间：【如：第1-3周】
         - 核心目标：【如：补齐基础短板】
      2. 强化提分期
         - 时间：【如：第4-6周】
         - 核心目标：【如：专项突破薄弱点】
      3. 全真/巩固冲刺期
         - 时间：【如：第7-8周】
         - 核心目标：【如：整体复盘+模拟练习】
      
      三、分周详细学习计划（请详细列出）
      
      第1-【X】周｜基础夯实期
      每日任务细则：
      1. 【模块1】（【时长】）
         - 【具体任务1】
         - 【具体任务2】
      2. 【模块2】（【时长】）
         - 【具体任务1】
         - 【具体任务2】
      ...
      每周目标：
      - 第1周：...
      - 第2周：...
      
      第【X+1】-【Y】周｜强化提分期
      每日任务细则：
      ...
      每周目标：
      ...
      
      第【Y+1】-【总周数】周｜全真/巩固冲刺期
      每日任务细则：
      ...
      每周目标：
      ...
      
      四、每周必做（固定3条）
      1. 1次整体模拟/复盘
      2. 整理本周错题/易错点/重点知识点
      3. 各核心模块至少完成2次完整输出/实操练习
      
      模板使用说明：
      - 请根据具体学习内容、目标、周期灵活调整填充内容。
      - 弹性缓冲不可省略。
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
      selectedTopic,
      setSelectedTopic,
      targetGoal,
      setTargetGoal,
      currentLevel,
      setCurrentLevel,
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
