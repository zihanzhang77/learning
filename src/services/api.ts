import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 用户API
export const userApi = {
  getUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },
  createUser: async (userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  updateUser: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  uploadAvatar: async (userId: string, formData: FormData) => {
    try {
      // 1. 获取文件并转换为 Base64
      const file = formData.get('avatar') as File;
      if (!file) throw new Error('没有文件');

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      // 2. 尝试直接更新 Supabase (适用于 GitHub Pages 等静态部署)
      const { data, error } = await supabase
        .from('users')
        .update({
          avatar_url: base64Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
         console.warn('Supabase 直接更新失败，尝试后端 API', error);
         // 如果 Supabase 直接更新失败（例如 RLS 限制），尝试回退到后端 API
         // 注意：在 GitHub Pages 上，后端 API 可能不可用
         try {
             const response = await fetch(`${API_URL}/user/avatar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, avatar_data: base64Data, file_name: file.name }),
             });
             if (!response.ok) throw new Error('后端 API 请求失败');
             return await response.json();
         } catch (apiError) {
             throw error; // 抛出最初的 Supabase 错误
         }
      }

      return { status: 'ok', user: data, message: '头像上传成功' };
    } catch (error: any) {
      console.error('上传头像错误:', error);
      return { error: error.message || '上传失败' };
    }
  }
};

// 认证API
export const authApi = {
  sendCode: async (phoneNumber: string) => {
    return { message: '验证码已发送' };
  },
  login: async (phoneNumber: string, code: string, name?: string, password?: string) => {
    // 模拟验证码登录
    return { user: { id: 'mock-id', name: name || 'User', phone_number: phoneNumber } };
  },
  loginWithPassword: async (phoneNumber: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') throw new Error('用户不存在');
        throw error;
      }
      
      // 简单验证（注意：实际生产应使用Hash）
      if (data.password_hash !== password) {
         throw new Error('密码错误');
      }
      
      return { user: data };
    } catch (error: any) {
      console.error('登录失败:', error);
      throw error;
    }
  },
  resetPassword: async (phoneNumber: string, password: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: password })
      .eq('phone_number', phoneNumber)
      .select();
      
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: '用户不存在' };
    return { status: 'ok' };
  },
  register: async (phoneNumber: string, password: string, name: string) => {
    // 检查是否存在
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();
      
    if (existing) throw new Error('该手机号已注册');
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        phone_number: phoneNumber,
        password_hash: password,
        name: name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phoneNumber}`
      }])
      .select()
      .single();
      
    if (error) throw error;
    return { user: data, message: '注册成功' };
  },
  setPassword: async (userId: string, password: string) => {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: password })
      .eq('id', userId);
    if (error) return { error: error.message };
    return { status: 'ok' };
  }
};

// 计时器API
export const diaryApi = {
  // 更新日记AI鼓励
  saveAiEncouragement: async (userId: string, date: string, encouragement: string) => {
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
          .update({ ai_encouragement: encouragement, updated_at: new Date() })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // 如果日记不存在，理论上不应该发生，因为是基于日记生成的。
        // 但为了健壮性，可以创建一个只包含鼓励的记录（或者抛出错误）
        // 这里选择抛出错误，提示用户先写日记
        throw new Error('日记不存在，无法保存鼓励');
      }
    } catch (error) {
      console.error('保存AI鼓励失败:', error);
      throw error;
    }
  },
  
  // 获取日记列表
  getDiaries: async (userId: string) => {
    try {
      // 优先从后端 API 获取，如果失败则尝试直接从 Supabase 获取（容错）
      try {
        const response = await fetch(`${API_URL}/diary/${userId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.warn('API获取日记失败，尝试Supabase直连', e);
      }
      
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
         if (error.code === '42P01') return []; // 表不存在
         throw error;
      }
      return data;
    } catch (error) {
      console.error('获取日记失败:', error);
      return [];
    }
  },
  
  // 获取单篇日记
  getDiaryByDate: async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('获取单篇日记失败:', error);
      return null;
    }
  },

  // 保存日记
  saveDiary: async (userId: string, date: string, title: string, content: string) => {
    try {
      // 检查是否存在
      const { data: existing } = await supabase
        .from('diaries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('diaries')
          .update({ title, content, updated_at: new Date() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('diaries')
          .insert([{ user_id: userId, date, title, content }])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      return result;
    } catch (error) {
      console.error('保存日记失败:', error);
      throw error;
    }
  }
};

export const timerApi = {
  startTimer: async (userId: string) => {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([{
        user_id: userId,
        status: 'active',
        started_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  endTimer: async (sessionId: string, durationSeconds: number) => {
    const { data, error } = await supabase
      .from('study_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  getTodaySessions: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00`)
      .lte('started_at', `${today}T23:59:59`);
    if (error) throw error;
    return data;
  },
  getStreak: async (userId: string) => {
    // 简单计算：查询attendance表
    try {
      const { count, error } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) {
        // 如果表不存在，返回0而不是抛出错误
        if (error.code === '42P01') return { streak: 0 };
        throw error;
      }
      return { streak: count || 0 };
    } catch (error) {
      console.error('获取签到数据失败:', error);
      return { streak: 0 };
    }
  },
  getTotalDays: async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (error) {
        if (error.code === '42P01') return { total_days: 0 };
        throw error;
      }
      return { total_days: count || 0 };
    } catch (error) {
      console.error('获取总天数失败:', error);
      return { total_days: 0 };
    }
  },
};

