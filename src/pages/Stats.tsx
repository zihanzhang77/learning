
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '../context/UserContext';
import { useAi } from '../context/AiContext';
import { statsApi, timerApi, timeConsumptionApi, userApi } from '../services/api';
import Calendar from '../components/Calendar';

const Stats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  // 时间消耗相关状态
  const [weeklyTimeData, setWeeklyTimeData] = useState<any[]>([]);
  const { user, refreshUser } = useUser();
  
  // 使用全局 AI Context
  const { 
    selectedTopic, setSelectedTopic, 
    targetGoal, setTargetGoal,
    currentLevel, setCurrentLevel,
    aiOutput, aiLoading, aiError, generatePlan,
    setAiOutput // 假设 Context 暴露了这个方法，如果没有，需要去添加
  } = useAi();

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
      }
    }
  }, [user, activeTab]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await statsApi.getStats(user.id, activeTab);
      let displayStreak = 0;
      
      // 根据当前标签获取相应的学习天数
      if (activeTab === 'month') {
        // 本月学习天数（学习时长大于1小时的天数）
        displayStreak = data.study_days_count || 0;
      } else {
        // 累计学习天数
        const totalDaysData = await timerApi.getTotalDays(user.id);
        displayStreak = totalDaysData.total_days || 0;
      }
      
      // 获取当前日期的时间消耗数据
      const today = new Date().toISOString().split('T')[0];
      const timeConsumptionData = await timeConsumptionApi.getTimeConsumption(user.id, today);
      
      // 计算总学习时长（学习计时时间 + 手动输入的学习时间）
      const totalStudyHours = data.total_hours || 0;
      const totalMinutes = totalStudyHours * 60;
      
      // 计算平均学习时长
      const avgStudyHours = data.avg_hours || 0;
      const avgMinutes = avgStudyHours * 60;
      
      setStatsData({
        total: totalMinutes.toFixed(2),
        avg: avgMinutes.toFixed(2),
        trend: activeTab === 'all' ? '持续增长' : `+${(totalMinutes * 0.1).toFixed(2)}分钟`
      });
      setStreak(displayStreak);
      
      // 计算本周的周一和周日的日期
      const currentDate = new Date();
      const currentDay = currentDate.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // 计算到周一的天数
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - daysToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      // 获取本周的时间消耗数据
      const weeklyTimeData = await timeConsumptionApi.getTimeConsumptionRange(
        user.id,
        monday.toISOString().split('T')[0],
        sunday.toISOString().split('T')[0]
      );
      setWeeklyTimeData(weeklyTimeData);
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

  const handleRegenerate = () => {
    handleGeneratePlan();
  };

  const handleBack = () => {
    setAiOutput(null);
  };

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
          {/* 中间内容区域 */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
            {/* AI 输出结果 */}
            <div id="aiResponse" className="flex-1 h-full flex flex-col">
              {!aiOutput && !aiLoading && !aiError && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">school</span>
                  <p className="text-slate-400">选择一个目标，为你生成专属学习计划</p>
                </div>
              )}
              
              {aiLoading && (
                <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-4xl text-blue-400 mb-4 animate-spin">smart_toy</span>
                  <p className="text-slate-400">AI 正在规划中...</p>
                  <p className="text-slate-300 text-xs mt-2">预计需要1分钟...</p>
                </div>
              )}
              
              {aiError && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
                  <p className="text-red-500">{aiError}</p>
                </div>
              )}
              
              {aiOutput && (
                <div className="w-full bg-blue-50/50 rounded-xl p-6 text-left h-full overflow-y-auto custom-scrollbar">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => <table className="w-full border-collapse my-4 rounded-lg overflow-hidden shadow-sm border border-slate-300" {...props} />,
                      thead: ({node, ...props}) => <thead className="bg-white border-b-2 border-slate-300" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="bg-white/50 divide-y divide-slate-300" {...props} />,
                      tr: ({node, ...props}) => <tr className="border-b border-slate-300 last:border-0" {...props} />,
                      th: ({node, ...props}) => <th className="border border-slate-300 p-3 text-xs font-bold text-slate-700 text-left bg-slate-50" {...props} />,
                      td: ({node, ...props}) => <td className="border border-slate-300 p-3 text-xs text-slate-600" {...props} />,
                    }}
                    className="prose prose-sm max-w-none text-slate-700 leading-relaxed 
                      prose-headings:font-bold prose-headings:text-slate-800 
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-strong:text-slate-900 prose-strong:font-black
                      prose-li:my-0.5 prose-p:my-2"
                  >
                    {aiOutput}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作区域 */}
          <div className="p-4 border-t border-slate-100">
            {aiOutput ? (
              // 生成结果后的操作按钮
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 h-[46px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  返回修改
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex-1 h-[46px] bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  重新生成
                </button>
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
