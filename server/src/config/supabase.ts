import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
// 服务器端使用服务密钥，具有更高的权限
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('警告: Supabase环境变量未设置，请检查.env文件');
  console.warn('将使用模拟数据模式运行');
}

// 创建Supabase客户端
// 注意：当使用服务密钥时，它会自动绕过RLS策略
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('Supabase客户端初始化成功');
} catch (error) {
  console.error('Supabase客户端初始化失败:', error);
  // 创建一个模拟的supabase客户端，避免应用崩溃
  supabase = {
    from: () => ({
      select: () => ({ error: null, data: [] }),
      insert: () => ({ error: null }),
      update: () => ({ error: null, eq: () => ({ select: () => ({ error: null, data: [] }) }) }),
      delete: () => ({ error: null, eq: () => ({ error: null }) })
    }),
    rpc: () => Promise.resolve({ error: null, data: null })
  };
}

export { supabase };
