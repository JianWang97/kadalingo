import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "../components/common";
import { Course } from "../../data/types";
import {
  RepositoryFactory,
  getStorageConfig,
} from "../../data/repositories/RepositoryFactory";
import { ProgressService } from "../services/progressService";
import { MdChat, MdBusinessCenter, MdFlight, MdSchool } from "react-icons/md";

// 课时详情接口
interface LessonDetail {
  id: number;
  title: string;
  totalSentences: number;
  completedSentences: number;
  progress: number; // 0-100
  completed: boolean;
  order: number;
}

// 简化的课程显示接口（用于UI）
interface CourseDisplay {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  level: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  completed: boolean;
  progress: number; // 完成进度百分比 (0-100)
  lessons?: LessonDetail[]; // 课时详情
}

// 根据课程分类获取图标
const getIconForCategory = (
  category: string
): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    日常对话: MdChat,
    基础对话: MdChat,
    商务英语: MdBusinessCenter,
    商务沟通: MdBusinessCenter,
    旅游英语: MdFlight,
    学术写作: MdSchool,
  };
  return iconMap[category] || MdSchool;
};

// 将数据库课程转换为显示课程
const convertCourseToDisplay = async (
  course: Course
): Promise<CourseDisplay> => {
  const progressService = ProgressService.getInstance();
  const completionRate = await progressService.getCourseCompletionRate(
    course.id
  );

  return {
    id: course.id.toString(),
    title: course.name,
    description: course.description || "",
    icon: getIconForCategory(course.category),
    level: course.difficulty,
    lessonCount: course.totalLessons,
    completed: completionRate >= 1.0,
    progress: Math.round(completionRate * 100),
  };
};

// 获取难度级别的样式
const getLevelColor = (level: CourseDisplay["level"]) => {
  const levelColors: Record<CourseDisplay["level"], string> = {
    beginner: "bg-blue-100 text-blue-800 border-blue-200",
    intermediate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    advanced: "bg-red-100 text-red-800 border-red-200",
  };
  return levelColors[level];
};

// 获取难度级别的文本
const getLevelText = (level: CourseDisplay["level"]) => {
  const levelTexts: Record<CourseDisplay["level"], string> = {
    beginner: "初级",
    intermediate: "中级",
    advanced: "高级",
  };
  return levelTexts[level];
};

interface CoursesProps {
  onStartCourse: (course: Course) => void;
}

