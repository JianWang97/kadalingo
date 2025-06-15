import React, { useState, useEffect } from "react";
import { Modal } from "../components/common";
import { Course } from "../data/types";
import {
  RepositoryFactory,
  getStorageConfig,
} from "../data/repositories/RepositoryFactory";
import { ProgressService } from "../services/progressService";

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
  icon: string;
  level: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  completed: boolean;
  progress: number; // 完成进度百分比 (0-100)
  lessons?: LessonDetail[]; // 课时详情
}

// 将数据库课程转换为显示课程
const convertCourseToDisplay = async (course: Course): Promise<CourseDisplay> => {
  const progressService = ProgressService.getInstance();
  const completionRate = await progressService.getCourseCompletionRate(course.id);
  
  return {
    id: course.id.toString(),
    title: course.name,
    description: course.description || "",
    icon: getIconForCategory(course.category),
    level: course.difficulty,
    lessonCount: course.totalLessons,
    completed: completionRate >= 1.0,
    progress: Math.round(completionRate * 100)
  };
};

// 根据课程分类获取图标
const getIconForCategory = (category: string): string => {
  const iconMap: { [key: string]: string } = {
    日常对话: "💬",
    商务英语: "💼",
    旅游英语: "✈️",
    学术写作: "📚",
    基础对话: "💬",
    商务沟通: "💼",
  };
  return iconMap[category] || "📚";
};

interface CoursesProps {
  onStartCourse: (course: Course) => void;
}

const getLevelColor = (level: CourseDisplay["level"]) => {
  switch (level) {
    case "beginner":
      return "bg-green-100 text-green-800 border-green-200";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "advanced":
      return "bg-red-100 text-red-800 border-red-200";
  }
};

const getLevelText = (level: CourseDisplay["level"]) => {
  switch (level) {
    case "beginner":
      return "初级";
    case "intermediate":
      return "中级";
    case "advanced":
      return "高级";
  }
};

const Courses: React.FC<CoursesProps> = ({ onStartCourse }) => {
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDisplay | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [dbCourses, setDbCourses] = useState<Course[]>([]); // 存储原始数据库课程数据
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set()); // 展开的课程ID
  const [loadingLessons, setLoadingLessons] = useState<Set<string>>(new Set()); // 正在加载课时的课程ID
  useEffect(() => {
    const loadCourses = async () => {      try {
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
    };    loadCourses();
  }, []);

  // 加载课时详情
  const loadLessonDetails = async (courseId: string) => {
    try {
      setLoadingLessons(prev => new Set([...prev, courseId]));
      
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repository = await factory.createRepository(config);
      const progressService = ProgressService.getInstance();
      
      // 获取课程的所有课时
      const lessons = await repository.getLessonsByCourse(parseInt(courseId));
        // 为每个课时获取进度信息
      const lessonDetails: LessonDetail[] = await Promise.all(
        lessons.map(async (lesson, index) => {
          const progress = await progressService.getLessonProgress(parseInt(courseId), lesson.id);
          const totalSentences = lesson.sentences?.length || 0;
          const completedSentences = progress?.completedSentences?.length || 0;
          const progressPercent = totalSentences > 0 ? Math.round((completedSentences / totalSentences) * 100) : 0;
          
          return {
            id: lesson.id,
            title: lesson.title,
            totalSentences,
            completedSentences,
            progress: progressPercent,
            completed: completedSentences === totalSentences && totalSentences > 0,
            order: index + 1 // 使用数组索引作为顺序
          };
        })
      );

      // 按课时顺序排序
      lessonDetails.sort((a, b) => a.order - b.order);

      // 更新课程的课时详情
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, lessons: lessonDetails }
            : course
        )
      );
    } catch (error) {
      console.error("加载课时详情失败:", error);
    } finally {
      setLoadingLessons(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  // 切换课程展开状态
  const toggleCourseExpand = async (courseId: string) => {
    const isExpanded = expandedCourses.has(courseId);
    
    if (isExpanded) {
      // 收起
      setExpandedCourses(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    } else {
      // 展开
      setExpandedCourses(prev => new Set([...prev, courseId]));
      
      // 如果还没有加载课时详情，则加载
      const course = courses.find(c => c.id === courseId);
      if (course && !course.lessons) {
        await loadLessonDetails(courseId);
      }
    }
  };

  const handleStartLearning = () => {
    if (selectedCourse) {
      // 找到对应的原始课程数据
      const originalCourse = dbCourses.find(
        (course) => course.id.toString() === selectedCourse.id
      );
      if (originalCourse) {
        onStartCourse(originalCourse);
      }
    }
  };
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
    <div className="max-w-2xl mx-auto p-6">
      {/* 简洁的标题 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">课程列表</h1>
        <p className="text-gray-600">{courses.length} 个课程可选</p>
      </div>      {/* 简约列表 */}
      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* 课程主体 */}
            <div className="p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{course.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      {course.completed && (
                        <span className="text-green-600 text-sm">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getLevelColor(
                          course.level
                        )}`}
                      >
                        {getLevelText(course.level)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {course.lessonCount} 课时
                      </span>
                      {course.progress > 0 && (
                        <span className="text-sm text-blue-600 font-medium">
                          {course.progress}%
                        </span>
                      )}
                    </div>
                    {course.progress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            course.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 展开/收起按钮 */}
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCourseExpand(course.id);
                    }}
                    title={expandedCourses.has(course.id) ? "收起课时详情" : "展开课时详情"}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedCourses.has(course.id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(course);
                    }}
                  >
                    {course.completed ? '重新学习' : course.progress > 0 ? '继续' : '开始'}
                  </button>
                </div>
              </div>
            </div>

            {/* 课时详情 - 展开时显示 */}
            {expandedCourses.has(course.id) && (
              <div className="border-t border-gray-200 bg-gray-50">
                {loadingLessons.has(course.id) ? (
                  <div className="p-4 text-center text-gray-500">
                    加载课时详情中...
                  </div>
                ) : course.lessons && course.lessons.length > 0 ? (
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">课时详情</h4>
                    {course.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              第{lesson.order}课: {lesson.title}
                            </span>
                            {lesson.completed && (
                              <span className="text-green-600 text-xs">✓ 已完成</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              进度: {lesson.completedSentences}/{lesson.totalSentences} 句
                            </span>
                            <span>{lesson.progress}%</span>
                          </div>
                          {lesson.totalSentences > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                              <div
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  lesson.completed ? 'bg-green-400' : 'bg-blue-400'
                                }`}
                                style={{ width: `${lesson.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    暂无课时数据
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>{" "}      {/* 简洁的课程详情模态框 */}
      <Modal
        isOpen={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        title=""
        maxWidth="max-w-sm"
      >
        {selectedCourse && (
          <div className="text-center py-2">
            <div className="text-3xl mb-3">{selectedCourse.icon}</div>
            <h3 className="text-lg font-semibold mb-2">
              {selectedCourse.title}
            </h3>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span
                className={`px-2 py-1 text-xs rounded-full ${getLevelColor(
                  selectedCourse.level
                )}`}
              >
                {getLevelText(selectedCourse.level)}
              </span>
              <span className="text-sm text-gray-500">
                {selectedCourse.lessonCount} 课时
              </span>
              {selectedCourse.completed && (
                <span className="text-green-600 text-sm">已完成</span>
              )}
            </div>

            {/* 进度信息 */}
            {selectedCourse.progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>学习进度</span>
                  <span>{selectedCourse.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      selectedCourse.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${selectedCourse.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStartLearning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedCourse.completed ? '重新学习' : selectedCourse.progress > 0 ? '继续学习' : '开始学习'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Courses;
