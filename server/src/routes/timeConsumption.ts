import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取用户指定日期的时间消耗数据
router.get('/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;

    const { data, error } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // 如果没有数据，返回默认值
    if (!data) {
      return res.json({
        user_id: userId,
        date: date,
        work_hours: 0,
        game_hours: 0,
        tiktok_hours: 0,
        study_hours: 0
      });
    }

    res.json(data);
  } catch (error: any) {
    console.log('保存时间消耗数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取用户指定时间范围的时间消耗数据
router.get('/:userId/range/:startDate/:endDate', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.params;

    const { data, error } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.log('获取时间消耗数据失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建或更新用户时间消耗数据
router.post('/', async (req, res) => {
  try {
    console.log('收到保存时间消耗数据的请求:', req.body);
    const { user_id, date, work_hours, game_hours, tiktok_hours, study_hours } = req.body;

    // 先检查是否已存在数据
    console.log('检查是否已存在数据:', { user_id, date });
    // 使用正确的授权头，绕过RLS策略
    const { data: existing, error: existingError } = await supabase
      .from('user_time_consumption')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', date)
      .single();
    
    // 忽略"result contains 0 rows"的错误，因为这是正常的
    if (existingError && existingError.code !== 'PGRST116') {
      console.log('检查现有数据时的错误:', existingError);
      // 如果是表不存在的错误，返回更详细的错误信息
      if (existingError.message.includes('Could not find the table')) {
        return res.status(500).json({ 
          error: '数据库表不存在，请在Supabase控制台中创建user_time_consumption表',
          details: '请参考server/database/schema.sql文件中的表结构定义'
        });
      }
    }

    let result;
    if (existing) {
      // 更新现有数据
      console.log('更新现有数据:', { id: existing.id });
      const { data, error } = await supabase
        .from('user_time_consumption')
        .update({
          work_hours,
          game_hours,
          tiktok_hours,
          study_hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.log('更新数据时的错误:', error);
        throw error;
      }
      console.log('更新数据成功:', data);
      result = data;
    } else {
      // 创建新数据
      console.log('创建新数据:', { user_id, date });
      const { data, error } = await supabase
        .from('user_time_consumption')
        .insert({
          user_id,
          date,
          work_hours,
          game_hours,
          tiktok_hours,
          study_hours
        })
        .select()
        .single();

      if (error) {
        console.log('创建数据时的错误:', error);
        throw error;
      }
      console.log('创建数据成功:', data);
      result = data;
    }

    console.log('返回结果:', result);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;