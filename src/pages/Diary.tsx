import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useAi } from '../context/AiContext';
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
  const { generateEncouragement, encouragementStates } = useAi();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // const [isAnalyzing, setIsAnalyzing] = useState(false); // 使用 context 中的 loading 状态
  const [aiEncouragement, setAiEncouragement] = useState<string | null>(null);

  // 获取当前日期的 AI 生成状态
  const currentAiState = encouragementStates?.[selectedDate];
  const isAnalyzing = currentAiState?.loading || false;
  
  // 优先显示 context 中的结果（即时生成的），其次显示数据库加载的
  const displayEncouragement = currentAiState?.result || aiEncouragement;
  const displayError = currentAiState?.error;

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
    
    // 清空当前状态
    setTitle('');
    setContent('');
    setAiEncouragement(null);

    // 1. 获取日记内容
    const diaryData = await diaryApi.getDiaryByDate(user.id, date);
    if (diaryData) {
      setTitle(diaryData.title);
      setContent(diaryData.content);
    }

    // 2. 独立获取 AI 鼓励内容（不再依赖 diaries 表字段）
    const encouragement = await diaryApi.getAiEncouragement(user.id, date);
    if (encouragement) {
      setAiEncouragement(encouragement);
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
    
    if (!content.trim()) {
      showToast('请先写下今天的日记内容哦', 'error');
      return;
    }

    // 1. 先自动保存日记内容，确保数据库中有记录
    try {
      await diaryApi.saveDiary(user.id, selectedDate, title, content);
    } catch (saveError) {
      console.error('自动保存日记失败:', saveError);
      // 如果保存失败，可能网络问题，但我们仍尝试生成AI回复（只是可能无法保存AI结果）
    }

    // 2. 构造 Prompt，只使用当天的内容
    // 增加 "请基于以下内容" 的强调，防止AI产生幻觉
    const currentDiary = `日期:${selectedDate}\n标题:${title}\n内容:${content}`;
    
    // 优化 Prompt：减少字数要求，强调简洁，加快生成速度
    const prompt = `你是一个温暖、治愈的心理咨询师朋友。
请**严格基于我今天写的日记内容**，给我一句温暖、治愈的鼓励。
请不要编造日记中没有提到的事情，也不要使用通用的套话，要针对我日记里的具体细节（如特定的事件、情绪、想法）进行回应。

字数要求：50字以内。

**心法**：把“你真棒”（评价）换成“我看见了……”（描述）。评价是俯视，描述是平视。

我的日记内容：
${currentDiary}`;

    // 3. 调用 Context 中的生成方法（支持后台生成）
    try {
      await generateEncouragement(selectedDate, prompt, user.id, async (result) => {
        // 保存到独立的 ai_encouragements 表
        await diaryApi.saveAiEncouragement(user.id, selectedDate, result);
      });
      // 成功后不需要手动 setAiEncouragement，因为 context 会更新
    } catch (error: any) {
      console.error(error);
      showToast('生成请求失败', 'error');
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
            {displayEncouragement && (
              <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl animate-fade-in">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💌</span>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">来自 AI 的鼓励</h4>
                    <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {displayEncouragement}
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
