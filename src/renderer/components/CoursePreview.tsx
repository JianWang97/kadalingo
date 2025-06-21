import React, { useState } from "react";
import type { GeneratedCourse } from "../services/llmService";
import {
  RepositoryFactory,
  StorageType,
} from "../../data/repositories/RepositoryFactory";
import type { Course, Lesson, SentencePair } from "../../data/types";

interface CoursePreviewProps {
  generatedContent: GeneratedCourse;
  generateConfig: {
    topic: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    lessonCount: number;
    sentencesPerLesson: number;
  };
  onSaveSuccess: (savedCourseInfo: {
    title: string;
    id: number;
    lessonCount: number;
    totalSentences: number;
  }) => void;
  onSaveError: (error: string) => void;
  isInDrawer?: boolean; // 新增属性，用于适配抽屉显示
}

const CoursePreview: React.FC<CoursePreviewProps> = ({
  generatedContent,
  generateConfig,
  onSaveSuccess,
  onSaveError,
  isInDrawer = false, // 默认不在抽屉中
}) => {
  const [isSaving, setIsSaving] = useState(false);

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
      description: generateConfig.description || generatedCourse.description, // 优先使用用户输入的描述
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
    if (!generatedContent) return;

    setIsSaving(true);

    try {
      // 获取数据存储库
      const factory = RepositoryFactory.getInstance();
      const repository = await factory.createRepository({
        type: StorageType.INDEXEDDB,
      });

      // 将生成的课程转换为数据库格式
      const course: Course = await convertGeneratedCourseToDbFormat(
        generatedContent
      );

      // 保存到数据库
      const savedCourse = await repository.createCourse(course);
      console.log("课程保存成功:", savedCourse);
      
      // 调用成功回调
      onSaveSuccess({
        title: generatedContent.title,
        id: savedCourse.id,
        lessonCount: generateConfig.lessonCount,
        totalSentences:
          generateConfig.lessonCount * generateConfig.sentencesPerLesson,
      });
    } catch (error) {
      console.error("保存课程失败:", error);
      onSaveError("保存课程失败：" + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };  return (
    <div className={`
      ${isInDrawer 
        ? 'bg-white shadow-lg border-0 rounded-none' 
        : 'backdrop-blur-sm bg-white/95 rounded-2xl shadow-2xl border border-white/20'
      } 
      overflow-hidden
    `}>
      {/* 成功头部 */}
      <div className={`
        bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 
        ${isInDrawer ? 'p-4' : 'p-5'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 bg-white/20 rounded-xl backdrop-blur-sm
              ${isInDrawer ? 'p-2' : 'p-3'}
            `}>
              <svg
                className={`text-white ${isInDrawer ? 'w-6 h-6' : 'w-8 h-8'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h2 className={`font-bold text-white ${isInDrawer ? 'text-lg' : 'text-xl'}`}>
                  生成完成！
                </h2>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium text-white backdrop-blur-sm">
                  AI 生成
                </span>
              </div>
              <h3 className={`text-emerald-100 font-semibold mb-1 ${isInDrawer ? 'text-base' : 'text-lg'}`}>
                {generatedContent.title}
              </h3>
              <p className="text-emerald-100/90 text-sm line-clamp-2">
                {generatedContent.description}
              </p>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className={`
              bg-white/20 backdrop-blur-sm rounded-xl
              ${isInDrawer ? 'p-3' : 'p-4'}
            `}>
              <div className={`font-bold text-white mb-1 ${isInDrawer ? 'text-2xl' : 'text-3xl'}`}>
                {generatedContent.sentences.length}
              </div>
              <div className="text-emerald-100 text-xs font-medium">个句子</div>
            </div>
          </div>
        </div>
      </div>

      <div className={isInDrawer ? 'p-4' : 'p-5'}>
        {/* 句子预览 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-bold text-gray-800 flex items-center ${isInDrawer ? 'text-base' : 'text-lg'}`}>
              <span className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg mr-2">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </span>
              句子预览
            </h4>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              显示前 10 个
            </span>
          </div>          <div className={`
            space-y-2 overflow-y-auto custom-scrollbar
            ${isInDrawer ? 'max-h-64' : 'max-h-80'}
          `}>
            {generatedContent.sentences.slice(0, 10).map((sentence, index) => (
              <div
                key={index}
                className={`
                  group bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100 
                  hover:shadow-sm transition-all duration-200 hover:scale-[1.005]
                  ${isInDrawer ? 'p-3' : 'p-4'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`
                        flex-shrink-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full 
                        flex items-center justify-center text-xs font-bold
                        ${isInDrawer ? 'w-5 h-5' : 'w-6 h-6'}
                      `}>
                        {index + 1}
                      </span>
                      <div className={`
                        text-gray-900 font-medium
                        ${isInDrawer ? 'text-sm' : 'text-base'}
                      `}>
                        {sentence.english}
                      </div>  
                    </div>
                    <div className={`
                      text-gray-600
                      ${isInDrawer ? 'text-xs pl-7' : 'text-sm pl-8'}
                    `}>
                      {sentence.chinese}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span
                      className={`
                        px-2 py-1 rounded-full font-medium
                        ${isInDrawer ? 'text-xs' : 'text-xs'}
                        ${
                          sentence.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : sentence.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {sentence.difficulty === "easy"
                        ? "简单"
                        : sentence.difficulty === "medium"
                        ? "中等"
                        : "困难"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {generatedContent.sentences.length > 10 && (
              <div className={`
                text-center bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-200
                ${isInDrawer ? 'p-3' : 'p-4'}
              `}>
                <div className="text-gray-500 text-sm">
                  还有{" "}
                  <span className="font-semibold text-purple-600">
                    {generatedContent.sentences.length - 10}
                  </span>{" "}
                  个句子...
                </div>
              </div>
            )}
          </div>
        </div>        {/* 保存按钮 */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSaveContent}
            disabled={isSaving}
            className={`
              group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg 
              hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed 
              transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 
              disabled:transform-none flex items-center space-x-2
              ${isInDrawer ? 'px-6 py-3 text-sm' : 'px-10 py-4 text-base'}
            `}
          >
            {isSaving ? (
              <>
                <div className={`animate-spin rounded-full border-2 border-white border-t-transparent ${isInDrawer ? 'h-4 w-4' : 'h-6 w-6'}`}></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <div className="p-1 bg-white/20 rounded">
                  <svg
                    className={isInDrawer ? 'w-4 h-4' : 'w-5 h-5'}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                </div>
                <span>保存到课程库</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;
