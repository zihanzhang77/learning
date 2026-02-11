
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../src/context/UserContext';
import { goalApi, statsApi, timerApi } from '../src/services/api';

const Dashboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [studyGoal, setStudyGoal] = useState(200);
  const [totalHours, setTotalHours] = useState(185.2);
  const [todayProgress, setTodayProgress] = useState(75);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userId = user.id;
      
      // 获取目标
      const goal = await goalApi.getGoal(userId);
      setStudyGoal(goal.total_study_hours || 200);
      
      // 获取累计统计
      const allStats = await statsApi.getStats(userId, 'all');
      setTotalHours(allStats.total_hours || 0);
      
      // 获取今日统计
      const todayStats = await statsApi.getStats(userId, 'day');
      const dailyGoal = goal.daily_study_hours || 2;
      const todayPercent = dailyGoal > 0 ? Math.min((todayStats.total_hours / dailyGoal) * 100, 100) : 0;
      setTodayProgress(Math.round(todayPercent));
      
      // 获取每周数据
      const weekly = await statsApi.getWeeklyStats(userId);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newGoal = window.prompt('请输入新的累计学习目标 (小时):', studyGoal.toString());
    if (newGoal && !isNaN(Number(newGoal)) && user) {
      try {
        await goalApi.updateGoal(user.id, Number(newGoal), studyGoal);
        setStudyGoal(Number(newGoal));
      } catch (error) {
        console.error('更新目标失败:', error);
        alert('更新目标失败，请重试');
      }
    }
  };

  return (
    <div className="px-6 pb-20">
      <nav className="flex items-center py-4 justify-between sticky top-0 bg-dashboard/80 backdrop-blur-xl z-10 -mx-6 px-6">
        <button 
          onClick={() => navigate('/profile')}
          className="size-10 rounded-full bg-slate-100 overflow-hidden border border-slate-50 shadow-sm active:scale-95 transition-transform"
        >
          <img 
            src={user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-800">今日仪表盘</h1>
        <div className="size-10"></div>
      </nav>

      <header className="py-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
          早安，<br/>{user?.name || '用户'}
        </h2>
        <p className="text-slate-400 mt-2 font-bold text-sm">你已完成今日目标的 {todayProgress}%！</p>
      </header>

      <div className="mb-8">
        <ProgressCard 
          value={totalHours.toFixed(1)} 
          unit="小时" 
          label="累计学习时长" 
          color="text-secondary" 
          target={`目标: ${studyGoal}h`}
          targetIcon="stars"
          onModifyGoal={handleModifyGoal}
        />
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-slate-50 mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-slate-900">每周活跃度</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">小时</p>
          </div>
          <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full">
            <p className="text-xs font-black tracking-tight">84%</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 h-24">
          {weeklyData.length > 0 ? (
            weeklyData.map((item, idx) => {
              const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
              const dayName = dayNames[item.day];
              const isToday = new Date().getDay() === item.day;
              const percentage = `${item.percentage || 0}%`;
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-3 group">
                  <div 
                    className={`w-full rounded-full transition-all duration-700 ${isToday ? 'bg-secondary shadow-[0_4px_12px_rgba(59,130,246,0.3)]' : 'bg-slate-100 group-hover:bg-slate-200'}`} 
                    style={{ height: mounted ? percentage : '0%' }}
                  ></div>
                  <span className={`text-[10px] font-black ${isToday ? 'text-slate-900' : 'text-slate-300'}`}>{dayName}</span>
                </div>
              );
            })
          ) : (
            // 默认占位数据
            ['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 gap-3 group">
                <div 
                  className="w-full rounded-full bg-slate-100 transition-all duration-700" 
                  style={{ height: mounted ? '20%' : '0%' }}
                ></div>
                <span className="text-[10px] font-black text-slate-300">{day}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-6 flex justify-center pointer-events-none z-40">
        <button 
          onClick={() => navigate('/timer')}
          className="pointer-events-auto flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span className="material-symbols-outlined text-xl fill-1">bolt</span>
          <span className="font-bold text-sm tracking-wide">立即开启专注</span>
        </button>
      </div>
    </div>
  );
};

const ProgressCard: React.FC<any> = ({ value, unit, label, color, target, targetIcon, onModifyGoal }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100 flex flex-col items-center transition-transform hover:scale-[1.01]">
      <div className="relative size-40 mb-6 flex flex-col items-center justify-center border-4 border-slate-50 rounded-full">
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none tracking-tight text-slate-900">{value}</span>
          <span className="text-[11px] text-slate-300 font-black mt-2 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
      <p className="text-[15px] font-bold text-slate-800">{label}</p>
      <button 
        onClick={onModifyGoal}
        className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100/50 hover:bg-slate-100 active:scale-95 transition-all"
      >
        <span className={`material-symbols-outlined text-[16px] ${color} font-bold`}>{targetIcon}</span>
        <p className={`text-[12px] font-black ${color}`}>{target}</p>
      </button>
    </div>
  );
};

export default Dashboard;
