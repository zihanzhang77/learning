// API基础配置
const API_BASE_URL = 'https://learning-iota-ashy.vercel.app/api';

// 通用请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
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
