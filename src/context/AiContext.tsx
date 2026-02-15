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
  generatePlan: () => Promise<string | null>;
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
    if (!selectedTopic) return null;
    
    // 如果已经在生成中，不要重复触发
    if (aiLoading) return null;

    setAiLoading(true);
    setAiError(null);
    setAiOutput(null);
    
    try {
      // 构建详细的 prompt
      const prompt = `你是一个专业的技能学习规划师。请基于我的现状，为我制定一份"${selectedTopic}"的专属学习计划。
      
      **用户现状：**
      - **学习技能**：${selectedTopic}
      - **当前水平**：${currentLevel || '零基础/未填写'}
      - **目标水平**：${targetGoal || '精通/未填写'}
      
      请严格按照以下【新技能学习计划框架】输出内容，**必须使用标准 Markdown 格式**。
      **要求：**
      1. **深度定制**：所有内容必须针对"${selectedTopic}"这个技能进行具体化，不要输出通用模板。
      2. **结构清晰**：严格遵守以下四大部分结构。
      3. **实操导向**：重点在于怎么做、用什么工具、看什么课。
      4. **排版美观**：使用 Markdown 的标题、列表、表格等语法，确保阅读体验良好。不要使用代码块包裹正文。

      ---

      # ${selectedTopic} 学习计划（完整框架）

      ## 1、核心名词概念
      > 这是进入"${selectedTopic}"领域的“地图”，请用大白话解释核心概念。

      ### 第一层级：基础概念
      （这是进入该技能领域的“门票”，构成底层逻辑）
      - **【概念1】**：定义（大白话解释它是什么，为什么重要）
      - **【概念2】**：定义
      - **【概念3】**：定义

      ### 第二层级：工具与环境
      （实践该技能需用到的工具、软件或环境）
      - **【工具1】**：定义（作用及典型应用场景）
      - **【工具2】**：定义

      ### 第三层级：核心组成与流程
      （拆解该技能的“骨架”——主要组成部分或关键步骤）
      - **【组成/流程1】**：定义（角色及关联）
      - **【组成/流程2】**：定义

      ## 2、核心子技能
      > 学会"${selectedTopic}"需要掌握哪些核心子技能（按“基础→进阶”排序）。

      ### 第一类：基础必备子技能（入门门槛）
      - **【子技能1】**：掌握标准（如：熟练运用...完成...无失误）
      - **【子技能2】**：掌握标准
      - **【子技能3】**：掌握标准

      ### 第二类：进阶提升子技能（独立应用）
      - **【子技能1】**（场景适配）：掌握标准
      - **【子技能2】**（效率优化）：掌握标准
      - **【子技能3】**（成果优化）：掌握标准

      ## 3、实操步骤与课程推荐
      > 具体怎么实操，推荐哪些高质量课程。

      ### 一、实操步骤（分阶段拆解）
      
      #### 阶段1：前期准备（铺垫基础）
      - **目标**：能独立打开工具、找到入口，说明作用。
      - **动作**：
        1. 梳理并熟记核心名词。
        2. 搭建环境/安装工具：【列出具体工具名称】。
        3. 熟悉基础界面与初始化。

      #### 阶段2：基础实操（逐个突破）
      - **目标**：扎实掌握基础子技能，独立完成简单任务。
      - **动作**：
        1. 聚焦基础子技能，模仿课程实操。
        2. 独立练习【具体基础任务例子】。
        3. 记录易错点并复盘。

      #### 阶段3：进阶实操（强化应用）
      - **目标**：独立完成不同场景任务，优化成果。
      - **动作**：
        1. 完成场景化任务：【列出具体进阶任务例子】。
        2. 对照优秀案例自查。
        3. 针对性优化成果。

      #### 阶段4：综合实操（长期坚持）
      - **目标**：应对常见场景，自主解决问题。
      - **动作**：
        1. 完成综合任务：【列出综合项目例子】。
        2. 脱离课程自主设计。

      ### 二、权威课程推荐
      （请针对"${selectedTopic}"推荐B站、抖音、小红书的具体搜索关键词或知名博主）
      - **B站**（系统教程）：推荐搜索关键词【...】，推荐博主【...】
      - **抖音**（碎片化/落地）：推荐搜索关键词【...】，推荐博主【...】
      - **小红书**（实战/图文）：推荐搜索关键词【...】，推荐博主【...】

      ## 4、独立实操与问题解决
      > 在实操中发现并解决问题，实现闭环提升。

      ### 一、执行要求
      1. **固定时长**：建议每日/每周实操【具体时长】。
      2. **独立尝试**：遇到卡顿先尝试自主解决。
      3. **记录复盘**：养成记录问题与解决方案的习惯。

      ### 二、常见问题与解决方法
      （针对"${selectedTopic}"初学者常遇到的问题）
      - **问题1**：【描述问题】 -> **解决方法**：【给出建议】
      - **问题2**：【描述问题】 -> **解决方法**：【给出建议】
      - **通用技巧**：对比优秀案例找差距；善用搜索解决报错。

      ### 三、实操进阶方向
      - 尝试【更复杂的场景/任务】。
      - 模仿【高难度案例】。
      `;

      // 这里的 Promise 在组件卸载后仍然会继续执行，因为 Context 依然存在
      const data = await aiApi.deepseek(prompt, 'plan');
      setAiOutput(data.answer);
      return data.answer;
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
      return null;
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
