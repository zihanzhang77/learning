import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取用户的签到数据
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user-attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 签到
router.post('/', async (req, res) => {
  try {
    const { user_id, date } = req.body;

    if (!user_id || !date) {
      return res.status(400).json({ error: '请提供用户ID和日期' });
    }

    // 检查是否已经签到
    const { data: existing, error: existingError } = await supabase
      .from('user-attendance')
      .select('id')
      .eq('user_id', user_id)
      .eq('date', date)
      .single();

    if (existingError) {
      // 如果是因为没有找到记录而报错，这是正常的，继续执行
      if (existingError.message.includes('No rows found') || existingError.message.includes('Cannot coerce')) {
        // 继续执行，说明还没有签到
      } else {
        // 其他错误，抛出异常
        throw existingError;
      }
    }

    if (existing) {
      return res.status(400).json({ error: '今天已经签到过了' });
    }

    // 创建签到记录
    const { data, error } = await supabase
      .from('user-attendance')
      .insert({
        user_id,
        date
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: '签到成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 取消签到
router.delete('/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;

    const { data, error } = await supabase
      .from('user-attendance')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: '取消签到成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;