import express, { Request } from 'express';
import { supabase } from '../config/supabase.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 扩展Request接口以包含file属性
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 获取用户信息
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 创建或更新用户
router.post('/', async (req, res) => {
  try {
    const { id, name, email, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id,
        name,
        email,
        avatar_url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户信息
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 上传头像
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { user_id } = req.body;
    const file = req.file;

    if (!file || !user_id) {
      return res.status(400).json({ error: '请提供头像文件和用户ID' });
    }

    // 构建头像URL（使用完整的URL）
    const avatarUrl = `http://localhost:3001/uploads/${file.filename}`;

    // 更新用户的头像URL
    const { data: user, error } = await supabase
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ user, message: '头像上传成功' });
  } catch (error: any) {
    console.error('上传头像失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
