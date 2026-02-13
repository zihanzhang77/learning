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
      - 标题使用 H1 (#), H2 (##), H3 (###) 区分层级。
      - **重点内容请加粗**。
      - **排期计划请务必使用 Markdown 表格** 展示，以便清晰阅读。
      - 列表项使用 - 或 1. 
      - 不要使用 Markdown 代码块（如 \`\`\`markdown ... \`\`\`），直接输出 Markdown 源码即可。

      【通用学习计划表结构要求】
      
      # ${selectedTopic} 专属学习计划

      ## 一、基础信息
      - **起点**：【根据当前水平填写】
      - **目标**：【根据目标水平填写】
      - **周期**：【根据内容预估】
      - **每日时长**：【建议时长】
      - **核心逻辑**：【填写适配该内容的核心思路】
      
      ## 二、总阶段规划
      | 阶段 | 时间 | 核心目标 |
      | :--- | :--- | :--- |
      | **基础夯实期** | 【如：第1-3周】 | 【如：补齐基础短板】 |
      | **强化提分期** | 【如：第4-6周】 | 【如：专项突破薄弱点】 |
      | **全真冲刺期** | 【如：第7-8周】 | 【如：整体复盘+模拟练习】 |
      
      ## 三、分周详细学习计划
      
      ### 第一阶段：基础夯实期（第1-X周）
      **每周目标**：...

      | 模块 | 每日任务细则 | 时长 |
      | :--- | :--- | :--- |
      | **【模块1】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |
      | **【模块2】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |

      ### 第二阶段：强化提分期（第X-Y周）
      **每周目标**：...

      | 模块 | 每日任务细则 | 时长 |
      | :--- | :--- | :--- |
      | **【模块1】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |
      | **【模块2】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |
      
      ### 第三阶段：全真冲刺期（第Y-Z周）
      **每周目标**：...

      | 模块 | 每日任务细则 | 时长 |
      | :--- | :--- | :--- |
      | **【模块1】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |
      | **【模块2】** | - 【具体任务1】<br>- 【具体任务2】 | 【时长】 |
      
      ## 四、每周必做
      1. **1次整体模拟/复盘**
      2. **整理本周错题/易错点/重点知识点**
      3. **各核心模块至少完成2次完整输出/实操练习**
      
      **模板使用说明**：
      - 表格中的换行请使用 <br> 标签。
      - 请根据具体学习内容灵活调整。
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
