import React, { useState } from 'react';
import { Header } from '../components/common';

interface NewCourse {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
}

interface NewSentence {
  chinese: string;
  english: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const AddContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'course' | 'sentence'>('course');
  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: '',
    description: '',
    level: 'beginner',
    icon: '📚'
  });
  const [newSentence, setNewSentence] = useState<NewSentence>({
    chinese: '',
    english: '',
    difficulty: 'easy'
  });

  const iconOptions = ['📚', '💼', '✈️', '🎯', '🎨', '🔬', '🎵', '🏃‍♂️', '🍳', '🌟'];
  
  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('新课程:', newCourse);
    // 这里可以添加保存课程的逻辑
    alert('课程添加成功！');
    setNewCourse({
      title: '',
      description: '',
      level: 'beginner',
      icon: '📚'
    });
  };

  const handleSentenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('新句子:', newSentence);
    // 这里可以添加保存句子的逻辑
    alert('句子添加成功！');
    setNewSentence({
      chinese: '',
      english: '',
      difficulty: 'easy'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Header 
        title="添加内容" 
        subtitle="为您的英语学习添加新的课程和练习内容" 
      />

      {/* 标签页切换 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('course')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'course'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📚 添加课程
        </button>
        <button
          onClick={() => setActiveTab('sentence')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sentence'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📝 添加句子
        </button>
      </div>

      {/* 添加课程表单 */}
      {activeTab === 'course' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">创建新课程</h3>
          
          <form onSubmit={handleCourseSubmit} className="space-y-6">
            <div>
              <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-2">
                课程标题
              </label>
              <input
                type="text"
                id="courseTitle"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入课程标题"
                required
              />
            </div>

            <div>
              <label htmlFor="courseDescription" className="block text-sm font-medium text-gray-700 mb-2">
                课程描述
              </label>
              <textarea
                id="courseDescription"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入课程描述"
                required
              />
            </div>

            <div>
              <label htmlFor="courseLevel" className="block text-sm font-medium text-gray-700 mb-2">
                难度等级
              </label>
              <select
                id="courseLevel"
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择图标
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCourse({ ...newCourse, icon })}
                    className={`p-3 text-2xl border-2 rounded-lg transition-colors ${
                      newCourse.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNewCourse({
                  title: '',
                  description: '',
                  level: 'beginner',
                  icon: '📚'
                })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                重置
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建课程
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 添加句子表单 */}
      {activeTab === 'sentence' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">添加练习句子</h3>
          
          <form onSubmit={handleSentenceSubmit} className="space-y-6">
            <div>
              <label htmlFor="chinese" className="block text-sm font-medium text-gray-700 mb-2">
                中文句子
              </label>
              <input
                type="text"
                id="chinese"
                value={newSentence.chinese}
                onChange={(e) => setNewSentence({ ...newSentence, chinese: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入中文句子"
                required
              />
            </div>

            <div>
              <label htmlFor="english" className="block text-sm font-medium text-gray-700 mb-2">
                英文翻译
              </label>
              <input
                type="text"
                id="english"
                value={newSentence.english}
                onChange={(e) => setNewSentence({ ...newSentence, english: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入英文翻译"
                required
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                难度等级
              </label>
              <select
                id="difficulty"
                value={newSentence.difficulty}
                onChange={(e) => setNewSentence({ ...newSentence, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>

            {/* 预览区域 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">预览</h4>
              <div className="space-y-2">
                <p className="text-gray-800">
                  <span className="font-medium">中文：</span>
                  {newSentence.chinese || '请输入中文句子'}
                </p>
                <p className="text-gray-800">
                  <span className="font-medium">英文：</span>
                  {newSentence.english || '请输入英文翻译'}
                </p>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">难度：</span>
                  {newSentence.difficulty === 'easy' ? '简单' : newSentence.difficulty === 'medium' ? '中等' : '困难'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNewSentence({
                  chinese: '',
                  english: '',
                  difficulty: 'easy'
                })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                重置
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                添加句子
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddContent;