// 统计API
export const statsApi = {
  getStats: async (userId: string, period: 'day' | 'week' | 'month' | 'all' = 'week') => {
    // 简化实现：获取所有记录并在前端计算
    // 注意：数据量大时应在后端计算
    let query = supabase.from('study_sessions').select('*').eq('user_id', userId).eq('status', 'completed');
    
    const now = new Date();
    if (period === 'day') {
      const today = now.toISOString().split('T')[0];
      query = query.gte('started_at', `${today}T00:00:00`);
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('started_at', weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('started_at', monthAgo);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const totalSeconds = data?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
    const totalHours = totalSeconds / 3600;
    
    // 计算学习天数
    const days = new Set(data?.map(s => s.started_at.split('T')[0])).size;
    
    return {
      total_hours: totalHours,
      avg_hours: days > 0 ? totalHours / days : 0,
      study_days_count: days
    };
  },
  getWeeklyStats: async (userId: string) => {
    // 获取本周数据
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('started_at', monday.toISOString());
      
    if (error) throw error;
    
    // 聚合数据
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dailyHours = new Array(7).fill(0);
    
    data?.forEach(session => {
      const date = new Date(session.started_at);
      let dayIndex = date.getDay() - 1;
      if (dayIndex < 0) dayIndex = 6; // Sunday
      dailyHours[dayIndex] += (session.duration_seconds || 0) / 3600;
    });
    
    return {
      labels: weekDays,
      datasets: [
        {
          label: '学习',
          data: dailyHours,
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1
        }
      ]
    };
  },
};

// 目标API
export const goalApi = {
  getGoal: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    
    return data || { total_study_hours: 200, daily_study_hours: 2 };
  },
  createOrUpdateGoal: async (userId: string, totalStudyHours: number, dailyStudyHours: number) => {
    // 检查是否存在
    const { data: existing } = await supabase
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (existing) {
      return await goalApi.updateGoal(userId, totalStudyHours, dailyStudyHours);
    } else {
      const { data, error } = await supabase
        .from('user_goals')
        .insert([{
          user_id: userId,
          total_study_hours: totalStudyHours,
          daily_study_hours: dailyStudyHours
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  updateGoal: async (userId: string, totalStudyHours: number, dailyStudyHours: number) => {
    const { data, error } = await supabase
      .from('user_goals')
      .update({
        total_study_hours: totalStudyHours,
        daily_study_hours: dailyStudyHours
      })
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// 时间消耗API
export const timeConsumptionApi = {
  getTimeConsumption: async (userId: string, date: string) => {
    const { data, error } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data || { work_hours: 0, game_hours: 0, tiktok_hours: 0, study_hours: 0 };
  },
  getTimeConsumptionRange: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('user_time_consumption')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw error;
    return data || [];
  },
  saveTimeConsumption: async (userId: string, date: string, workHours: number, gameHours: number, tiktokHours: number, studyHours: number) => {
    try {
      // 检查是否存在
      const { data: existing, error: fetchError } = await supabase
        .from('user_time_consumption')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
      
      // 忽略找不到记录的错误，因为这意味着我们需要插入新记录
      if (fetchError && fetchError.code !== 'PGRST116') {
         if (fetchError.code === '42P01') {
            throw new Error('数据库表 user_time_consumption 尚未创建，请联系管理员');
         }
         throw fetchError;
      }
        
      if (existing) {
        const { data, error } = await supabase
          .from('user_time_consumption')
          .update({
            work_hours: workHours,
            game_hours: gameHours,
            tiktok_hours: tiktokHours,
            study_hours: studyHours
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_time_consumption')
          .insert([{
            user_id: userId,
            date: date,
            work_hours: workHours,
            game_hours: gameHours,
            tiktok_hours: tiktokHours,
            study_hours: studyHours
          }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } catch (error: any) {
      console.error('保存时间消耗失败:', error);
      throw error;
    }
  },
};

// AI API
export const aiApi = {
  deepseek: async (prompt: string, mode: 'encouragement' | 'plan' = 'encouragement') => {
    try {
      // 1. 尝试调用后端 API
      const response = await fetch(`${API_URL}/ai/deepseek`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, mode }),
      });

      if (!response.ok) {
        // 如果后端 API 失败 (例如 404, 405, 500)，尝试前端直接调用
        // 注意：这通常不推荐，因为会暴露 API Key，但为了在静态托管(GitHub Pages)上演示功能，作为回退方案
        console.warn('后端 AI API 失败，尝试前端直接调用 DeepSeek API');
        
        // 使用硬编码的 Key (风险提示：生产环境请勿这样做)
        const DEEPSEEK_API_KEY = 'sk-c796903787ff48c297f3532c927d6143'; 
        const directResponse = await fetch('https://api.deepseek.com/v1/chat/completions', { // 尝试 v1
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
           },
           body: JSON.stringify({
             model: 'deepseek-chat',
             messages: [
                { role: 'system', content: mode === 'encouragement' ? '你是一个活泼俏皮的朋友，说话大白话，会用口语化的表达鼓励人，不要太文艺。' : '你是一个专业的技能学习规划师，擅长制定详细的实操计划。' },
                { role: 'user', content: prompt }
             ],
             temperature: 0.2
           })
        });

        if (!directResponse.ok) {
           // 如果直接调用也失败（例如 CORS）
           const errText = await directResponse.text();
           throw new Error(`AI 服务不可用 (后端: ${response.status}, 直接调用: ${directResponse.status} - ${errText})`);
        }
        
        const data = await directResponse.json();
        return { answer: data.choices[0].message.content };
      }

      return await response.json();
    } catch (error: any) {
      console.error('AI API Error:', error);
      // 如果是 fetch 本身的错误（如网络断开，或者 GitHub Pages 405），也尝试直接调用
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('405'))) {
          try {
             console.warn('捕获到网络/405错误，尝试前端直接调用 DeepSeek API');
             const DEEPSEEK_API_KEY = 'sk-c796903787ff48c297f3532c927d6143';
             const directResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                  model: 'deepseek-chat',
                  messages: [
                     { role: 'system', content: mode === 'encouragement' ? '你是一个活泼俏皮的朋友，说话大白话，会用口语化的表达鼓励人，不要太文艺。' : '你是一个专业的技能学习规划师，擅长制定详细的实操计划。' },
                     { role: 'user', content: prompt }
                  ],
                  temperature: 0.2
                })
             });
             if (directResponse.ok) {
                 const data = await directResponse.json();
                 return { answer: data.choices[0].message.content };
             }
          } catch (retryError) {
              console.error('前端直接调用重试失败:', retryError);
          }
      }
      throw error;
    }
  },
};

// 签到API
export const attendanceApi = {
  getAttendance: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        if (error.code === '42P01') return []; // 表不存在
        throw error;
      }
      return data;
    } catch (error) {
      console.error('获取签到列表失败:', error);
      return [];
    }
  },
  checkIn: async (userId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ user_id: userId, date: date }])
        .select()
        .single();
        
      if (error) {
          if (error.code === '23505') { // Unique violation
              return { error: '今天已经签到过了' };
          }
          if (error.code === '42P01') {
             return { error: '数据库表尚未创建，请联系管理员' };
          }
          return { error: error.message };
      }
      return { status: 'ok', data };
    } catch (error: any) {
       return { error: error.message || '签到失败' };
    }
  },
};
