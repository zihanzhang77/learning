import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../services/api';

interface CalendarProps {
  userId: string | undefined;
  streak: number;
}

const Calendar: React.FC<CalendarProps> = ({ userId, streak }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 生成当前月份的日历数据
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // 添加空白格
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // 添加日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // 切换到上个月
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // 切换到下个月
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  // 检查日期是否已签到
  const isCheckedIn = (day: number) => {
    return attendanceData.has(formatDate(day));
  };

  // 处理签到
  const handleCheckIn = async (day: number) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const date = formatDate(day);
      
      // 调用签到API
      const response: any = await attendanceApi.checkIn(userId, date);
      
      if (response && (response.status === 'ok' || !response.error)) {
        // 更新本地签到数据
        setAttendanceData(prev => new Set(prev).add(date));
        alert('签到成功！');
      } else {
        alert(`签到失败：${response.error || '请重试'}`);
      }
    } catch (error) {
      console.error('签到失败:', error);
      alert('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户的签到数据
  const loadAttendanceData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data: any = await attendanceApi.getAttendance(userId);
      
      if (Array.isArray(data)) {
        const dates = new Set(data.map((item: any) => item.date));
        setAttendanceData(dates);
      }
    } catch (error) {
      console.error('获取签到数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当月份或用户ID变化时，重新加载签到数据
  useEffect(() => {
    loadAttendanceData();
  }, [currentMonth, userId]);

  const calendarDays = generateCalendarDays();
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div>
      {/* 月份导航 */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-slate-400">chevron_left</span>
        </button>
        <h4 className="font-bold text-slate-900">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </h4>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-12"></div>;
          }

          const dateStr = formatDate(day);
          const checkedIn = isCheckedIn(day);
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div 
              key={index} 
              className={`h-12 flex flex-col items-center justify-center rounded-lg border ${isToday ? 'border-secondary bg-secondary/5' : 'border-slate-100'} ${checkedIn ? 'bg-green-50' : ''}`}
            >
              <span className={`text-sm font-medium ${isToday ? 'text-secondary font-bold' : checkedIn ? 'text-green-600' : 'text-slate-700'}`}>
                {day}
              </span>
              {!checkedIn && dateStr <= new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => handleCheckIn(day)}
                  disabled={loading}
                  className="mt-1 text-xs px-2 py-1 bg-secondary text-white rounded-full hover:bg-secondary/80 disabled:opacity-50"
                >
                  {loading ? '签到中...' : (dateStr < new Date().toISOString().split('T')[0] ? '补签' : '签到')}
                </button>
              )}
              {checkedIn && (
                <span className="mt-1 text-xs text-green-500 font-medium">
                  已签到
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 本月学习天数 */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400">local_fire_department</span>
          <div>
            <p className="text-xs text-slate-400">本月学习天数</p>
            <p className="text-xl font-bold text-slate-900">{streak} 天</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;