const Courses: React.FC<CoursesProps> = ({ onStartCourse }) => {
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [selectedCourseForLessons, setSelectedCourseForLessons] =
    useState<CourseDisplay | null>(null);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [restartConfirmCourse, setRestartConfirmCourse] =
    useState<CourseDisplay | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // 加载所有课程数据
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repository = await factory.createRepository(config);
      const courseData = await repository.getAllCourses();
      setDbCourses(courseData);

      // 并行转换所有课程，包含进度信息
      const displayCoursesPromises = courseData.map(convertCourseToDisplay);
      const displayCourses = await Promise.all(displayCoursesPromises);
      setCourses(displayCourses);
    } catch (error) {
      console.error("加载课程失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]); // 加载课时详情 - 改为弹出框形式
  const loadLessonDetails = useCallback(async (course: CourseDisplay) => {
    try {
      setLoadingLessons(true);
      setSelectedCourseForLessons(course);

      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repository = await factory.createRepository(config);
      const progressService = ProgressService.getInstance();

      // 获取课程的所有课时
      const lessons = await repository.getLessonsByCourse(parseInt(course.id));

      // 为每个课时获取进度信息
      const lessonDetails: LessonDetail[] = await Promise.all(
        lessons.map(async (lesson, index) => {
          const progress = await progressService.getLessonProgress(
            parseInt(course.id),
            lesson.id
          );
          const totalSentences = lesson.sentences?.length || 0;
          const completedSentences = progress?.completedSentences?.length || 0;
          const progressPercent =
            totalSentences > 0
              ? Math.round((completedSentences / totalSentences) * 100)
              : 0;

          return {
            id: lesson.id,
            title: lesson.title,
            totalSentences,
            completedSentences,
            progress: progressPercent,
            completed:
              completedSentences === totalSentences && totalSentences > 0,
            order: index + 1,
          };
        })
      );

      // 按课时顺序排序
      lessonDetails.sort((a, b) => a.order - b.order);

      // 更新选中课程的课时详情
      setSelectedCourseForLessons((prevCourse) =>
        prevCourse ? { ...prevCourse, lessons: lessonDetails } : null
      );
    } catch (error) {
      console.error("加载课时详情失败:", error);
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  // 显示课时详情弹出框
  const showLessonDetails = useCallback(
    async (course: CourseDisplay) => {
      await loadLessonDetails(course);
    },
    [loadLessonDetails]
  );

  // 重置课程学习进度并开始学习
  const handleResetCourseProgress = useCallback(
    async (course: CourseDisplay) => {
      try {
        setIsResetting(true);
        const progressService = ProgressService.getInstance();
        await progressService.resetCourseProgress(parseInt(course.id));

        // 重新加载课程数据以更新UI
        await loadCourses();

        // 找到对应的原始课程数据并直接开始学习
        const originalCourse = dbCourses.find(
          (dbCourse) => dbCourse.id.toString() === course.id
        );
        if (originalCourse) {
          onStartCourse(originalCourse);
        }

        setRestartConfirmCourse(null);
      } catch (error) {
        console.error("重置课程进度失败:", error);
      } finally {
        setIsResetting(false);
      }
    },
    [loadCourses, dbCourses, onStartCourse]
  );
  // 处理开始学习按钮点击
  const handleDirectStartLearning = useCallback(
    (course: CourseDisplay) => {
      const originalCourse = dbCourses.find(
        (dbCourse) => dbCourse.id.toString() === course.id
      );
      if (originalCourse) {
        onStartCourse(originalCourse);
      }
    },
    [dbCourses, onStartCourse]
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            课程列表
          </h1>
          <div className="text-gray-600 mt-8">加载中...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 现代化标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
            课程中心
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            发现适合您的语言学习课程，从基础到进阶，开启您的学习之旅
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-white/50">
            <span className="text-sm font-medium text-gray-700">
              共 {courses.length} 个课程可选
            </span>
          </div>
        </div>{" "}
        {/* 卡片网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* 卡片头部 */}
              <div className="relative p-6 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur">
                {/* 完成状态徽章 */}
                {course.completed && (
                  <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {/* 课程图标 */}
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-100 rounded-2xl mb-4 shadow-inner">
                  <span className="text-3xl">
                    {<course.icon className="w-8 h-8 text-purple-400" />}
                  </span>
                </div>{" "}
                {/* 课程标题 - 单行显示，支持悬停显示全部 */}
                <div className="relative mb-2">
                  <h3
                    className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors truncate cursor-help peer"
                    title={course.title}
                  >
                    {course.title}
                  </h3>
                  {/* 悬停标题时显示完整标题的工具提示 */}
                  <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                    <div className="max-w-xs break-words whitespace-normal">
                      {course.title}
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
                {/* 课程描述 - 固定三行高度 */}
                <div className="mb-4" style={{ height: "3.6rem" }}>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed h-full">
                    {course.description || "暂无课程描述"}
                  </p>
                </div>
                {/* 标签区域 */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getLevelColor(
                      course.level
                    )}`}
                  >
                    {getLevelText(course.level)}
                  </span>
                  <span className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                    {course.lessonCount} 课时
                  </span>
                </div>
              </div>

              {/* 进度条区域 - 固定高度，避免影响按钮对齐 */}
              <div
                className="px-6 pb-4 bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur"
                style={{ minHeight: "60px" }}
              >
                {course.progress > 0 ? (
                  <div className="h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">学习进度</span>
                      <span className="font-bold text-purple-600">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          course.completed
                            ? "bg-gradient-to-r from-blue-400 to-blue-500"
                            : "bg-gradient-to-r from-purple-400 to-purple-500"
                        }`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">尚未开始学习</span>
                  </div>
                )}
              </div>

              {/* 卡片底部操作区 - 固定位置 */}
              <div className="p-6 bg-white/50 backdrop-blur border-t border-gray-200/50">
                <div className="flex items-center gap-3">
                  {/* 课时详情按钮 */}
                  <button
                    className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      showLessonDetails(course);
                    }}
                    title="查看课时详情"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  {/* 开始学习按钮 */}
                  <button
                    className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      course.completed
                        ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl"
                        : course.progress > 0
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (course.completed) {
                        setRestartConfirmCourse(course);
                      } else {
                        handleDirectStartLearning(course);
                      }
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {course.completed ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          重新学习
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          继续学习
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          开始学习
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 空状态 */}
        {courses.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              暂无课程
            </h3>
            <p className="text-gray-600">课程正在加载中，请稍候...</p>
          </div>
        )}{" "}
      </div>

      {/* 课时详情弹出框 */}
      <Modal
        isOpen={!!selectedCourseForLessons}
        onClose={() => setSelectedCourseForLessons(null)}
        title=""
        maxWidth="max-w-2xl"
      >
        {selectedCourseForLessons && (
          <div className="p-2">
            {/* 弹出框头部 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-100 rounded-xl shadow-inner">
                <span className="text-2xl">
                  <selectedCourseForLessons.icon className="w-8 h-8 text-purple-400" />
                </span>
              </div>{" "}
              <div>
                <div className="relative mb-1">
                  <h3
                    className="text-xl font-bold text-gray-900 truncate cursor-help peer"
                    title={selectedCourseForLessons.title}
                  >
                    {selectedCourseForLessons.title}
                  </h3>
                  {/* 悬停标题时显示完整标题的工具提示 */}
                  <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                    <div className="max-w-xs break-words whitespace-normal">
                      {selectedCourseForLessons.title}
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(
                      selectedCourseForLessons.level
                    )}`}
                  >
                    {getLevelText(selectedCourseForLessons.level)}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                    {selectedCourseForLessons.lessonCount} 课时
                  </span>
                  {selectedCourseForLessons.completed && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                      已完成
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 课时详情内容 */}
            <div className="border rounded-xl bg-gray-50/50 p-4">
              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                课时详情
              </h4>

              {loadingLessons ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">加载课时详情中...</span>
                  </div>
                </div>
              ) : selectedCourseForLessons.lessons &&
                selectedCourseForLessons.lessons.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {selectedCourseForLessons.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-4 bg-white/80 backdrop-blur rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              第{lesson.order}课
                            </span>
                            {lesson.completed && (
                              <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>{" "}
                          <div className="relative mb-2">
                            <h5
                              className="text-sm font-medium text-gray-800 truncate cursor-help peer"
                              title={lesson.title}
                            >
                              {lesson.title}
                            </h5>
                            {/* 悬停课时标题时显示完整标题的工具提示 */}
                            <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                              <div className="max-w-xs break-words whitespace-normal">
                                {lesson.title}
                              </div>
                              <div className="absolute -top-0.5 left-2 w-1 h-1 bg-gray-800 rotate-45"></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {lesson.completedSentences}/
                              {lesson.totalSentences} 句
                            </span>
                            <span className="font-semibold text-purple-600">
                              {lesson.progress}%
                            </span>
                          </div>
                          {lesson.totalSentences > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  lesson.completed
                                    ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                    : "bg-gradient-to-r from-purple-400 to-purple-500"
                                }`}
                                style={{ width: `${lesson.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6"
                    />
                  </svg>
                  <span className="text-sm">暂无课时数据</span>
                </div>
              )}
            </div>

            {/* 弹出框底部按钮 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedCourseForLessons(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  if (selectedCourseForLessons.completed) {
                    setSelectedCourseForLessons(null);
                    setRestartConfirmCourse(selectedCourseForLessons);
                  } else {
                    setSelectedCourseForLessons(null);
                    handleDirectStartLearning(selectedCourseForLessons);
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedCourseForLessons.completed
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : selectedCourseForLessons.progress > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {selectedCourseForLessons.completed
                  ? "重新学习"
                  : selectedCourseForLessons.progress > 0
                  ? "继续学习"
                  : "开始学习"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 重新学习确认对话框 */}
      <Modal
        isOpen={!!restartConfirmCourse}
        onClose={() => setRestartConfirmCourse(null)}
        title=""
        maxWidth="max-w-sm"
      >
        {restartConfirmCourse && (
          <div className="text-center py-2">
            <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">重新学习确认</h3>
            <p className="text-gray-600 mb-4">
              重新学习将清空「{restartConfirmCourse.title}
              」的所有学习记录和进度，确定要继续吗？
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRestartConfirmCourse(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isResetting}
              >
                取消
              </button>
              <button
                onClick={() =>
                  restartConfirmCourse &&
                  handleResetCourseProgress(restartConfirmCourse)
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isResetting}
              >
                {isResetting ? "重置中..." : "重新学习"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Courses;
