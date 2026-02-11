
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { statsApi, timerApi, timeConsumptionApi } from '../services/api';
import Calendar from '../components/Calendar';

const Stats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  // 时间消耗相关状态
  const [weeklyTimeData, setWeeklyTimeData] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadStats();
      if (activeTab === 'week') {
        loadWeeklyStats();
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

  const currentData = statsData || { total: "0", avg: "0", trend: "0h" };

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
          <div className="flex-1 flex flex-col">
            {/* AI 输出结果 */}
            <div id="aiResponse" className="mb-4 flex-1 overflow-y-auto flex items-center justify-center">
              <p className="text-slate-400">需要我帮你制定学习计划吗</p>
            </div>
          </div>

          {/* 底部输入区域 */}
          <div className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="制定学习计划"
                className="flex-1 p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="promptInput"
              />
              <button
                onClick={async () => {
                  const prompt = document.getElementById('promptInput') as HTMLInputElement;
                  if (!prompt?.value) return;
                  
                  const responseDiv = document.getElementById('aiResponse') as HTMLDivElement;
                  responseDiv.innerHTML = '<p className="text-slate-400">AI 思考中...</p>';
                  
                  try {
                    const data = await aiApi.deepseek(prompt.value);
                    responseDiv.innerHTML = `
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">${data.answer}</p>
                      </div>
                    `;
                  } catch (error) {
                    console.error('AI 请求失败:', error);
                    responseDiv.innerHTML = '<p className="text-red-500">AI 回答失败，请重试</p>';
                  }
                }}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
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
