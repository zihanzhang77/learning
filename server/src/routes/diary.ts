import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取用户的日记列表
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('获取日记失败:', error);
    res.status(500).json({ error: '获取日记失败' });
  }
});

// 获取单篇日记 (按日期)
router.get('/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "The result contains 0 rows"
    res.json(data || null);
  } catch (error: any) {
    console.error('获取日记失败:', error);
    res.status(500).json({ error: '获取日记失败' });
  }
});

// 创建或更新日记
router.post('/', async (req, res) => {
  const { userId, date, title, content } = req.body;

  try {
    // 检查是否存在
    const { data: existing } = await supabase
      .from('diaries')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (existing) {
      // 更新
      const { data, error } = await supabase
        .from('diaries')
        .update({ title, content, updated_at: new Date() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } else {
      // 创建
      const { data, error } = await supabase
        .from('diaries')
        .insert([{ user_id: userId, date, title, content }])
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    }
  } catch (error: any) {
    console.error('保存日记失败:', error);
    res.status(500).json({ error: '保存日记失败' });
  }
});

export default router;
