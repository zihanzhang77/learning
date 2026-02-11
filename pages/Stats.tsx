
import React, { useState, useEffect } from 'react';
import { useUser } from '../src/context/UserContext';
import { statsApi, timerApi } from '../src/services/api';

const Stats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const streakData = await timerApi.getStreak(user.id);
      
      setStatsData({
        total: data.total_hours.toFixed(1),
        avg: data.avg_hours.toFixed(1),
        trend: activeTab === 'all' ? '持续增长' : `+${(data.total_hours * 0.1).toFixed(1)}h`
      });
      setStreak(streakData.streak || 0);
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
          <h1 className="text-lg font-semibold tracking-tight">数据统计</h1>
          <div className="w-10 flex justify-end">
            <span className="material-symbols-outlined text-slate-400">calendar_month</span>
          </div>
        </div>
        <div className="flex px-4 py-2 gap-2 bg-slate-50/50">
          <Tab active={activeTab === 'day'} onClick={() => setActiveTab('day')}>今日</Tab>
          <Tab active={activeTab === 'week'} onClick={() => setActiveTab('week')}>本周</Tab>
          <Tab active={activeTab === 'month'} onClick={() => setActiveTab('month')}>本月</Tab>
          <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>累计</Tab>
        </div>
      </div>

      <main className="flex-1 px-4 pt-6 pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 mb-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">累计学习时间统计</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">{currentData.total}</span>
                <span className="text-slate-400 text-sm font-medium">小时</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-3 items-end h-40 mb-2">
            {activeTab === 'week' && weeklyData.length > 0 ? (
              weeklyData.map((item, i) => {
                const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                const dayName = dayNames[item.day];
                const isToday = new Date().getDay() === item.day;
                const percentage = Math.min(item.percentage || 0, 100);
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex flex-col justify-end items-center h-full">
                      <div className={`bg-secondary/${percentage > 50 ? '90' : '20'} w-4 rounded-t-full transition-all duration-700`} style={{ height: `${percentage}%` }}></div>
                    </div>
                    <p className={`${isToday ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'} text-[10px]`}>{dayName}</p>
                  </div>
                );
              })
            ) : (
              ['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex flex-col justify-end items-center h-full">
                    <div className="bg-secondary/20 w-4 rounded-t-full transition-all duration-700" style={{ height: '20%' }}></div>
                  </div>
                  <p className="text-slate-400 font-medium text-[10px]">{day}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-4 ml-1">详细指标</h3>
        <div className="grid grid-cols-1 mb-6">
          <StatCard 
            icon="schedule" 
            label="累计学习时长" 
            value={currentData.total} 
            unit="小时" 
            color="bg-blue-100" 
            textColor="text-primary" 
            trend={currentData.trend} 
          />
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 flex justify-between items-center overflow-hidden relative mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-orange-400 text-sm fill-1">local_fire_department</span>
              <span className="text-xs text-slate-400 font-medium">专注天数</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">{streak}</span>
              <span className="text-xs text-slate-400">天</span>
            </div>
          </div>
          <div className="relative z-10 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <p className="text-white text-[10px] font-bold">状态良好</p>
            <p className="text-orange-300 text-[10px]">继续保持！</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 mb-4 ml-1">类别分析</h3>
        <div className="space-y-3">
          <CategoryRow icon="menu_book" label="累计学习时长" value="100%" cumulative={currentData.total + " 小时"} color="bg-secondary" />
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
