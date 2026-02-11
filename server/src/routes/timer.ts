import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 开始计时 - 创建学习记录
router.post('/start', async (req, res) => {
  try {
    const { user_id, duration_seconds = 0 } = req.body;

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id,
        duration_seconds,
        started_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 结束计时 - 更新学习记录
router.post('/end', async (req, res) => {
  try {
    const { session_id, duration_seconds } = req.body;

    const { data, error } = await supabase
      .from('study_sessions')
      .update({
        duration_seconds,
        ended_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', session_id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户今日学习记录
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', todayStart)
      .lte('started_at', todayEnd)
      .order('started_at', { ascending: false });

    if (error) throw error;

    // 计算今日总时长（秒）
    const totalSeconds = data?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;

    res.json({
      sessions: data,
      total_seconds: totalSeconds,
      total_hours: totalSeconds / 3600
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户连续学习天数
router.get('/streak/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('started_at', { ascending: false });

    if (error) throw error;

    // 计算连续天数
    let streak = 0;
    if (data && data.length > 0) {
      const dates = new Set(
        data.map(session => {
          const date = new Date(session.started_at);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
      );

      const sortedDates = Array.from(dates).sort().reverse();
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      let currentDate = new Date(today);
      for (let i = 0; i < sortedDates.length; i++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        if (sortedDates.includes(dateStr)) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    res.json({ streak });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取用户累计学习天数（学习时长大于1小时的天数）
router.get('/total-days/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 查询study_sessions表中的学习时间
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (sessionsError) throw sessionsError;

    // 查询user_time_consumption表中的学习时间
    const { data: timeConsumptionData, error: timeConsumptionError } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId);

    if (timeConsumptionError) throw timeConsumptionError;

    // 按日期分组统计每天的学习时长
    const dailyStats: Record<string, number> = {};
    
    // 处理study_sessions数据
    sessionsData?.forEach(session => {
      const date = new Date(session.started_at);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyStats[dateStr] = (dailyStats[dateStr] || 0) + (session.duration_seconds || 0);
    });
    
    // 处理user_time_consumption数据
    timeConsumptionData?.forEach(item => {
      const dateStr = item.date;
      dailyStats[dateStr] = (dailyStats[dateStr] || 0) + (item.study_hours || 0) * 3600;
    });

    // 计算学习天数（学习时长大于1小时的天数）
    let totalStudyDays = 0;
    Object.values(dailyStats).forEach(seconds => {
      if (seconds / 3600 >= 1) {
        totalStudyDays++;
      }
    });

    res.json({ total_days: totalStudyDays });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
