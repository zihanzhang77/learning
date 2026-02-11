
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../src/context/UserContext';
import { timerApi } from '../src/services/api';

const Timer: React.FC = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [todayTotal, setTodayTotal] = useState({ hours: 0, minutes: 0 });
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<number | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadTodayData();
    }
  }, [user]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isActive]);

  const loadTodayData = async () => {
    if (!user) return;
    
    try {
      const todayData = await timerApi.getTodaySessions(user.id);
      const totalHours = todayData.total_hours || 0;
      setTodayTotal({
        hours: Math.floor(totalHours),
        minutes: Math.floor((totalHours % 1) * 60)
      });

      const streakData = await timerApi.getStreak(user.id);
      setStreak(streakData.streak || 0);
    } catch (error) {
      console.error('加载今日数据失败:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      m: mins.toString().padStart(2, '0'),
      s: secs.toString().padStart(2, '0')
    };
  };

  const { m, s } = formatTime(timeElapsed);
  
  const totalRef = 25 * 60;
  const progress = Math.min((timeElapsed / totalRef) * 900, 900); 

  const toggleTimer = async () => {
    if (!user) return;
    
    if (!isActive) {
      // 开始计时
      try {
        const session = await timerApi.startTimer(user.id);
        setSessionId(session.id);
        setIsActive(true);
      } catch (error) {
        console.error('开始计时失败:', error);
        alert('开始计时失败，请重试');
      }
    } else {
      // 暂停计时
      if (sessionId) {
        try {
          await timerApi.endTimer(sessionId, timeElapsed);
          await loadTodayData();
          setSessionId(null);
          setIsActive(false);
        } catch (error) {
          console.error('结束计时失败:', error);
        }
      }
      setIsActive(false);
    }
  };
  
  const resetTimer = async () => {
    if (sessionId && user) {
      try {
        await timerApi.endTimer(sessionId, timeElapsed);
        await loadTodayData();
      } catch (error) {
        console.error('重置计时失败:', error);
      }
    }
    setIsActive(false);
    setTimeElapsed(0);
    setSessionId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white px-6">
      <header className="flex items-center justify-between pt-12 pb-6">
        <div className="size-10"></div>
        <h1 className="text-base font-medium tracking-tight text-slate-900">专注计时器</h1>
        <div className="size-10"></div>
      </header>

      <nav className="flex justify-center px-4 mt-4">
        <div className="flex w-full max-w-[280px] h-11 items-center rounded-full bg-slate-100/50 p-1 border border-slate-50">
          <div className="flex h-full flex-1 items-center justify-center rounded-full bg-white shadow-sm text-slate-900 font-bold">
            <span className="text-sm">学习</span>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="relative flex items-center justify-center w-72 h-72">
          <svg className="absolute w-full h-full -rotate-90">
            <circle className="text-slate-50" cx="50%" cy="50%" fill="transparent" r="48%" stroke="currentColor" strokeWidth="2"></circle>
            <circle 
              className="text-slate-900 transition-all duration-1000 ease-linear" 
              cx="50%" cy="50%" fill="transparent" r="48%" 
              stroke="currentColor" 
              strokeDasharray="900" 
              strokeDashoffset={900 - progress} 
              strokeLinecap="round" 
              strokeWidth="2.5"
            ></circle>
          </svg>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-[72px] font-light tracking-tighter tabular-nums leading-none text-slate-900">{m}</span>
              <span className="text-4xl font-light text-slate-300">:</span>
              <span className="text-[72px] font-light tracking-tighter tabular-nums leading-none text-slate-900">{s}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50/50 border border-slate-50">
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-secondary animate-pulse' : 'bg-slate-300'}`}></span>
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                {isActive ? '正在计时' : '准备开始'}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 text-[13px] text-slate-400 font-medium tracking-wide max-w-[200px] text-center leading-relaxed">
          {isActive ? '已开始数秒，请保持高效...' : '点击下方按钮开始您的学习之旅'}
        </p>
      </main>

      <footer className="flex flex-col gap-4 pb-12 w-full max-w-sm mx-auto">
        <div className="flex flex-col gap-4">
          <button 
            onClick={toggleTimer}
            className={`flex h-16 w-full items-center justify-center rounded-[2rem] shadow-[0_15px_30px_-5px_rgba(15,23,42,0.25)] transition-all active:scale-[0.97] duration-300 ${isActive ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'bg-[#0f172a] text-white'}`}
          >
            <span className="material-symbols-outlined mr-2 text-[24px]">
              {isActive ? 'pause_circle' : 'play_circle'}
            </span>
            <span className="font-bold text-base tracking-wide">{isActive ? '暂停学习' : '开始学习'}</span>
          </button>
          
          <button 
            onClick={resetTimer}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 text-[14px] font-bold transition-all active:scale-[0.97] hover:bg-slate-50 shadow-sm"
          >
            <span className="material-symbols-outlined mr-2 text-[18px]">refresh</span>
            重置计时
          </button>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-soft">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">今日累计学习</span>
            <span className="text-sm font-bold text-slate-700 tracking-tight">
              {todayTotal.hours}.{Math.floor(todayTotal.minutes / 6)} 小时
            </span>
          </div>
          <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-soft">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">连续学习天数</span>
            <span className="text-sm font-bold text-slate-700 tracking-tight">{streak} 天</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Timer;
