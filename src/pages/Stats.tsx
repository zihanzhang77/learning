
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '../context/UserContext';
import { useAi } from '../context/AiContext';
import { statsApi, timerApi, timeConsumptionApi, userApi, aiApi } from '../services/api';
import Calendar from '../components/Calendar';

const Stats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // 时间消耗相关状态
  const [weeklyTimeData, setWeeklyTimeData] = useState<any[]>([]);
  const { user, refreshUser } = useUser();
  
  // 使用全局 AI Context
  const { 
    selectedTopic, setSelectedTopic, 
    targetGoal, setTargetGoal,
    currentLevel, setCurrentLevel,
    aiOutput, aiLoading, aiError, generatePlan, setAiError,
    setAiOutput, sendMessage, chatHistory, setChatHistory
  } = useAi();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const targetDropdownRef = React.useRef<HTMLDivElement>(null);
  const levelDropdownRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsTopicDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(target)) {
        setIsTargetDropdownOpen(false);
      }
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(target)) {
        setIsLevelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const levelOptions = ['没学过', '了解', '熟悉', '精通', '专家'];
  const topicOptions = [
    '雅思/托福', '视频剪辑', '自媒体运营', '电商运营',
    '演讲与口才表达', '理财与基金入门', 'AI 工具使用'
  ];

  useEffect(() => {
    if (user) {
      loadStats();
      if (activeTab === 'week') {
        loadWeeklyStats();
      }
      // 如果没有 AI 输出，且用户有保存的学习计划，则加载
      if (!aiOutput && user.learning_plan) {
        setAiOutput(user.learning_plan);
        // 同步更新聊天记录，确保内容能显示出来
        setChatHistory([{
          role: 'assistant',
          content: user.learning_plan
        }]);
      }
    }
  }, [user, activeTab]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const safeRequest = async <T,>(promise: Promise<T>, defaultValue: T): Promise<T> => {
        try {
          return await promise;
        } catch (error) {
          console.warn('Request failed (using default):', error);
          return defaultValue;
        }
      };

      // 并行请求所有数据以提升速度
      const [
        statsData, 
        totalDaysData, 
        timeConsumptionData, 
        weeklyTimeConsumption
      ] = await Promise.all([
        safeRequest(statsApi.getStats(user.id, activeTab), { total_hours: 0, avg_hours: 0, study_days_count: 0 }),
        safeRequest(activeTab !== 'month' ? timerApi.getTotalDays(user.id) : Promise.resolve({ total_days: 0 }), { total_days: 0 }),
        safeRequest(timeConsumptionApi.getTimeConsumption(user.id, new Date().toISOString().split('T')[0]), { study_hours: 0 }),
        safeRequest((async () => {
          const currentDate = new Date();
          const currentDay = currentDate.getDay();
          const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
          const monday = new Date(currentDate);
          monday.setDate(currentDate.getDate() - daysToMonday);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          return timeConsumptionApi.getTimeConsumptionRange(
            user.id,
            monday.toISOString().split('T')[0],
            sunday.toISOString().split('T')[0]
          );
        })(), [])
      ]);

      let displayStreak = 0;
      
      // 根据当前标签获取相应的学习天数
      if (activeTab === 'month') {
        // 本月学习天数（学习时长大于1小时的天数）
        displayStreak = statsData.study_days_count || 0;
      } else {
        // 累计学习天数
        displayStreak = totalDaysData.total_days || 0;
      }
      
      // 计算总学习时长（学习计时时间 + 手动输入的学习时间）
      const totalStudyHours = statsData.total_hours || 0;
      const totalMinutes = totalStudyHours * 60;
      
      // 计算平均学习时长
      const avgStudyHours = statsData.avg_hours || 0;
      const avgMinutes = avgStudyHours * 60;
      
      setStatsData({
        total: totalMinutes.toFixed(2),
        avg: avgMinutes.toFixed(2),
        trend: activeTab === 'all' ? '持续增长' : `+${(totalMinutes * 0.1).toFixed(2)}分钟`
      });
      setStreak(displayStreak);
      setWeeklyTimeData(weeklyTimeConsumption);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyStats = async () => {
    if (!user) return;
    
    try {
      const data = await statsApi.getWeeklyStats(user.id);
      setWeeklyData(data);
    } catch (error) {
      console.error('加载周数据失败:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, aiLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(content);
  };

  const handleGeneratePlan = async () => {
    // 1. 先保存用户学习偏好到 Supabase
    if (user) {
      try {
        await userApi.updateUser(user.id, {
          learning_topic: selectedTopic,
          target_goal: targetGoal,
          current_level: currentLevel
        });
        console.log('用户学习偏好已保存');
        await refreshUser();
      } catch (error) {
        console.error('保存用户学习偏好失败:', error);
      }
    }

    // 2. 生成计划
    const plan = await generatePlan();

    // 3. 保存生成的计划
    if (plan && user) {
      try {
        await userApi.updateUser(user.id, {
          learning_plan: plan
        });
        console.log('用户学习计划已保存');
        await refreshUser();
      } catch (error) {
        console.error('保存用户学习计划失败:', error);
      }
    }
  };

  const handleSavePlanToProfile = async () => {
    if (!user || !aiOutput) return;

    try {
      setIsSaving(true);
      // 默认周期为30天
      let durationDays = 30;
      
      // 1. 调用 DeepSeek 模型智能分析学习周期
      try {
        const analyzePrompt = `请分析以下学习计划内容，评估完成该计划所需的总天数。请直接返回一个数字（例如：30），不要包含任何其他文字或解释。\n\n计划内容摘要：\n${aiOutput.substring(0, 2000)}`; // 截取前2000字符避免token过长
        
        const { answer } = await aiApi.deepseek(analyzePrompt, 'encouragement');
        const aiDays = parseInt(answer.replace(/\D/g, '')); // 提取数字
        
        if (!isNaN(aiDays) && aiDays > 0) {
          durationDays = aiDays;
          console.log('AI智能分析学习周期:', durationDays, '天');
        }
      } catch (aiError) {
        console.warn('AI分析周期失败，降级为正则匹配:', aiError);
        
        // 2. 降级方案：正则匹配
        const totalPeriodMatch = aiOutput.match(/建议总周期[：:]\s*(\d+)\s*天/);
        
        if (totalPeriodMatch) {
          durationDays = parseInt(totalPeriodMatch[1]);
        } else {
          // 3. 备用：尝试匹配常见的周期描述
          const weekMatch = aiOutput.match(/(\d+)\s*(周|week)/i);
          const monthMatch = aiOutput.match(/(\d+)\s*(月|month)/i);
          const dayMatch = aiOutput.match(/(\d+)\s*(天|day)/i);
          
          if (weekMatch) {
            durationDays = parseInt(weekMatch[1]) * 7;
          } else if (monthMatch) {
            durationDays = parseInt(monthMatch[1]) * 30;
          } else if (dayMatch) {
            durationDays = parseInt(dayMatch[1]);
          }
        }
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + durationDays);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      await userApi.updateUser(user.id, {
        plan_start_date: startDateStr,
        plan_end_date: endDateStr,
        learning_plan: aiOutput // 再次确保计划内容被保存
      });

      alert(`计划已保存到"我的"档案！\n建议学习周期：${startDateStr} 至 ${endDateStr} (${durationDays}天)`);
      await refreshUser();
    } catch (error) {
      console.error('保存计划失败:', JSON.stringify(error));
      alert('保存失败，请检查网络或刷新页面重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setAiOutput(null);
    setChatHistory([]); // 清空历史
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center px-4 h-14 justify-between">
          <div className="w-10"></div>
          <h1 className="text-lg font-semibold tracking-tight">大模型</h1>
          <div className="w-10 flex justify-end">
            <span className="material-symbols-outlined text-slate-400">smart_toy</span>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 pt-6 pb-12">
        {/* 大模型板块 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 mb-6 h-[80vh] flex flex-col">
          {/* 中间内容区域 - 聊天列表 */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50">
            {chatHistory.length > 0 ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {chatHistory.filter(msg => msg.role !== 'system').map((msg, index) => (
                  <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-100 rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' && msg.reasoning && (
                        <details className="mb-3 group">
                          <summary className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            <span>深度思考过程</span>
                            <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180 ml-auto">expand_more</span>
                          </summary>
                          <div className="mt-2 pl-3 border-l-2 border-slate-200 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {msg.reasoning}
                          </div>
                        </details>
                      )}
                      
                      <div className={`prose prose-sm max-w-none leading-relaxed break-words
                          ${msg.role === 'user' ? 'prose-invert text-white' : 'text-slate-700'}
                          prose-headings:font-bold ${msg.role === 'user' ? 'prose-headings:text-white' : 'prose-headings:text-slate-800'}
                          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                          prose-strong:font-black ${msg.role === 'user' ? 'prose-strong:text-white' : 'prose-strong:text-slate-900'}
                          prose-li:my-0.5 prose-p:my-2 prose-pre:bg-slate-800 prose-pre:text-slate-100`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200"><table className="w-full border-collapse min-w-full" {...props} /></div>,
                            thead: ({node, ...props}) => <thead className={msg.role === 'user' ? 'bg-blue-700/50' : 'bg-slate-50'} {...props} />,
                            tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200/50" {...props} />,
                            tr: ({node, ...props}) => <tr className="border-b border-slate-200/50 last:border-0" {...props} />,
                            th: ({node, ...props}) => <th className={`p-3 text-xs font-bold text-left ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-600'}`} {...props} />,
                            td: ({node, ...props}) => <td className={`p-3 text-xs ${msg.role === 'user' ? 'text-blue-50' : 'text-slate-600'}`} {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({node, className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '')
                              return match ? (
                                <code className={`${className} bg-slate-800 rounded px-1 py-0.5 text-xs`} {...props}>{children}</code>
                              ) : (
                                <code className={`${msg.role === 'user' ? 'bg-blue-700' : 'bg-slate-100 text-slate-800'} rounded px-1.5 py-0.5 text-xs font-mono`} {...props}>{children}</code>
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                
                {aiLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                       <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                       </div>
                       <span className="text-xs text-slate-400 ml-2">AI 正在思考中...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              // 初始空状态
              <div id="aiResponse" className="flex-1 h-full flex flex-col">
                {!aiLoading && !aiError && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-4xl text-blue-500">school</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">定制你的专属学习计划</h3>
                    <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">
                      选择一个你想学习的技能，AI 将为你生成包含核心概念、实操步骤和课程推荐的完整学习路径。
                    </p>
                  </div>
                )}
                
                {aiLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                       <div className="flex space-x-2">
                         <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                       </div>
                       <p className="text-sm font-medium text-slate-500">AI 正在为你定制专属计划...</p>
                    </div>
                  </div>
                )}
                
                {aiError && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-red-500">error_outline</span>
                    </div>
                    <p className="text-slate-800 font-bold mb-2">出错了</p>
                    <p className="text-slate-500 text-sm mb-6">{aiError}</p>
                    <button 
                      onClick={() => setAiError(null)}
                      className="px-6 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 底部操作区域 */}
          <div className="p-4 border-t border-slate-100">
            {aiOutput ? (
              // 聊天输入框
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="对计划不满意？继续提问来调整..."
                    disabled={aiLoading}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 resize-none max-h-32 py-2 px-1 placeholder:text-slate-400"
                    rows={1}
                    style={{ minHeight: '40px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || aiLoading}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-4">
                    <button 
                      onClick={handleBack}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      开启新计划
                    </button>
                    <button 
                      onClick={handleSavePlanToProfile}
                      disabled={isSaving}
                      className={`text-xs flex items-center gap-1 transition-colors font-medium ${isSaving ? 'text-slate-400 cursor-not-allowed' : 'text-blue-500 hover:text-blue-600'}`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          正在保存...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          保存到我的档案
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 输入表单
              <div className="flex flex-col gap-3">
                {/* 第一步：选择学习内容 */}
                <div className="relative w-full" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">学习目标</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      placeholder="下拉看看大家都在学什么"
                      disabled={aiLoading}
                      className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 placeholder:text-slate-400"
                    />
                    <div 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      onClick={() => !aiLoading && setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isTopicDropdownOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                    
                    {/* 下拉选项 */}
                    {isTopicDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {topicOptions.map((topic) => (
                          <div
                            key={topic}
                            onClick={() => {
                              setSelectedTopic(topic);
                              setIsTopicDropdownOpen(false);
                            }}
                            className="px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* 第二步：达成目标 */}
                  <div className="w-full" ref={targetDropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">达成目标</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetGoal}
                        onChange={(e) => setTargetGoal(e.target.value)}
                        placeholder="输入或选择"
                        disabled={aiLoading}
                        className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 placeholder:text-slate-400"
                      />
                      <div 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                        onClick={() => !aiLoading && setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {isTargetDropdownOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                      
                      {/* 下拉选项 */}
                      {isTargetDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {levelOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                setTargetGoal(option);
                                setIsTargetDropdownOpen(false);
                              }}
                              className="px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 第三步：当前水平 */}
                  <div className="w-full" ref={levelDropdownRef}>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">当前水平</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentLevel}
                        onChange={(e) => setCurrentLevel(e.target.value)}
                        placeholder="输入或选择"
                        disabled={aiLoading}
                        className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 placeholder:text-slate-400"
                      />
                      <div 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                        onClick={() => !aiLoading && setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {isLevelDropdownOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                      
                      {/* 下拉选项 */}
                      {isLevelDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {levelOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                setCurrentLevel(option);
                                setIsLevelDropdownOpen(false);
                              }}
                              className="px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleGeneratePlan}
                  disabled={aiLoading || !selectedTopic || !targetGoal || !currentLevel}
                  className="w-full h-[46px] bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mt-2"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  {aiLoading ? '生成计划中...' : '生成详细学习计划'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const Tab: React.FC<any> = ({ active, children, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all active:scale-95 duration-200 ${active ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {children}
  </button>
);

const StatCard: React.FC<any> = ({ icon, label, value, unit, color, textColor, trend }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-soft">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${textColor} text-base`}>{icon}</span>
      </div>
      <span className="text-sm text-slate-500 font-bold">{label}</span>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
      <span className="text-xs text-slate-400 font-bold">{unit}</span>
    </div>
    <p className="text-[11px] text-emerald-500 font-black mt-2">趋势 {trend}</p>
  </div>
);

const CategoryRow: React.FC<any> = ({ icon, label, value, cumulative, color }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white transition-all hover:border-slate-200">
    <div className={`w-10 h-10 rounded-xl ${color}/10 flex items-center justify-center`}>
      <span className={`material-symbols-outlined ${color.replace('bg-', 'text-')}`}>{icon}</span>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-end mb-1">
        <p className="font-bold text-sm text-slate-800">{label}</p>
        <p className="text-xs font-black text-slate-900">{value}</p>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: value }}></div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1 font-medium">累计投入 {cumulative}</p>
    </div>
  </div>
);

export default Stats;
