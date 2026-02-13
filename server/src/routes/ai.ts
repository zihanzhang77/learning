import express from 'express';

const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-c796903787ff48c297f3532c927d6143'; // 用户提供的 DeepSeek API Key
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// DeepSeek API 响应类型接口
interface DeepSeekResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

// 调用 DeepSeek API 的端点
router.post('/deepseek', async (req, res) => {
  try {
    const { prompt, mode = 'encouragement' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '请输入提示词' });
    }

    let systemPrompt = '';
    if (mode === 'plan') {
      systemPrompt = `你是一个专业的学习规划师。请根据用户想学习的内容（${prompt}），制定一个为期一个月的详细学习计划。
      
      输出格式必须包含以下四个部分，并使用Markdown格式排版：
      
      ### 1. 学习目标
      （简明扼要地列出1个月后能达到的具体目标）
      
      ### 2. 学习周期
      1个月（4周）
      
      ### 3. 每日排期
      （请按周划分，列出每周的重点，并给出典型的一天日程安排。不需要列出每一天，而是给出每周的学习重点和每日的常规任务结构）
      
      ### 4. 高效学习方法推荐
      （针对该学科推荐2-3个最有效的学习方法）
      
      语气要专业、条理清晰、鼓舞人心。`;
    } else {
      systemPrompt = '你是一个温暖、治愈的心理咨询师助手，请根据用户的日记内容，给出一段20-50字左右的鼓励。语气要像朋友一样真诚、温暖。';
    }

    // 构建请求体
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
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
      const errorText = await response.text();
      console.error('DeepSeek API Error:', response.status, response.statusText, errorText);
      throw new Error(`DeepSeek API 响应失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as DeepSeekResponse;
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