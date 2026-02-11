// 模拟数据API服务

// 模拟用户数据
const mockUser = {
  id: '1',
  name: '张子涵',
  phone_number: '15968723587',
  avatar_url: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=user%20avatar&size=200x200'
};

// 模拟认证API
export const authApi = {
  sendCode: async (phoneNumber: string) => {
    return { code: '123456' };
  },
  login: async (phoneNumber: string, code: string, name?: string, password?: string) => {
    return { user: mockUser };
  },
  loginWithPassword: async (phoneNumber: string, password: string) => {
    return { user: mockUser };
  },
  register: async (phoneNumber: string, password: string, name: string) => {
    return { user: mockUser };
  },
};

// 模拟用户API
export const userApi = {
  getUser: async (userId: string) => {
    return mockUser;
  },
  createUser: async (userData: { id: string; name: string; email?: string; phone_number?: string; avatar_url?: string }) => {
    return mockUser;
  },
  updateUser: async (userId: string, updates: any) => {
    return mockUser;
  },
};

// 模拟计时器API
export const timerApi = {
  startTimer: async (userId: string) => {
    return { session_id: '1' };
  },
  endTimer: async (sessionId: string, durationSeconds: number) => {
    return { success: true };
  },
  getTodaySessions: async (userId: string) => {
    return [];
  },
  getStreak: async (userId: string) => {
    return { streak: 2 };
  },
  getTotalDays: async (userId: string) => {
    return { total_days: 2 };
  },
};

// 模拟统计API
export const statsApi = {
  getStats: async (userId: string, period: 'day' | 'week' | 'month' | 'all' = 'week') => {
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
    };
  },
  getWeeklyStats: async (userId: string) => {
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
    };
  },
};

// 模拟目标API
export const goalApi = {
  getGoal: async (userId: string) => {
    return {
      total_study_hours: 100,
      daily_study_minutes: 60
    };
  },
  createOrUpdateGoal: async (userId: string, totalStudyHours: number, dailyStudyMinutes: number) => {
    return {
      total_study_hours: totalStudyHours,
      daily_study_minutes: dailyStudyMinutes
    };
  },
  updateGoal: async (userId: string, totalStudyHours: number, dailyStudyMinutes: number) => {
    return {
      total_study_hours: totalStudyHours,
      daily_study_minutes: dailyStudyMinutes
    };
  },
};

// 模拟时间消耗API
export const timeConsumptionApi = {
  getTimeConsumption: async (userId: string, date: string) => {
    return {
      work_hours: 8,
      game_hours: 1,
      tiktok_hours: 0.5,
      study_hours: 1
    };
  },
  getTimeConsumptionRange: async (userId: string, startDate: string, endDate: string) => {
    return [];
  },
  saveTimeConsumption: async (userId: string, date: string, workHours: number, gameHours: number, tiktokHours: number, studyHours: number) => {
    return { success: true };
  },
};

// 模拟AI API
export const aiApi = {
  deepseek: async (prompt: string) => {
    return {
      thought: `分析用户问题: ${prompt}`,
      answer: `这是对问题"${prompt}"的回答。由于这是一个演示版本，我使用静态数据模拟AI响应。在实际部署中，这里会调用真实的DeepSeek API。`
    };
  }
};
