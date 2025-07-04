import React, { useEffect, useState } from 'react';
import { WordRecord, VocabularyStatus } from '../../data/types';
import { vocabularyService } from '../services/vocabularyService';

type TabType = 'new' | 'error' | 'mastered';

interface WordListProps {
  words: WordRecord[];
  onMarkAsMastered?: (word: string) => void;
}

const WordList: React.FC<WordListProps> = ({ words, onMarkAsMastered }) => (
  <div className="mt-6">
    {words.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">暂无单词</p>
      </div>
    ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {words.map((word) => (
          <li
            key={word.id}
            className="py-3 flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800 px-4 -mx-4 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1">
              <span className="font-medium text-base text-gray-900 dark:text-gray-100">{word.word}</span>
            </div>
            
            {word.translation && (
              <div className="flex items-center justify-center flex-1">
                <span className="text-gray-600 dark:text-gray-300 text-base">{word.translation}</span>
              </div>
            )}
            
            <div className="flex items-center justify-end min-w-[120px] space-x-3">
              {word.errorCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-700">
                  {word.errorCount}
                </span>
              )}
              {onMarkAsMastered && word.status !== VocabularyStatus.MASTERED && (
                <button
                  onClick={() => onMarkAsMastered(word.word)}
                  className="px-3 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
                >
                  已掌握
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const VocabularyBooks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [newWords, setNewWords] = useState<WordRecord[]>([]);
  const [errorWords, setErrorWords] = useState<WordRecord[]>([]);
  const [masteredWords, setMasteredWords] = useState<WordRecord[]>([]);


  const loadWords = async () => {
    const [newWordsData, errorWordsData, masteredWordsData] = await Promise.all([
      vocabularyService.getNewWords(),
      vocabularyService.getErrorWords(),
      vocabularyService.getMasteredWords(),
    ]);

    setNewWords(newWordsData);
    setErrorWords(errorWordsData);
    setMasteredWords(masteredWordsData);
  };

  useEffect(() => {
    loadWords();
  }, []);

  const handleMarkAsMastered = async (word: string) => {
    await vocabularyService.markWordAsMastered(word);
    await loadWords();
  };

  const tabs = [
    { id: 'new' as TabType, name: '生词本', count: newWords.length },
    { id: 'error' as TabType, name: '错词本', count: errorWords.length },
    { id: 'mastered' as TabType, name: '已掌握', count: masteredWords.length },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'new':
        return <WordList words={newWords} onMarkAsMastered={handleMarkAsMastered} />;
      case 'error':
        return <WordList words={errorWords} onMarkAsMastered={handleMarkAsMastered} />;
      case 'mastered':
        return <WordList words={masteredWords} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] w-full bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 翻译提示 */}
        <div className="mb-4 text-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">翻译由百度翻译API提供</span>
        </div>
        
        {/* Tab 导航 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {tab.name}
                <span
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs
                    ${activeTab === tab.id
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        {renderContent()}
      </div>
    </div>
  );
}; 