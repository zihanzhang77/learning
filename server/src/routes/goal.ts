import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取用户目标
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // 如果没有目标，返回默认值（10分钟）
    if (!data) {
      return res.json({
        user_id: userId,
        total_study_hours: 200,
        daily_study_hours: 10 / 60, // 转换为小时
        created_at: new Date().toISOString()
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建或更新用户目标
router.post('/', async (req, res) => {
  try {
    const { user_id, total_study_hours, daily_study_minutes } = req.body;
    
    // 将分钟转换为小时
    const daily_study_hours = daily_study_minutes / 60;

    // 先检查是否已存在目标
    const { data: existing } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let result;
    if (existing) {
      // 更新现有目标
      const { data, error } = await supabase
        .from('user_goals')
        .update({
          total_study_hours,
          daily_study_hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 创建新目标
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id,
          total_study_hours,
          daily_study_hours
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户目标
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { total_study_hours, daily_study_minutes } = req.body;
    
    // 将分钟转换为小时
    const daily_study_hours = daily_study_minutes / 60;

    const { data, error } = await supabase
      .from('user_goals')
      .update({
        total_study_hours,
        daily_study_hours,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
