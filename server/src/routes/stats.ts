import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取统计数据
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'week' } = req.query; // day, week, month, all

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date(0); // 从1970年开始
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // 查询study_sessions表中的学习时间
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .order('started_at', { ascending: true });

    if (sessionsError) throw sessionsError;

    // 查询user_time_consumption表中的学习时间
    const { data: timeConsumptionData, error: timeConsumptionError } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (timeConsumptionError) throw timeConsumptionError;

    // 计算总时长（秒）
    const sessionSeconds = sessionsData?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
    const consumptionSeconds = timeConsumptionData?.reduce((sum, item) => sum + (item.study_hours || 0) * 3600, 0) || 0;
    const totalSeconds = sessionSeconds + consumptionSeconds;
    const totalHours = totalSeconds / 3600;

    // 按日期分组统计
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
    let studyDaysCount = 0;
    Object.values(dailyStats).forEach(seconds => {
      if (seconds / 3600 >= 1) {
        studyDaysCount++;
      }
    });

    // 计算平均时长
    const daysCount = Object.keys(dailyStats).length;
    const avgHours = daysCount > 0 ? totalHours / daysCount : 0;

    res.json({
      total_seconds: totalSeconds,
      total_hours: totalHours,
      avg_hours: avgHours,
      days_count: daysCount,
      study_days_count: studyDaysCount, // 学习时长大于1小时的天数
      daily_stats: dailyStats,
      sessions: sessionsData,
      time_consumption: timeConsumptionData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 获取每周活跃度数据
router.get('/:userId/weekly', async (req, res) => {
  try {
    const { userId } = req.params;

    // 获取最近7天的数据
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    if (error) throw error;

    // 按星期几分组（周一到周日）
    const weeklyStats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

    data?.forEach(session => {
      const date = new Date(session.started_at);
      const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
      weeklyStats[dayOfWeek] = (weeklyStats[dayOfWeek] || 0) + (session.duration_seconds || 0);
    });

    // 转换为小时并计算百分比
    const maxHours = Math.max(...Object.values(weeklyStats).map(sec => sec / 3600), 1);
    const weeklyData = [
      { day: 1, hours: weeklyStats[1] / 3600, percentage: (weeklyStats[1] / 3600 / maxHours) * 100 }, // 周一
      { day: 2, hours: weeklyStats[2] / 3600, percentage: (weeklyStats[2] / 3600 / maxHours) * 100 }, // 周二
      { day: 3, hours: weeklyStats[3] / 3600, percentage: (weeklyStats[3] / 3600 / maxHours) * 100 }, // 周三
      { day: 4, hours: weeklyStats[4] / 3600, percentage: (weeklyStats[4] / 3600 / maxHours) * 100 }, // 周四
      { day: 5, hours: weeklyStats[5] / 3600, percentage: (weeklyStats[5] / 3600 / maxHours) * 100 }, // 周五
      { day: 6, hours: weeklyStats[6] / 3600, percentage: (weeklyStats[6] / 3600 / maxHours) * 100 }, // 周六
      { day: 0, hours: weeklyStats[0] / 3600, percentage: (weeklyStats[0] / 3600 / maxHours) * 100 }, // 周日
    ];

    res.json(weeklyData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
