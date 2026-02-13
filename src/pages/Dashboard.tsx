
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { goalApi, statsApi, timerApi, timeConsumptionApi, attendanceApi } from '../services/api';
import Calendar from '../components/Calendar';

const Dashboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [studyGoal, setStudyGoal] = useState(200);
  const [totalMinutes, setTotalMinutes] = useState(11112);
  const [todayProgress, setTodayProgress] = useState(75);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 时间消耗相关状态
  const [timeConsumption, setTimeConsumption] = useState<any>({
    work: 0,
    game: 0,
    tiktok: 0,
    study: ''
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weeklyTimeData, setWeeklyTimeData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, [user, selectedDate]);



  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userId = user.id;
      const today = new Date().toISOString().split('T')[0]; // 获取今天的日期
      
      // 获取目标
      const goal = await goalApi.getGoal(userId);
      setStudyGoal(goal.total_study_hours || 200);
      setDailyGoal(goal.daily_study_hours ? goal.daily_study_hours * 60 : 10);
      
      // 获取累计统计
      const allStats = await statsApi.getStats(userId, 'all');
      
      // 获取本月学习天数（基于签到数据）
      const attendanceList = await attendanceApi.getAttendance(userId);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      // 计算本月签到天数
      const monthStudyDays = attendanceList.filter((item: any) => {
        const d = new Date(item.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      setStreak(monthStudyDays || 0);
      
      // 获取选定日期的时间消耗数据
      const selectedDateData = await timeConsumptionApi.getTimeConsumption(userId, selectedDate);
      
      // 获取用户所有的时间消耗数据以计算手动输入的总学习时长
      const allTimeConsumption = await timeConsumptionApi.getTimeConsumptionRange(userId, '2000-01-01', '2099-12-31');
      const totalManualStudyHours = allTimeConsumption.reduce((sum: number, item: any) => sum + (Number(item.study_hours) || 0), 0);
      
      // 计算总学习时长（学习计时时间 + 手动输入的学习时间）
      const totalTimerHours = Number(allStats.total_hours) || 0;
      const allStudyHours = totalTimerHours + totalManualStudyHours;
      
      // setTotalMinutes 存储的是总分钟数
      setTotalMinutes(Math.round(allStudyHours * 60));
      
      // 获取今日统计
      const todayStats = await statsApi.getStats(userId, 'day');
      const dailyGoalMinutes = goal.daily_study_hours ? goal.daily_study_hours * 60 : 10;
      
      // 计算今日学习时长（学习计时时间 + 手动输入的学习时间）
      const todayStudyHours = (todayStats.total_hours || 0) + (selectedDateData.study_hours || 0);
      const todayMinutes = todayStudyHours * 60;
      const todayPercent = dailyGoalMinutes > 0 ? Math.min((todayMinutes / dailyGoalMinutes) * 100, 100) : 0;
      setTodayProgress(Math.round(todayPercent));
      
      // 设置时间消耗数据
      setTimeConsumption({
        work: 0,
        game: 0,
        tiktok: 0,
        study: selectedDateData.study_hours || ''
      });
      
      // 获取每周数据
      const weekly = await statsApi.getWeeklyStats(userId);
      setWeeklyData(weekly);
      
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
        userId,
        monday.toISOString().split('T')[0],
        sunday.toISOString().split('T')[0]
      );
      setWeeklyTimeData(weeklyTimeData);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyTotalGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newGoal = window.prompt('请输入新的累计学习目标 (小时):', studyGoal.toString());
    if (newGoal && !isNaN(Number(newGoal)) && user) {
      try {
        await goalApi.updateGoal(user.id, Number(newGoal), dailyGoal / 60);
        setStudyGoal(Number(newGoal));
      } catch (error) {
        console.error('更新目标失败:', error);
        alert('更新目标失败，请重试');
      }
    }
  };

  const handleModifyDailyGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDailyGoal = window.prompt('请输入新的每日学习目标 (分钟):', dailyGoal.toString());
    if (newDailyGoal && !isNaN(Number(newDailyGoal)) && user) {
      try {
        await goalApi.updateGoal(user.id, studyGoal, Number(newDailyGoal));
        setDailyGoal(Number(newDailyGoal));
        // 重新加载数据以更新进度
        await loadDashboardData();
      } catch (error) {
        console.error('更新每日目标失败:', error);
        alert('更新每日目标失败，请重试');
      }
    }
  };

  // 处理时间消耗数据保存
  const handleSaveTimeConsumption = async () => {
    if (!user) return;
    
    try {
      const userId = user.id;
      
      await timeConsumptionApi.saveTimeConsumption(
        userId,
        selectedDate,
        0, // work
        0, // game
        0, // tiktok
        timeConsumption.study
      );
      
      alert('时间消耗数据保存成功！');
      // 重新加载数据以更新图表
      await loadDashboardData();
    } catch (error) {
      console.error('保存时间消耗数据失败:', error);
      alert('保存时间消耗数据失败，请重试');
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
          欢迎回来，{user?.name || '用户'}！
        </h2>
      </header>

      {/* 签到日历 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900">签到日历</h3>
        </div>
        <Calendar userId={user?.id} streak={streak} />
      </div>

      {/* 时间消耗输入部分 */}
      <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-slate-50 mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-slate-900">今日学习时长</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">小时</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <button 
              onClick={handleSaveTimeConsumption}
              className="bg-secondary text-white px-4 py-2 rounded-full text-sm font-bold"
            >
              保存
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">学习时间</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={timeConsumption.study}
                onChange={(e) => setTimeConsumption({ ...timeConsumption, study: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 每周时间消耗柱状图 */}
      <div className="bg-white rounded-[2rem] p-6 shadow-soft border border-slate-50 mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-slate-900">每周时间消耗</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">小时</p>
          </div>
        </div>
        <div className="h-60 flex gap-3">
          {/* Y-axis */}
          <div className="flex flex-col justify-between items-end h-[calc(100%-1.5rem)] text-[10px] text-slate-400 font-bold">
            <span>5h</span>
            <span>4h</span>
            <span>3h</span>
            <span>2h</span>
            <span>1h</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-full flex-1">
            {/* 生成周一至周日的数据 */}
            {[1, 2, 3, 4, 5, 6, 0].map((dayIndex, idx) => {
              const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
              const dayName = dayNames[dayIndex];
              
              // 计算当前周的对应日期
              const today = new Date();
              const currentDay = today.getDay();
              const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
              const monday = new Date(today);
              monday.setDate(today.getDate() - daysToMonday); // 本周一
              
              const targetDate = new Date(monday);
              const targetDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 转换成 0-6 (周一到周日)
              targetDate.setDate(monday.getDate() + targetDayIndex);
              
              const isToday = dayIndex === currentDay;
              
              // 查找对应日期的数据
              const dayData = weeklyTimeData.find(item => {
                const itemDate = new Date(item.date);
                return itemDate.toDateString() === targetDate.toDateString();
              });
              
              const maxHours = 5;
              const study_hours = dayData?.study_hours || 0;
              
              const studyHeight = Math.min((study_hours / maxHours) * 100, 100);
              
              // 生成悬停提示内容
              let tooltipContent = '';
              if (dayData) {
                tooltipContent = `学习时长: ${study_hours}小时`;
              } else {
                tooltipContent = '无数据';
              }
              
              // 检查是否有数据
              const hasData = study_hours > 0;
              
              return (
                <div key={idx} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
                  <div className="w-4 flex flex-col justify-end items-center h-full gap-1" title={tooltipContent}>
                    <div 
                      className={`w-full rounded-full ${hasData ? 'bg-purple-500' : 'bg-slate-300'}`} 
                      style={{ height: hasData ? `${studyHeight}%` : '2%' }}
                      title={hasData ? `学习时长: ${study_hours}小时` : '无数据'}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-black ${isToday ? 'text-slate-900' : 'text-slate-300'}`}>{dayName}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-slate-600">学习时长</span>
          </div>
        </div>
      </div>




    </div>
  );
};

const ProgressCard: React.FC<any> = ({ value, unit, label, color }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-card border border-slate-100 flex flex-col items-center transition-transform hover:scale-[1.01]">
      <div className="relative size-40 mb-6 flex flex-col items-center justify-center border-4 border-slate-50 rounded-full">
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none tracking-tight text-slate-900">{value}</span>
          <span className="text-[11px] text-slate-300 font-black mt-2 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
      <p className="text-[15px] font-bold text-slate-800">{label}</p>
    </div>
  );
};

export default Dashboard;
