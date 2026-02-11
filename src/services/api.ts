// 模拟数据API服务

// 模拟用户数据
const mockUser = {
  id: '1',
  name: '张子涵',
  phone_number: '15968723587',
  avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=user%20avatar&size=200x200'
};

// 通用请求函数 - 使用模拟数据
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 根据请求路径返回模拟数据
  if (endpoint.includes('/auth/login-with-password')) {
    return { user: mockUser } as T;
  }
  
  if (endpoint.includes('/auth/register')) {
    return { user: mockUser, message: '注册成功' } as T;
  }
  
  if (endpoint.includes('/timer/streak')) {
    return { streak: 2 } as T;
  }
  
  if (endpoint.includes('/timer/total-days')) {
    return { total_days: 2 } as T;
  }
  
  if (endpoint.includes('/stats/')) {
    return {
      total_hours: 2.5,
      daily_average: 1.25,
      weekly_data: [
        { day: '周一', hours: 1 },
        { day: '周二', hours: 1.5 },
        { day: '周三', hours: 0 },
        { day: '周四', hours: 0 },
        { day: '周五', hours: 0 },
        { day: '周六', hours: 0 },
        { day: '周日', hours: 0 }
      ]
    } as T;
  }
  
  if (endpoint.includes('/stats/') && endpoint.includes('/weekly')) {
    return {
      labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      datasets: [
        {
          label: '学习',
          data: [1, 1.5, 0, 0, 0, 0, 0],
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: '上班',
          data: [8, 8, 8, 8, 8, 0, 0],
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        {
          label: '游戏',
          data: [1, 0.5, 0, 0, 0, 0, 0],
          backgroundColor: '#8b5cf6',
          borderColor: '#8b5cf6',
          borderWidth: 1
        },
        {
          label: '抖音',
          data: [0.5, 0.5, 0, 0, 0, 0, 0],
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 1
        }
      ]
    } as T;
  }
  
  if (endpoint.includes('/goal/')) {
    return {
      total_study_hours: 100,
      daily_study_minutes: 60
    } as T;
  }
  
  if (endpoint.includes('/time-consumption/')) {
    return {
      work_hours: 8,
      game_hours: 1,
      tiktok_hours: 0.5,
      study_hours: 1
    } as T;
  }
  
  if (endpoint.includes('/ai/deepseek')) {
    const prompt = JSON.parse(options.body as string).prompt;
    return {
      thought: `分析用户问题: ${prompt}`,
      answer: `这是对问题"${prompt}"的回答。由于这是一个演示版本，我使用静态数据模拟AI响应。在实际部署中，这里会调用真实的DeepSeek API。`
    } as T;
  }
  
  return {} as T;
}

// 用户API
export const userApi = {
  getUser: (userId: string) => request(`/user/${userId}`),
  createUser: (userData: { id: string; name: string; email?: string; phone_number?: string; avatar_url?: string }) =>
    request('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  updateUser: (userId: string, updates: any) =>
    request(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// 认证API
export const authApi = {
  sendCode: (phoneNumber: string) =>
    request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),
  login: (phoneNumber: string, code: string, name?: string, password?: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, code, name, password }),
    }),
  loginWithPassword: (phoneNumber: string, password: string) =>
    request('/auth/login-with-password', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, password }),
    }),
  register: (phoneNumber: string, password: string, name: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, password, name }),
    }),
};

// 计时器API
export const timerApi = {
  startTimer: (userId: string) =>
    request('/timer/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),
  endTimer: (sessionId: string, durationSeconds: number) =>
    request('/timer/end', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, duration_seconds: durationSeconds }),
    }),
  getTodaySessions: (userId: string) => request(`/timer/today/${userId}`),
  getStreak: (userId: string) => request(`/timer/streak/${userId}`),
  getTotalDays: (userId: string) => request(`/timer/total-days/${userId}`),
};

// 统计API
export const statsApi = {
  getStats: (userId: string, period: 'day' | 'week' | 'month' | 'all' = 'week') =>
    request(`/stats/${userId}?period=${period}`),
  getWeeklyStats: (userId: string) => request(`/stats/${userId}/weekly`),
};

// 目标API
export const goalApi = {
  getGoal: (userId: string) => request(`/goal/${userId}`),
  createOrUpdateGoal: (userId: string, totalStudyHours: number, dailyStudyMinutes: number) =>
    request('/goal', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        total_study_hours: totalStudyHours,
        daily_study_minutes: dailyStudyMinutes,
      }),
    }),
  updateGoal: (userId: string, totalStudyHours: number, dailyStudyMinutes: number) =>
    request(`/goal/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        total_study_hours: totalStudyHours,
        daily_study_minutes: dailyStudyMinutes,
      }),
    }),
};

// 时间消耗API
export const timeConsumptionApi = {
  getTimeConsumption: (userId: string, date: string) => request(`/time-consumption/${userId}/${date}`),
  getTimeConsumptionRange: (userId: string, startDate: string, endDate: string) => request(`/time-consumption/${userId}/range/${startDate}/${endDate}`),
  saveTimeConsumption: (userId: string, date: string, workHours: number, gameHours: number, tiktokHours: number, studyHours: number) =>
    request('/time-consumption', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        date: date,
        work_hours: workHours,
        game_hours: gameHours,
        tiktok_hours: tiktokHours,
        study_hours: studyHours,
      }),
    }),
};

// AI API
export const aiApi = {
  deepseek: (prompt: string) =>
    request('/ai/deepseek', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};
