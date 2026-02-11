import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import timerRoutes from './routes/timer.js';
import statsRoutes from './routes/stats.js';
import goalRoutes from './routes/goal.js';
import authRoutes from './routes/auth.js';
import timeConsumptionRoutes from './routes/timeConsumption.js';
import attendanceRoutes from './routes/attendance.js';
import aiRoutes from './routes/ai.js';
import { supabase } from './config/supabase.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库结构
async function initDatabase() {
  try {
    console.log('正在初始化数据库结构...');
    
    // 检查并添加 password_hash 列
    const { error: addColumnError } = await supabase
      .from('users')
      .update({ password_hash: null })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select();
    
    if (addColumnError && addColumnError.message.includes('password_hash')) {
      console.log('添加 password_hash 列...');
      // 这里应该使用 SQL 来添加列，但由于 Supabase 客户端限制，我们需要在设置密码时处理
    }
    
    // 尝试使用直接的数据库操作来创建表
    // 注意：在实际生产环境中，应该使用数据库迁移工具来管理表结构
    // 由于Supabase客户端库不直接支持执行CREATE TABLE语句，
  // 我们需要通过尝试插入数据来间接检查表是否存在
  // 检查用户时间消耗表是否存在
  console.log('尝试创建用户时间消耗表...');
  
  try {
    // 尝试插入一条测试数据来检查表是否存在
    const { error: insertError } = await supabase
      .from('user_time_consumption')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        date: new Date().toISOString().split('T')[0],
        work_hours: 0,
        game_hours: 0,
        tiktok_hours: 0,
        study_hours: 0
      });
    
    if (insertError && insertError.message.includes('Could not find the table')) {
      console.log('表不存在，需要在Supabase控制台中创建user_time_consumption表');
      console.log('请参考server/database/schema.sql文件中的表结构定义');
    } else if (!insertError) {
      console.log('表已存在，测试插入成功');
      // 删除测试数据
      await supabase
        .from('user_time_consumption')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
  } catch (error) {
    console.log('检查表结构时的错误:', error);
  }
  
  // 检查签到表是否存在
  console.log('尝试创建签到表...');
  
  try {
    // 尝试插入一条测试数据来检查表是否存在
    const { error: insertError } = await supabase
      .from('user-attendance')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        date: new Date().toISOString().split('T')[0]
      });
    
    if (insertError && insertError.message.includes('Could not find the table')) {
      console.log('表不存在，需要在Supabase控制台中创建user-attendance表');
      console.log('请参考server/database/schema.sql文件中的表结构定义');
    } else if (!insertError) {
      console.log('表已存在，测试插入成功');
      // 删除测试数据
      await supabase
        .from('user-attendance')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
    }
  } catch (error) {
    console.log('检查表结构时的错误:', error);
  }
  
  console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/goal', goalRoutes);
app.use('/api/time-consumption', timeConsumptionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FocusFlow API is running' });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  // 初始化数据库
  await initDatabase();
});
