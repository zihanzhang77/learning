import express from 'express';

const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-f03d0b3cc3c0459494945a0c7abdb745'; // 用户提供的 DeepSeek API Key
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 调用 DeepSeek API 的端点
router.post('/deepseek', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '请输入提示词' });
    }

    // 构建请求体
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个智能助手，需要以简洁的方式回答用户的问题，直接给出答案，不要展示思考过程。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    // 调用 DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 响应失败: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 模拟 AI 思考过程（实际项目中可以让模型直接输出思考过程）
    const thought = `我需要分析用户的问题："${prompt}"。首先，我会理解问题的核心，然后搜索相关知识，最后组织语言给出详细的回答。`;

    res.json({
      thought: thought,
      answer: aiResponse
    });
  } catch (error: any) {
    console.error('调用 DeepSeek API 失败:', error);
    res.status(500).json({ error: 'AI 回答失败，请重试' });
  }
});

export default router;