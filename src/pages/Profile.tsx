
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { goalApi, statsApi, timerApi, authApi, userApi, timeConsumptionApi } from '../services/api';

const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useUser();
  const [totalHours, setTotalHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goalProgress, setGoalProgress] = useState({ current: 0, target: 2, percentage: 0 });
  const [dailyGoal, setDailyGoal] = useState(2);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      const [allStats, allTimeConsumption, totalDaysData, goal, todayStats] = await Promise.all([
        statsApi.getStats(user.id, 'all'),
        timeConsumptionApi.getTimeConsumptionRange(user.id, '2000-01-01', '2099-12-31'),
        timerApi.getTotalDays(user.id),
        goalApi.getGoal(user.id),
        statsApi.getStats(user.id, 'day')
      ]);
      
      // 计算总学习时长（学习计时时间 + 手动输入的学习时间）
      const totalManualStudyHours = allTimeConsumption.reduce((sum: number, item: any) => sum + (Number(item.study_hours) || 0), 0);
      const totalTimerHours = Number(allStats.total_hours) || 0;
      const allStudyHours = totalTimerHours + totalManualStudyHours;
      
      setTotalHours(allStudyHours);
      setStreak(totalDaysData.total_days || 0);
      // 将小时转换为分钟
      setDailyGoal((goal.daily_study_hours || 2) * 60);
      
      // 将小时转换为分钟
      const current = (todayStats.total_hours || 0) * 60;
      const target = (goal.daily_study_hours || 2) * 60;
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
    const newGoal = window.prompt('请输入新的每日学习目标 (分钟):', dailyGoal.toString());
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

  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      setPasswordError('请输入密码和确认密码');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    if (!user) {
      setPasswordError('用户信息不存在');
      return;
    }

    try {
      // 调用 API 设置密码
      const response: any = await authApi.setPassword(user.id, password);
      
      if (response && (response.status === 'ok' || !response.error)) {
        alert('密码设置成功！');
        setShowPasswordModal(false);
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
      } else {
        setPasswordError(response.error || '密码设置失败');
      }
    } catch (error) {
      console.error('设置密码失败:', error);
      setPasswordError('网络错误，请重试');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('user_id', user.id);

      // 调用上传API
      const response: any = await userApi.uploadAvatar(user.id, formData);

      if (response && (response.status === 'ok' || !response.error)) {
        // 刷新用户信息，更新头像URL
        await refreshUser();
        alert('头像上传成功！');
      } else {
        alert('头像上传失败，请重试');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      alert('网络错误，请重试');
    }
  };

  const handleLogout = () => {
    const confirm = window.confirm('您确定要退出登录吗？');
    if (confirm) {
      logout();
      navigate('/login');
    }
  };

  const badge = React.useMemo(() => {
    if (streak >= 100) return { name: '王者', color: 'text-yellow-500', icon: 'military_tech', bg: 'bg-yellow-50' };
    if (streak >= 51) return { name: '钻石', color: 'text-cyan-400', icon: 'diamond', bg: 'bg-cyan-50' };
    if (streak >= 22) return { name: '黄金', color: 'text-amber-400', icon: 'workspace_premium', bg: 'bg-amber-50' };
    if (streak >= 8) return { name: '白银', color: 'text-slate-400', icon: 'military_tech', bg: 'bg-slate-50' };
    if (streak >= 4) return { name: '青铜', color: 'text-orange-700', icon: 'military_tech', bg: 'bg-orange-50' };
    return { name: '废铁', color: 'text-slate-600', icon: 'hardware', bg: 'bg-slate-100' };
  }, [streak]);

  const nextLevelInfo = React.useMemo(() => {
    if (streak >= 100) return null; // 已经是最高等级
    if (streak >= 51) return { next: '王者', daysNeeded: 100 - streak };
    if (streak >= 22) return { next: '钻石', daysNeeded: 51 - streak };
    if (streak >= 8) return { next: '黄金', daysNeeded: 22 - streak };
    if (streak >= 4) return { next: '白银', daysNeeded: 8 - streak };
    return { next: '青铜', daysNeeded: 4 - streak };
  }, [streak]);

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
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">{user?.name || '用户'}</h2>
          
          {/* 徽章展示 */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${badge.bg}`}>
            <span className={`material-symbols-outlined text-[18px] ${badge.color}`}>{badge.icon}</span>
            <span className={`text-xs font-bold ${badge.color}`}>{badge.name}</span>
          </div>
          
          {/* 晋升提示 */}
          {nextLevelInfo && (
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              再坚持 {nextLevelInfo.daysNeeded} 天升级为{nextLevelInfo.next}
            </p>
          )}
        </section>

        <section className="px-6 py-2 flex justify-around mb-4">
          <StatBox value={totalHours.toFixed(1)} label="累计学习时长" />
          <div className="w-[1px] h-8 bg-slate-100 self-center"></div>
          <StatBox value={streak.toString()} label="坚持天数" />
        </section>

        <section className="px-6 mb-8">
          <div 
            onClick={handleModifyGoal}
            className="bg-slate-50 rounded-2xl p-5 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-slate-400 text-xl">flag</span>
                <span className="text-[15px] font-bold text-slate-700">每日目标</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[15px] font-black text-slate-900">{Math.round(goalProgress.target)}</span>
                <span className="text-[13px] text-slate-400 font-bold">分钟</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-50">
          <div className="flex items-center justify-between px-6 mb-4">
            <h3 className="text-[17px] font-semibold">账号安全</h3>
          </div>
          <div className="px-6 space-y-4">
            <div 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-between py-4 cursor-pointer active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-xl">lock</span>
                <span className="text-[16px] font-medium text-slate-900">设置登录密码</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>
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

      {/* 密码设置弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[90%] max-w-md p-6">
            <h3 className="text-xl font-semibold mb-6 text-center">设置登录密码</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSetPassword}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
