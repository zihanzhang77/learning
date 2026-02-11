import { supabase } from './supabase';

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
    // 模拟上传成功
    return { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId, message: '头像上传成功' };
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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
      
    if (error) throw new Error('用户不存在');
    
    // 简单验证（注意：实际生产应使用Hash）
    if (data.password_hash !== password) {
       throw new Error('密码错误');
    }
    
    return { user: data };
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
    const { count, error } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return { streak: count || 0 };
  },
  getTotalDays: async (userId: string) => {
    const { count, error } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return { total_days: count || 0 };
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
    // 检查是否存在
    const { data: existing } = await supabase
      .from('user_time_consumption')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
      
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
  },
};

// AI API (Mock)
export const aiApi = {
  deepseek: async (prompt: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      thought: `分析用户问题: ${prompt}`,
      answer: `这是对问题"${prompt}"的回答。AI功能目前仅作演示。`
    };
  },
};

// 签到API
export const attendanceApi = {
  getAttendance: async (userId: string) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },
  checkIn: async (userId: string, date: string) => {
    const { data, error } = await supabase
      .from('attendance')
      .insert([{ user_id: userId, date: date }])
      .select()
      .single();
      
    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: '今天已经签到过了' };
        }
        return { error: error.message };
    }
    return { status: 'ok', data };
  },
};
