import React, { useState, useEffect, useRef } from "react";
import type { GeneratedCourse, StreamChunk, PartialCourse } from "../services/llmService";
import {
  RepositoryFactory,
  StorageType,
} from "../data/repositories/RepositoryFactory";
import type { Course, Lesson, SentencePair } from "../data/types";

interface StreamingCoursePreviewProps {
  generateConfig: {
    topic: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    lessonCount: number;
    sentencesPerLesson: number;
  };
  isGenerating: boolean;
  onSaveSuccess: (savedCourseInfo: {
    title: string;
    id: number;
    lessonCount: number;
    totalSentences: number;
  }) => void;
  onSaveError: (error: string) => void;
  onGenerationComplete?: (course: GeneratedCourse) => void;
  onGenerationError?: (error: string) => void;
  isInDrawer?: boolean;
}

const StreamingCoursePreview: React.FC<StreamingCoursePreviewProps> = ({
  generateConfig,
  isGenerating,
  onSaveSuccess,
  onSaveError,
  onGenerationComplete,
  onGenerationError,
  isInDrawer = false,
}) => {  const [partialCourse, setPartialCourse] = useState<PartialCourse>({
    sentences: [],
    isComplete: false,
  });
  const [thinkingContent, setThinkingContent] = useState<string>("");
  const [showThinking, setShowThinking] = useState<boolean>(true);const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string>("");
  const [lastAddedSentenceIndex, setLastAddedSentenceIndex] = useState(-1);  const streamRef = useRef<AsyncGenerator<StreamChunk, void, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSentenceRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLPreElement>(null);

  // 自动滚动到最新内容
  const scrollToBottom = () => {
    if (lastSentenceRef.current) {
      lastSentenceRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };
  // 监听句子数量变化，自动滚动
  useEffect(() => {
    if (partialCourse.sentences.length > 0 && isGenerating) {
      setLastAddedSentenceIndex(partialCourse.sentences.length - 1);
      // 使用 setTimeout 确保 DOM 更新后再滚动
      setTimeout(scrollToBottom, 100);
    }
  }, [partialCourse.sentences.length, isGenerating]);

  // 监听 thinking 内容变化，自动滚动到底部
  useEffect(() => {
    if (thinkingContent && thinkingRef.current && showThinking) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinkingContent, showThinking]);

  // 清除高亮效果
  useEffect(() => {
    if (lastAddedSentenceIndex >= 0) {
      const timer = setTimeout(() => {
        setLastAddedSentenceIndex(-1);
      }, 2000); // 2秒后清除高亮效果
      
      return () => clearTimeout(timer);
    }
  }, [lastAddedSentenceIndex]);

  // 开始流式生成
  useEffect(() => {
    if (isGenerating && !streamRef.current) {
      startStreamingGeneration();
    }
  }, [isGenerating]);  const startStreamingGeneration = async () => {
    try {
      setPartialCourse({ sentences: [], isComplete: false });
      setProgress(0);
      setGenerationError("");
      setThinkingContent("");
      setShowThinking(false);

      // 动态导入 LLM 服务
      const { getLLMService } = await import("../services/llmService");
      const llmService = getLLMService();

      if (!llmService) {
        throw new Error("LLM服务未初始化");
      }

      // 计算总句子数量
      const totalSentences =
        generateConfig.lessonCount * generateConfig.sentencesPerLesson;
      
      // 开始流式生成
      streamRef.current = llmService.generateCourseStream(
        generateConfig.topic,
        generateConfig.level,
        totalSentences
      );

      for await (const chunk of streamRef.current) {
        handleStreamChunk(chunk);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setGenerationError(errorMessage);
      if (onGenerationError) {
        onGenerationError(errorMessage);
      }
    } finally {
      streamRef.current = null;
    }
  };
  const handleStreamChunk = (chunk: StreamChunk) => {
    setProgress(chunk.progress || 0);

    switch (chunk.type) {
      case 'thinking':
        if (typeof chunk.data === 'string') {
          setThinkingContent(chunk.data);
          setShowThinking(true);
        }
        break;

      case 'title':
        if (typeof chunk.data === 'string') {
          setPartialCourse(prev => ({
            ...prev,
            title: chunk.data as string
          }));
        }
        break;

      case 'description':
        if (typeof chunk.data === 'string') {
          setPartialCourse(prev => ({
            ...prev,
            description: chunk.data as string
          }));
        }
        break;      case 'sentence':
        if (chunk.data && typeof chunk.data === 'object' && 'chinese' in chunk.data) {
          const sentence = chunk.data as { chinese: string; english: string; difficulty: "easy" | "medium" | "hard" };
          setPartialCourse(prev => ({
            ...prev,
            sentences: [...prev.sentences, sentence]
          }));
        }
        break;

      case 'complete':
        if (chunk.data && typeof chunk.data === 'object' && 'title' in chunk.data) {
          const completeCourse = chunk.data as GeneratedCourse;
          setPartialCourse({
            ...completeCourse,
            isComplete: true
          });
          if (onGenerationComplete) {
            onGenerationComplete(completeCourse);
          }
        }
        break;      case 'error':
        if (chunk.data && typeof chunk.data === 'object' && 'error' in chunk.data) {
          const error = (chunk.data as { error: string }).error;
          setGenerationError(error);
          if (onGenerationError) {
            onGenerationError(error);
          }
        }
        break;
    }
  };

  // 将生成的课程转换为数据库格式
  const convertGeneratedCourseToDbFormat = async (
    generatedCourse: GeneratedCourse
  ): Promise<Course> => {
    const lessons: Lesson[] = [];
    let currentSentenceIndex = 0;

    // 按照配置的课时数和每课时句子数来分组
    for (let i = 0; i < generateConfig.lessonCount; i++) {
      const lessonSentences: SentencePair[] = [];

      // 为当前课时分配句子
      for (
        let j = 0;
        j < generateConfig.sentencesPerLesson &&
        currentSentenceIndex < generatedCourse.sentences.length;
        j++
      ) {
        const generatedSentence =
          generatedCourse.sentences[currentSentenceIndex];
        lessonSentences.push({
          id: currentSentenceIndex + 1,
          english: generatedSentence.english,
          chinese: generatedSentence.chinese,
          difficulty: generatedSentence.difficulty,
        });
        currentSentenceIndex++;
      }

      if (lessonSentences.length > 0) {
        lessons.push({
          id: i + 1,
          title: `第${i + 1}课`,
          description: `${generatedCourse.title} - 第${i + 1}课`,
          sentences: lessonSentences,
        });
      }
    }

    return {
      id: 0, // 数据库会自动分配ID
      name: generatedCourse.title,
      description: generateConfig.description || generatedCourse.description,
      difficulty: generateConfig.level,
      category: generateConfig.topic,
      lessons,
      totalLessons: lessons.length,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  // 保存生成的内容
  const handleSaveContent = async () => {
    if (!partialCourse.isComplete || !partialCourse.title) return;

    setIsSaving(true);

    try {
      // 获取数据存储库
      const factory = RepositoryFactory.getInstance();
      const repository = await factory.createRepository({
        type: StorageType.INDEXEDDB,
      });

      // 构造完整的课程对象
      const completeCourse: GeneratedCourse = {
        title: partialCourse.title,
        description: partialCourse.description || "",
        level: partialCourse.level || generateConfig.level,
        sentences: partialCourse.sentences,
      };

      // 转换为数据库格式
      const courseData = await convertGeneratedCourseToDbFormat(completeCourse);      // 保存到数据库
      const savedCourse = await repository.createCourse(courseData);

      // 通知保存成功
      onSaveSuccess({
        title: savedCourse.name,
        id: savedCourse.id,
        lessonCount: savedCourse.lessons.length,
        totalSentences: savedCourse.lessons.reduce(
          (sum: number, lesson: Lesson) => sum + lesson.sentences.length,
          0
        ),
      });
    } catch (error) {
      console.error("保存课程失败:", error);
      onSaveError("保存失败：" + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // 按课时分组句子
  const groupSentencesByLessons = () => {
    const lessons = [];
    const sentencesPerLesson = generateConfig.sentencesPerLesson;
    
    for (let i = 0; i < generateConfig.lessonCount; i++) {
      const startIndex = i * sentencesPerLesson;
      const endIndex = Math.min(startIndex + sentencesPerLesson, partialCourse.sentences.length);
      const lessonSentences = partialCourse.sentences.slice(startIndex, endIndex);
      
      if (lessonSentences.length > 0 || i === 0) {
        lessons.push({
          lessonNumber: i + 1,
          title: `第${i + 1}课`,
          sentences: lessonSentences,
        });
      }
    }
    
    return lessons;
  };

  if (generationError) {
    return (
      <div className="p-4">
        <div className="backdrop-blur-sm bg-red-50/80 border border-red-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-1 bg-red-100 rounded-full">
              <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-red-700 font-medium">生成失败：{generationError}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div 
      ref={containerRef}
      className={`${isInDrawer ? "h-full" : "min-h-screen"} bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 overflow-y-auto scroll-smooth`}
    >
      <div className="max-w-4xl mx-auto p-4 space-y-4">        {/* 生成进度 */}
        {isGenerating && (
          <div className="backdrop-blur-sm bg-white/90 rounded-xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">课程生成中...</h3>
              <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}        {/* Thinking 内容展示 */}
        {thinkingContent && (
          <div className="backdrop-blur-sm bg-blue-50/90 rounded-xl shadow-lg border border-blue-200/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-1 bg-blue-100 rounded-full mr-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-blue-800">AI 思考过程</h3>
                {isGenerating && (
                  <div className="ml-2 flex items-center">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse mr-1"></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse mr-1" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
              >
                {showThinking ? "隐藏" : "显示"}
              </button>
            </div>            {showThinking && (
              <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                <pre 
                  ref={thinkingRef}
                  className="text-sm text-blue-900 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto"
                >
                  {thinkingContent}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 课程标题和描述 */}
        {(partialCourse.title || partialCourse.description) && (
          <div className="backdrop-blur-sm bg-white/90 rounded-xl shadow-lg border border-white/20 p-4">
            {partialCourse.title && (
              <h2 className="text-xl font-bold text-gray-800 mb-2">{partialCourse.title}</h2>
            )}
            {partialCourse.description && (
              <p className="text-gray-600 text-sm">{partialCourse.description}</p>
            )}
          </div>
        )}

        {/* 课程内容 */}
        {partialCourse.sentences.length > 0 && (
          <div className="space-y-4">
            {groupSentencesByLessons().map((lesson) => (
              <div key={lesson.lessonNumber} className="backdrop-blur-sm bg-white/90 rounded-xl shadow-lg border border-white/20">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-t-xl">
                  <h3 className="text-white font-semibold">
                    {lesson.title}
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                      {lesson.sentences.length} 个句子
                    </span>
                  </h3>
                </div>                <div className="p-4 space-y-3">
                  {lesson.sentences.map((sentence, index) => {
                    // 计算全局句子索引
                    const globalIndex = (lesson.lessonNumber - 1) * generateConfig.sentencesPerLesson + index;
                    // 检查是否是最后一个句子
                    const isLastSentence = lesson.lessonNumber === groupSentencesByLessons().length && 
                                          index === lesson.sentences.length - 1 && 
                                          partialCourse.sentences.length > 0;
                    // 检查是否是刚添加的句子
                    const isNewlyAdded = globalIndex === lastAddedSentenceIndex;
                    
                    return (                      <div 
                        key={index} 
                        ref={isLastSentence ? lastSentenceRef : null}
                        className={`relative border-l-2 pl-3 py-2 transition-all duration-500 ease-in-out transform ${
                          isNewlyAdded 
                            ? 'border-purple-400 bg-purple-50 scale-[1.02] shadow-md' 
                            : 'border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="text-gray-800 font-medium mb-1">{sentence.chinese}</p>
                        <p className="text-gray-600 text-sm">{sentence.english}</p>
                        <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                          sentence.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-700'
                            : sentence.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {sentence.difficulty === 'easy' ? '简单' : sentence.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        {isNewlyAdded && (
                          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* 正在生成中的占位符 */}
                  {isGenerating && lesson.sentences.length < generateConfig.sentencesPerLesson && (
                    <div 
                      ref={lesson.lessonNumber === groupSentencesByLessons().length ? lastSentenceRef : null}
                      className="border-l-2 border-gray-200 pl-3 py-2 opacity-50 relative"
                    >
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}        {/* 保存按钮 */}
        {partialCourse.isComplete && (
          <div className="sticky bottom-4 backdrop-blur-sm bg-white/90 rounded-xl shadow-lg border border-white/20 p-4">            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">课程生成完毕</span>
                <span className="ml-2">
                  共 {partialCourse.sentences.length} 个句子，{generateConfig.lessonCount} 个课时
                </span>
              </div>
              <button
                onClick={handleSaveContent}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "保存中..." : "保存课程"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingCoursePreview;
