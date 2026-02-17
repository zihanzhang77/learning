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
  // 聊天历史相关
  chatHistory: { role: 'system' | 'user' | 'assistant'; content: string; reasoning?: string }[];
  setChatHistory: React.Dispatch<React.SetStateAction<{ role: 'system' | 'user' | 'assistant'; content: string; reasoning?: string }[]>>;
  sendMessage: (content: string) => Promise<void>;
  aiLoading: boolean;
  aiError: string | null;
  setAiError: (error: string | null) => void;
  generatePlan: () => Promise<string | null>;
  
  // 鼓励相关
  encouragementStates: Record<string, { loading: boolean; result?: string; error?: string }>;
  generateEncouragement: (date: string, prompt: string, userId: string, onSave: (result: string) => Promise<void>) => Promise<void>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'system' | 'user' | 'assistant'; content: string; reasoning?: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // 鼓励状态管理: date -> state
  const [encouragementStates, setEncouragementStates] = useState<Record<string, { loading: boolean; result?: string; error?: string }>>({});

  const generateEncouragement = async (date: string, prompt: string, userId: string, onSave: (result: string) => Promise<void>) => {
    // 设置加载状态
    setEncouragementStates(prev => ({
      ...prev,
      [date]: { loading: true, error: undefined }
    }));

    try {
      // 这里的 Promise 在组件卸载后仍然会继续执行
      // 我们稍微优化 prompt，限制 token 数以加快速度
      const data = await aiApi.deepseek(prompt, 'encouragement');
      const result = data.answer;

      // 保存到数据库
      await onSave(result);

      // 更新状态
      setEncouragementStates(prev => ({
        ...prev,
        [date]: { loading: false, result: result }
      }));
    } catch (error: any) {
      console.error('AI 鼓励生成失败:', error);
      setEncouragementStates(prev => ({
        ...prev,
        [date]: { loading: false, error: error.message || '生成失败' }
      }));
    }
  };

  const generatePlan = async () => {
    if (!selectedTopic) return null;
    
    // 如果已经在生成中，不要重复触发
    if (aiLoading) return null;

    // 意图识别：如果用户输入过于简单（不超过5个字），则拦截
    if (selectedTopic.trim().length <= 5 && (!currentLevel || currentLevel.trim().length <= 5)) {
      setAiOutput("请补充更多信息，输入太短啦！");
      setChatHistory(prev => [
        { role: 'user', content: `学习目标：${selectedTopic}，当前水平：${currentLevel || '未填写'}` },
        { role: 'assistant', content: "请补充更多信息，输入太短啦！" }
      ]);
      return null;
    }

    setAiLoading(true);
    setAiError(null);
    setAiOutput(null);
    
    // 1. 构建 System Prompt (包含 RAG 框架和人设)
    const ragTemplate = `
      请严格按照以下【新技能学习计划框架】输出内容，**必须使用标准 Markdown 格式**。
      **要求：**
      1. **深度定制**：所有内容必须针对该技能进行具体化，不要输出通用模板。
      2. **结构清晰**：严格遵守以下四大部分结构。
      3. **实操导向**：重点在于怎么做、用什么工具、看什么课。
      4. **排版美观**：使用 Markdown 的标题、列表、表格等语法。
      5. **展示思考**：在正式回复前，请先输出你的思考过程（Reasoning）。

      ---
      # 学习计划框架
      ## 1、核心名词概念
      > 解释核心概念。
      ### 第一层级：基础概念
      ### 第二层级：工具与环境
      ### 第三层级：核心组成与流程

      ## 2、核心子技能
      ### 第一类：基础必备子技能
      ### 第二类：进阶提升子技能

      ## 3、实操步骤与课程推荐
      ### 一、实操步骤（分阶段拆解：前期准备、基础实操、进阶实操、综合实操）
      ### 二、权威课程推荐（B站、抖音、小红书）

      ## 4、独立实操与问题解决
      ### 一、执行要求
      ### 二、常见问题与解决

      ## 5、学习周期汇总
      > 请根据上述计划，估算完成所有内容所需的总时间（以天为单位）。
      > 格式必须严格为：**建议总周期：X天**
    `;

    const systemPrompt = `你是一个专业的技能学习规划师，擅长制定详细的实操计划。你的输出必须结构清晰，使用 Markdown 格式，并展示深度思考过程。\n${ragTemplate}`;

    // 2. 构建 User Prompt (简洁明了)
    const userPrompt = `请为我制定一份"${selectedTopic}"的专属学习计划。
    **用户现状：**
    - **学习技能**：${selectedTopic}
    - **当前水平**：${currentLevel || '零基础/未填写'}
    - **目标水平**：${targetGoal || '精通/未填写'}`;

    const initialHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    // 3. 立即更新 UI (包含空的 assistant 消息以触发流式显示)
    // 注意：前端 Stats.tsx 会过滤掉 system 消息，所以用户只能看到自己的请求和 AI 的回复，不会看到巨大的 Prompt
    setChatHistory([
      ...initialHistory,
      { role: 'assistant', content: '', reasoning: '' }
    ]);
    
    try {
      // 发送请求
      await aiApi.deepseek(initialHistory, 'plan', (partial) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          // 确保最后一条是 assistant 消息
          if (lastMsg.role === 'assistant') {
             const updatedMsg = { ...lastMsg };
             if (partial.reasoning) updatedMsg.reasoning = partial.reasoning;
             if (partial.content) updatedMsg.content = partial.content;
             newHistory[newHistory.length - 1] = updatedMsg;
             
             // 同步更新 aiOutput 以保持兼容
             if (partial.content) setAiOutput(partial.content);
             
             return newHistory;
          }
          return prev;
        });
      });
      
      return aiOutput;
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || '生成计划失败，请稍后重试');
      // 移除那个空的占位符（如果失败了）
      setChatHistory(prev => {
         const last = prev[prev.length - 1];
         if (last && last.role === 'assistant' && !last.content && !last.reasoning) {
             return prev.slice(0, -1);
         }
         return prev;
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    // 意图识别：如果输入太简单，直接拦截
    if (content.trim().length < 2) {
      setAiOutput("请补充更多信息，输入太短啦！");
       setChatHistory(prev => [
        ...prev,
        { role: 'user', content: content },
        { role: 'assistant', content: "请补充更多信息，输入太短啦！" }
      ]);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    
    try {
      // 构建新的历史记录（包含用户新消息）
      const newHistory = [
        ...chatHistory,
        { role: 'user' as const, content: content }
      ];
      
      // UI 上先添加用户消息和空的助手消息
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: '', reasoning: '' }
      ]);

      // 发送完整历史上下文
      await aiApi.deepseek(newHistory, 'plan', (partial) => {
        setChatHistory(prev => {
          const currentHistory = [...prev];
          const lastMsg = currentHistory[currentHistory.length - 1];
          if (lastMsg.role === 'assistant') {
             const updatedMsg = { ...lastMsg };
             if (partial.reasoning) updatedMsg.reasoning = partial.reasoning;
             if (partial.content) updatedMsg.content = partial.content;
             currentHistory[currentHistory.length - 1] = updatedMsg;
             
             if (partial.content) setAiOutput(partial.content);
             
             return currentHistory;
          }
          return prev;
        });
      });
      
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || '回复失败，请稍后重试');
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
      chatHistory, setChatHistory, sendMessage, // 新增导出
      aiLoading, aiError, setAiError, generatePlan,
      encouragementStates, generateEncouragement
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
