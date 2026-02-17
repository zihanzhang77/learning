import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface LearningProfileData {
  topic: string;
  target: string;
  level: string;
  planStartDate: string;
  planEndDate: string;
  detailedPlan: string;
}

interface LearningProfileCardProps {
  learningProfile: LearningProfileData;
  isEditing?: boolean;
  onProfileChange?: (newProfile: LearningProfileData) => void;
}

const LearningProfileCard: React.FC<LearningProfileCardProps> = ({ 
  learningProfile, 
  isEditing = false, 
  onProfileChange 
}) => {
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleChange = (field: keyof LearningProfileData, value: string) => {
    if (onProfileChange) {
      onProfileChange({
        ...learningProfile,
        [field]: value
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* 学习内容 */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">menu_book</span>
            <span className="text-xs font-bold text-slate-500">正在学习</span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={learningProfile.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              placeholder="请输入学习内容"
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-slate-900 font-medium">{learningProfile.topic || '暂未设置'}</p>
          )}
        </div>

        <div className="flex gap-4">
          {/* 学习目标 */}
          <div className="flex-1 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">flag</span>
              <span className="text-xs font-bold text-slate-500">学习目标</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={learningProfile.target}
                onChange={(e) => handleChange('target', e.target.value)}
                placeholder="请输入目标"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-900 font-medium">{learningProfile.target || '暂未设置'}</p>
            )}
          </div>

          {/* 当前水平 */}
          <div className="flex-1 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">trending_up</span>
              <span className="text-xs font-bold text-slate-500">当前水平</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={learningProfile.level}
                onChange={(e) => handleChange('level', e.target.value)}
                placeholder="请输入水平"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-slate-900 font-medium">{learningProfile.level || '暂未设置'}</p>
            )}
          </div>
        </div>
        
        {/* 学习周期 (来自 AI 规划) - Always Visible */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-lg">calendar_month</span>
              <span className="text-xs font-bold text-slate-500">建议学习周期</span>
            </div>
            {learningProfile.detailedPlan && (
              <button 
                onClick={() => setShowPlanModal(true)}
                className="text-xs text-blue-500 font-medium hover:text-blue-600 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                查看具体计划
              </button>
            )}
          </div>
          <p className="text-slate-900 font-medium flex items-center gap-2">
            <span>{learningProfile.planStartDate || '待定'}</span>
            <span className="text-slate-400">→</span>
            <span>{learningProfile.planEndDate || '待定'}</span>
          </p>
        </div>
      </div>

      {/* 学习计划详情弹窗 */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">school</span>
                <h3 className="text-lg font-bold text-slate-800">具体学习计划</h3>
              </div>
              <button 
                onClick={() => setShowPlanModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
              <div className="prose prose-sm md:prose-base max-w-none text-slate-700
                prose-headings:font-bold prose-headings:text-slate-800
                prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                prose-p:leading-relaxed prose-li:marker:text-blue-500
                prose-strong:text-slate-900 prose-strong:font-black
                prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:rounded-xl
                prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {learningProfile.detailedPlan}
                </ReactMarkdown>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LearningProfileCard;
