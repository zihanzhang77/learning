import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { timeConsumptionApi } from '../services/api';

const Timer: React.FC = () => {
  // 计时器相关状态
  const [timers, setTimers] = useState({
    work: { isRunning: false, seconds: 0, startTime: 0 },
    game: { isRunning: false, seconds: 0, startTime: 0 },
    tiktok: { isRunning: false, seconds: 0, startTime: 0 },
    study: { isRunning: false, seconds: 0, startTime: 0 }
  });
  const [timerIntervals, setTimerIntervals] = useState({
    work: null as NodeJS.Timeout | null,
    game: null as NodeJS.Timeout | null,
    tiktok: null as NodeJS.Timeout | null,
    study: null as NodeJS.Timeout | null
  });
  // 时间消耗相关状态
  const [timeConsumption, setTimeConsumption] = useState({
    work: 0,
    game: 0,
    tiktok: 0,
    study: 0
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useUser();

  // 清理计时器
  useEffect(() => {
    return () => {
      Object.values(timerIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [timerIntervals]);

  // 开始计时器
  const startTimer = (type: 'work' | 'game' | 'tiktok' | 'study') => {
    // 暂停所有其他计时器
    setTimers(prev => ({
      work: type === 'work' ? { ...prev.work, isRunning: true, startTime: Date.now() - prev.work.seconds * 1000 } : { ...prev.work, isRunning: false },
      game: type === 'game' ? { ...prev.game, isRunning: true, startTime: Date.now() - prev.game.seconds * 1000 } : { ...prev.game, isRunning: false },
      tiktok: type === 'tiktok' ? { ...prev.tiktok, isRunning: true, startTime: Date.now() - prev.tiktok.seconds * 1000 } : { ...prev.tiktok, isRunning: false },
      study: type === 'study' ? { ...prev.study, isRunning: true, startTime: Date.now() - prev.study.seconds * 1000 } : { ...prev.study, isRunning: false }
    }));
    
    // 清除所有旧的计时器间隔
    setTimerIntervals({
      work: null,
      game: null,
      tiktok: null,
      study: null
    });
    
    // 启动新的计时器
    const interval = setInterval(() => {
      setTimers(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          seconds: Math.floor((Date.now() - prev[type].startTime) / 1000)
        }
      }));
    }, 1000);
    
    // 保存新的计时器间隔
    setTimerIntervals(prev => ({
      ...prev,
      [type]: interval
    }));
  };

  // 暂停计时器
  const pauseTimer = (type: 'work' | 'game' | 'tiktok' | 'study') => {
    if (timerIntervals[type]) {
      clearInterval(timerIntervals[type]);
      setTimerIntervals(prev => ({
        ...prev,
        [type]: null
      }));
      setTimers(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isRunning: false
        }
      }));
    }
  };

  // 重置计时器
  const resetTimer = (type: 'work' | 'game' | 'tiktok' | 'study') => {
    if (timerIntervals[type]) {
      clearInterval(timerIntervals[type]);
      setTimerIntervals(prev => ({
        ...prev,
        [type]: null
      }));
    }
    setTimers(prev => ({
      ...prev,
      [type]: {
        isRunning: false,
        seconds: 0,
        startTime: 0
      }
    }));
  };

  // 保存计时器数据
  const saveTimerData = (type: 'work' | 'game' | 'tiktok' | 'study') => {
    const hours = timers[type].seconds / 3600;
    setTimeConsumption(prev => ({
      ...prev,
      [type]: parseFloat(hours.toFixed(1))
    }));
  };

  // 保存时间消耗数据
  const saveTimeConsumptionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setSaveSuccess(false);
      
      const userId = user.id;
      
      // 计算所有计时器的时间（转换为小时）
      const workHours = timers.work.seconds / 3600;
      const gameHours = timers.game.seconds / 3600;
      const tiktokHours = timers.tiktok.seconds / 3600;
      const studyHours = timers.study.seconds / 3600;
      
      await timeConsumptionApi.saveTimeConsumption(
        userId, 
        selectedDate, 
        parseFloat(workHours.toFixed(1)),
        parseFloat(gameHours.toFixed(1)),
        parseFloat(tiktokHours.toFixed(1)),
        parseFloat(studyHours.toFixed(1))
      );
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('保存时间数据失败:', error);
      alert('保存时间数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pb-20">
      <header className="flex items-center justify-between pt-12 pb-6">
        <div className="size-10"></div>
        <h1 className="text-base font-medium tracking-tight text-slate-900">专注计时器</h1>
        <div className="size-10"></div>
      </header>

      {/* 时间计时器部分 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-bold text-slate-900">时间计时器</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">小时</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* 上班时间计时器 */}
          <div className="border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-slate-700">上班时间</h5>
              <div className="flex gap-2">
                {!timers.work.isRunning ? (
                  <button 
                    onClick={() => startTimer('work')}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    开始
                  </button>
                ) : (
                  <button 
                    onClick={() => pauseTimer('work')}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    暂停
                  </button>
                )}
              </div>
            </div>
            <div className="text-center py-2">
              <span className="text-xl font-bold">
                {Math.floor(timers.work.seconds / 3600)}:{Math.floor((timers.work.seconds % 3600) / 60).toString().padStart(2, '0')}:{Math.floor(timers.work.seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* 游戏时间计时器 */}
          <div className="border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-slate-700">游戏时间</h5>
              <div className="flex gap-2">
                {!timers.game.isRunning ? (
                  <button 
                    onClick={() => startTimer('game')}
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    开始
                  </button>
                ) : (
                  <button 
                    onClick={() => pauseTimer('game')}
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    暂停
                  </button>
                )}
              </div>
            </div>
            <div className="text-center py-2">
              <span className="text-xl font-bold">
                {Math.floor(timers.game.seconds / 3600)}:{Math.floor((timers.game.seconds % 3600) / 60).toString().padStart(2, '0')}:{Math.floor(timers.game.seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* 抖音时间计时器 */}
          <div className="border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-slate-700">抖音时间</h5>
              <div className="flex gap-2">
                {!timers.tiktok.isRunning ? (
                  <button 
                    onClick={() => startTimer('tiktok')}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    开始
                  </button>
                ) : (
                  <button 
                    onClick={() => pauseTimer('tiktok')}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    暂停
                  </button>
                )}
              </div>
            </div>
            <div className="text-center py-2">
              <span className="text-xl font-bold">
                {Math.floor(timers.tiktok.seconds / 3600)}:{Math.floor((timers.tiktok.seconds % 3600) / 60).toString().padStart(2, '0')}:{Math.floor(timers.tiktok.seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* 学习时间计时器 */}
          <div className="border border-slate-100 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-slate-700">学习时间</h5>
              <div className="flex gap-2">
                {!timers.study.isRunning ? (
                  <button 
                    onClick={() => startTimer('study')}
                    className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    开始
                  </button>
                ) : (
                  <button 
                    onClick={() => pauseTimer('study')}
                    className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                  >
                    暂停
                  </button>
                )}
              </div>
            </div>
            <div className="text-center py-2">
              <span className="text-xl font-bold">
                {Math.floor(timers.study.seconds / 3600)}:{Math.floor((timers.study.seconds % 3600) / 60).toString().padStart(2, '0')}:{Math.floor(timers.study.seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        {/* 保存时间数据按钮 */}
        <div className="mt-6">
          <button 
            onClick={saveTimeConsumptionData}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            {loading ? '保存中...' : (saveSuccess ? '保存成功！' : '保存时间数据')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timer;