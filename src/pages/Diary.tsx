import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { diaryApi, aiApi } from '../services/api';
import { format, subDays, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Diary {
  id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
  ai_encouragement?: string;
}

const Diary: React.FC = () => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEncouragement, setAiEncouragement] = useState<string | null>(null);

  // 加载历史日记列表
  useEffect(() => {
    if (user) {
      loadDiaries();
    }
  }, [user]);

  // 当选择日期变化时，加载对应日记
  useEffect(() => {
    if (user && selectedDate) {
      loadDiaryByDate(selectedDate);
    }
  }, [selectedDate, user]);

  const loadDiaries = async () => {
    if (!user) return;
    const data = await diaryApi.getDiaries(user.id);
    setDiaries(data || []);
  };

  const loadDiaryByDate = async (date: string) => {
    if (!user) return;
    // 检查是否在已加载列表中
    const existing = diaries.find(d => d.date === date);
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setAiEncouragement(existing.ai_encouragement || null);
      return;
    }

    // 否则从 API 获取
    const data = await diaryApi.getDiaryByDate(user.id, date);
    if (data) {
      setTitle(data.title);
      setContent(data.content);
      setAiEncouragement(data.ai_encouragement || null);
    } else {
      // 如果没有记录，清空输入框
      setTitle('');
      setContent('');
      setAiEncouragement(null);
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      await diaryApi.saveDiary(user.id, selectedDate, title, content);
      await loadDiaries(); // 刷新列表
      showToast('保存成功', 'success');
    } catch (error) {
      console.error(error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toast 提示组件
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleAiEncouragement = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    try {
      // 获取最近3天的日记内容
      // 这里简化逻辑：取列表前3条（假设列表已按日期倒序）
      // 实际应筛选日期
      const recentDiaries = diaries.slice(0, 3).map(d => `日期:${d.date}\n标题:${d.title}\n内容:${d.content}`).join('\n---\n');
      
      if (!recentDiaries) {
        setAiEncouragement("还没有足够的日记记录来生成鼓励哦，快去写一篇吧！");
        return;
      }

      const prompt = `你是一个温暖、治愈的心理咨询师朋友。请根据我最近3天的日记内容，从以下四种鼓励结构中选择最适合我当前状态的一种，给我一段温暖、治愈的鼓励。字数要求：50-100字左右。

四种结构参考：
1. **捕捉微小突破**（适合：看起来有点不确定、自我怀疑时）：句式如“我注意到，你今天在‘XX细节’上和之前不一样了...这种‘不放过自己’的劲头，才是你今天最大的进展。”
2. **赋予思考以重量**（适合：分享了复杂、碎片化的感悟时）：句式如“你这个视角很特别，它把‘A’和‘B’连起来了...这个‘质疑’本身，就是你和别人拉开差距的地方。”
3. **对抗遗忘与孤独**（适合：处于长期积累期、正反馈较少时）：句式如“今天这个坎你迈过去了，下次遇到XX情况，你就有经验了...你比别人多一个‘此路不通’的预警，这就是优势。”
4. **肯定分享行为本身**（适合：需要情感链接时）：句式如“谢谢你愿意把这些思考讲给我听...愿意把还没整理好的思路摊开来讲，这是一种很珍贵的开放和信任。”

**心法**：把“你真棒”（评价）换成“我看见了……”（描述）。评价是俯视，描述是平视。

我的日记内容：
${recentDiaries}`;
      const response = await aiApi.deepseek(prompt);
      setAiEncouragement(response.answer);
      
      // 保存 AI 鼓励
      try {
        await diaryApi.saveAiEncouragement(user.id, selectedDate, response.answer);
      } catch (saveError) {
        console.error('保存 AI 鼓励失败:', saveError);
        // 不阻断流程，因为已经在前端显示了
      }
    } catch (error: any) {
      console.error(error);
      setAiEncouragement(`AI 暂时休息了 (错误: ${error.message || '未知错误'})`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-gray-800">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-light tracking-wide text-gray-900 mb-2">学习日记本</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* 编辑区域 (全宽) */}
        <div className="md:col-span-12">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 relative">
            
            {/* 日期选择 (圆圈风格) */}
            <div className="mb-8 overflow-x-auto pb-2 custom-scrollbar">
              <div className="flex items-center space-x-3">
                {Array.from({ length: 7 }).map((_, i) => {
                  const centerDate = selectedDate ? new Date(selectedDate) : new Date();
                  const date = addDays(centerDate, i - 3);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-200 flex-shrink-0 border ${
                        isSelected 
                          ? 'bg-black text-white border-black shadow-md scale-105' 
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-[10px] md:text-xs font-medium opacity-60">
                        {isToday ? '今' : format(date, 'E', { locale: zhCN })}
                      </span>
                      <span className={`text-sm md:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {format(date, 'd')}
                      </span>
                    </button>
                  );
                })}
                
                {/* 更多日期选择 */}
                <div className="relative ml-2 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer group flex-shrink-0">
                  <span className="text-gray-400 group-hover:text-gray-600">📅</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* 标题输入 */}
            <input
              type="text"
              placeholder="标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl md:text-3xl font-light text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 mb-6 bg-transparent"
            />

            {/* 内容输入 */}
            <textarea
              placeholder="写下今天的进展、感悟或心情..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[40vh] md:h-[50vh] resize-none text-base md:text-lg leading-relaxed text-gray-700 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent custom-scrollbar"
            />

            {/* 底部操作栏 */}
            <div className="flex justify-end items-center mt-8 space-x-4">
               <button
                onClick={handleAiEncouragement}
                disabled={isAnalyzing}
                className="px-6 py-2 rounded-full text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>✨ 思考中...</>
                ) : (
                  <>🤖 鼓励一下</>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? '保存中' : '保存日记'}
              </button>
            </div>

            {/* AI 鼓励展示区 */}
            {aiEncouragement && (
              <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💌</span>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">来自 AI 的鼓励</h4>
                    <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {aiEncouragement}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toast 提示 */}
            {toast && (
              <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${
                toast.type === 'success' ? 'bg-black text-white' : 'bg-red-500 text-white'
              }`}>
                {toast.message}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Diary;
