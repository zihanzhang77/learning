import express from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { sendSmsVerifyCode } from '../services/smsService.js';

const router = express.Router();

// 生成随机验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 存储验证码（模拟，实际应用中应该使用Redis）
const verificationCodes: Record<string, { code: string; expiresAt: number }> = {};

// 请求验证码
router.post('/send-code', async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: '手机号不能为空' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone_number)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    // 调用阿里云API发送验证码
    const code = await sendSmsVerifyCode(phone_number);
    
    // 存储验证码（有效期5分钟）
    verificationCodes[phone_number] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    res.json({ message: '验证码已发送，请注意查收' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 验证码登录
router.post('/login', async (req, res) => {
  try {
    const { phone_number, code, name, password } = req.body;

    if (!phone_number || !code) {
      return res.status(400).json({ error: '手机号和验证码不能为空' });
    }

    // 验证验证码
    const storedCode = verificationCodes[phone_number];
    if (!storedCode) {
      return res.status(400).json({ error: '验证码不存在，请重新获取' });
    }

    if (storedCode.expiresAt < Date.now()) {
      return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }

    if (storedCode.code !== code) {
      return res.status(400).json({ error: '验证码错误' });
    }

    // 查找用户
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    // 如果用户不存在，创建新用户
    if (error && error.code === 'PGRST116') {
      if (!name) {
        return res.status(400).json({ error: '新用户需要提供姓名' });
      }

      const createData: any = {
        name,
        phone_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 如果提供了密码，保存密码哈希
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        createData.password_hash = passwordHash;
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(createData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      user = newUser;
    } else if (error) {
      throw error;
    } else {
      // 用户已存在，更新信息
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (name) {
        updateData.name = name;
      }

      // 如果提供了密码，更新密码哈希
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updateData.password_hash = passwordHash;
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('phone_number', phone_number)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      user = updatedUser;
    }

    // 清除验证码
    delete verificationCodes[phone_number];

    // 不返回密码哈希
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 密码登录
router.post('/login-with-password', async (req, res) => {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: '用户不存在' });
      }
      throw error;
    }

    // 验证密码
    if (!user.password_hash) {
      return res.status(401).json({ error: '用户未设置密码' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 不返回密码哈希
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 新用户注册
router.post('/register', async (req, res) => {
  try {
    const { phone_number, password, name } = req.body;

    if (!phone_number || !password || !name) {
      return res.status(400).json({ error: '手机号、密码和姓名不能为空' });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone_number)) {
      return res.status(400).json({ error: '请输入正确的手机号' });
    }

    // 检查用户是否已存在
    let { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (!checkError || checkError.code !== 'PGRST116') {
      return res.status(400).json({ error: '该手机号已注册，请直接登录' });
    }

    // 生成密码哈希
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建新用户
    const createData: any = {
      name,
      phone_number,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(createData)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // 不返回密码哈希
    const { password_hash, ...userWithoutPassword } = newUser;

    res.json({ user: userWithoutPassword, message: '注册成功' });
  } catch (error: any) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 设置密码
router.post('/set-password', async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ error: '用户ID和密码不能为空' });
    }

    // 生成密码哈希
    const passwordHash = await bcrypt.hash(password, 10);

    // 直接构建更新对象，避免 schema cache 问题
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // 尝试更新用户密码
    let { data: user, error } = await supabase
      .from('users')
      .update({ ...updateData, password_hash: passwordHash })
      .eq('id', user_id)
      .select()
      .single();

    // 如果是因为列不存在的错误，返回明确的错误信息
    if (error && error.message.includes('password_hash')) {
      console.log('password_hash 列不存在，需要在 Supabase 控制台添加');
      return res.status(400).json({ 
        error: '密码列不存在，请先在 Supabase 控制台添加 password_hash 列',
        message: '请登录 Supabase 控制台，进入 SQL 编辑器，执行: ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;' 
      });
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: '用户不存在' });
      }
      throw error;
    }

    // 不返回密码哈希
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, message: '密码设置成功' });
  } catch (error: any) {
    console.error('设置密码失败:', error);
    res.status(500).json({ error: '设置密码失败，请稍后重试' });
  }
});

export default router;