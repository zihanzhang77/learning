
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { goalApi, statsApi, timerApi, authApi, userApi, timeConsumptionApi } from '../services/api';

import LearningProfileCard from '../components/LearningProfileCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Profile: React.FC = () => {
  const { user, logout, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const [learningProfile, setLearningProfile] = useState({
    topic: '',
    target: '',
    level: '',
    planStartDate: '',
    planEndDate: '',
    detailedPlan: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const safeRequest = async <T>(promise: Promise<T>, defaultValue: T): Promise<T> => {
        try {
          return await promise;
        } catch (error) {
          console.warn('Request failed (using default):', error);
          return defaultValue;
        }
      };

      // 并行获取所有数据，包括用户信息
      const [userData, allStats, totalManualStudyHours, totalDaysData, goal, todayStats] = await Promise.all([
        safeRequest(userApi.getUser(user.id), {}),
        safeRequest(statsApi.getStats(user.id, 'all'), { total_hours: 0 }),
        safeRequest(timeConsumptionApi.getTotalManualTime(user.id), 0),
        safeRequest(timerApi.getTotalDays(user.id), { total_days: 0 }),
        safeRequest(goalApi.getGoal(user.id), { daily_study_hours: 2 }),
        safeRequest(statsApi.getStats(user.id, 'day'), { total_hours: 0 })
      ]);

      setLearningProfile({
        topic: userData.learning_topic || '',
        target: userData.target_goal || '',
        level: userData.current_level || '',
        planStartDate: userData.plan_start_date || '',
        planEndDate: userData.plan_end_date || '',
        detailedPlan: userData.learning_plan || ''
      });
      
      // 计算总学习时长（学习计时时间 + 手动输入的学习时间）
      const totalTimerHours = Number(allStats.total_hours) || 0;
      const allStudyHours = totalTimerHours + totalManualStudyHours;
      
      setTotalHours(allStudyHours);
      setStreak(totalDaysData.total_days || 0);
      // 将小时转换为分钟
      setDailyGoal((goal.daily_study_hours || 2) * 60);
      
    } catch (error) {
      console.error('加载个人数据失败:', error);
    } finally {
      setLoading(false);
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

  const handleSaveLearningProfile = async () => {
    if (!user) return;
    try {
      await userApi.updateUser(user.id, {
        learning_topic: learningProfile.topic,
        target_goal: learningProfile.target,
        current_level: learningProfile.level
      });
      setIsEditingProfile(false);
      alert('学习档案已更新');
    } catch (error) {
      console.error('更新学习档案失败:', error);
      alert('更新失败，请重试');
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
              再学习 {nextLevelInfo.daysNeeded} 天升级为{nextLevelInfo.next}
            </p>
          )}
        </section>

        <section className="px-6 py-2 flex justify-around mb-4">
          <StatBox value={totalHours.toFixed(1)} label="累计学习时长" />
          <div className="w-[1px] h-8 bg-slate-100 self-center"></div>
          <StatBox value={streak.toString()} label="学习天数" />
        </section>

        {/* 学习档案 */}
        <section className="border-t border-slate-50 mb-8">
          <div className="flex items-center justify-between px-6 py-4">
            <h3 className="text-[17px] font-semibold">学习档案</h3>
            {!isEditingProfile ? (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-sm text-blue-500 font-medium"
              >
                编辑
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="text-sm text-slate-400 font-medium"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveLearningProfile}
                  className="text-sm text-blue-500 font-medium"
                >
                  保存
                </button>
              </div>
            )}
          </div>
          
          <div className="px-6 space-y-4">
            <LearningProfileCard 
              learningProfile={learningProfile}
              isEditing={isEditingProfile}
              onProfileChange={setLearningProfile}
            />
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

      {/* 学习计划详情弹窗 */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">school</span>
                <h3 className="text-lg font-bold text-slate-800">具体学习计划</h3>
              </div>
              <button 
                onClick={() => setShowPlanModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
              <div className="prose prose-sm md:prose-base max-w-none text-slate-700
                prose-headings:font-bold prose-headings:text-slate-800
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-p:leading-relaxed prose-li:marker:text-blue-500
                prose-strong:text-slate-900 prose-strong:font-black
                prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:rounded-xl
                prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {learningProfile.detailedPlan}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
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
