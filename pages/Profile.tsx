
import React, { useEffect, useState } from 'react';
import { useUser } from '../src/context/UserContext';
import { goalApi, statsApi, timerApi } from '../src/services/api';

const Profile: React.FC = () => {
  const { user } = useUser();
  const [totalHours, setTotalHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goalProgress, setGoalProgress] = useState({ current: 0, target: 2, percentage: 0 });
  const [dailyGoal, setDailyGoal] = useState(2);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const allStats = await statsApi.getStats(user.id, 'all');
      const streakData = await timerApi.getStreak(user.id);
      const goal = await goalApi.getGoal(user.id);
      const todayStats = await statsApi.getStats(user.id, 'day');
      
      setTotalHours(allStats.total_hours || 0);
      setStreak(streakData.streak || 0);
      setDailyGoal(goal.daily_study_hours || 2);
      
      const current = todayStats.total_hours || 0;
      const target = goal.daily_study_hours || 2;
      const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      
      setGoalProgress({
        current,
        target,
        percentage: Math.round(percentage)
      });
    } catch (error) {
      console.error('加载个人数据失败:', error);
    }
  };

  const handleModifyGoal = async () => {
    const newGoal = window.prompt('请输入新的每日学习目标 (小时):', dailyGoal.toString());
    if (newGoal && !isNaN(Number(newGoal)) && user) {
      try {
        await goalApi.updateGoal(user.id, totalHours, Number(newGoal));
        setDailyGoal(Number(newGoal));
        await loadProfileData();
      } catch (error) {
        console.error('更新目标失败:', error);
        alert('更新目标失败，请重试');
      }
    }
  };

  const handleLogout = () => {
    const confirm = window.confirm('您确定要退出登录吗？');
    if (confirm) {
      alert('已成功退出登录');
    }
  };

  return (
    <div className="bg-white min-h-full">
      <header className="sticky top-0 z-50 flex items-center bg-white/90 backdrop-blur-xl px-4 h-14 justify-between border-b border-slate-100">
        <div className="w-10"></div>
        <h1 className="text-[17px] font-semibold tracking-tight">个人中心</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex flex-col">
        <section className="flex flex-col items-center py-8">
          <div className="relative mb-4">
            <div className="size-24 rounded-full bg-slate-100 overflow-hidden border border-slate-100 shadow-sm">
              <img 
                src={user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{user?.name || '用户'}</h2>
          <p className="text-[13px] text-slate-400 mt-1 font-medium tracking-wide">专注等级 LV.{user?.level || 1} · 效率达人</p>
        </section>

        <section className="px-6 py-2 flex justify-around mb-4">
          <StatBox value={Math.floor(totalHours).toString()} label="累计时长" />
          <div className="w-[1px] h-8 bg-slate-100 self-center"></div>
          <StatBox value={streak.toString()} label="连续天数" />
          <div className="w-[1px] h-8 bg-slate-100 self-center"></div>
          <StatBox value={`${goalProgress.percentage}%`} label="目标达成" />
        </section>

        <section className="mt-4">
          <div className="flex items-center justify-between px-6 mb-4">
            <h3 className="text-[17px] font-semibold">每日目标</h3>
            <button onClick={handleModifyGoal} className="text-[14px] text-secondary font-normal">修改</button>
          </div>
          <div className="px-6 space-y-6">
            <GoalProgress 
              icon="menu_book" 
              label="累计学习时长" 
              current={goalProgress.current} 
              target={goalProgress.target} 
              unit="小时" 
              progress={`${goalProgress.percentage}%`} 
            />
          </div>
        </section>

        <section className="mt-10 border-t border-slate-50">
          <div 
            onClick={handleLogout}
            className="px-6 py-5 cursor-pointer active:bg-slate-50 transition-colors"
          >
            <span className="text-[16px] text-red-500 font-black">退出登录</span>
          </div>
        </section>
      </main>
    </div>
  );
};

const StatBox: React.FC<any> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-xl font-medium tracking-tight text-slate-900">{value}</span>
    <span className="text-[11px] text-slate-400 uppercase tracking-widest mt-1 font-black">{label}</span>
  </div>
);

const GoalProgress: React.FC<any> = ({ icon, label, current, target, unit, progress }) => (
  <div>
    <div className="flex justify-between items-end mb-3">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
        <span className="text-[15px] font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[15px] font-black text-slate-900">{current}</span>
        <span className="text-[13px] text-slate-400 font-bold">/ {target} {unit}</span>
      </div>
    </div>
    <div className="h-[4px] w-full bg-slate-50 rounded-full overflow-hidden">
      <div className="h-full bg-secondary rounded-full" style={{ width: progress }}></div>
    </div>
  </div>
);

export default Profile;
