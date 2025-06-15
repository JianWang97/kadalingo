import React, { useState, useEffect } from "react";
import { Modal } from "../components/common";
import { Course } from "../data/types";
import {
  RepositoryFactory,
  getStorageConfig,
} from "../data/repositories/RepositoryFactory";

// 简化的课程显示接口（用于UI）
interface CourseDisplay {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: "beginner" | "intermediate" | "advanced";
  lessonCount: number;
  completed: boolean;
}

// 将数据库课程转换为显示课程
const convertCourseToDisplay = (course: Course): CourseDisplay => ({
  id: course.id.toString(),
  title: course.name,
  description: course.description || "",
  icon: getIconForCategory(course.category),
  level: course.difficulty,
  lessonCount: course.totalLessons,
  completed: false, // TODO: 从学习进度中获取
});

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

  useEffect(() => {
    const loadCourses = async () => {      try {
        setLoading(true);
        const factory = RepositoryFactory.getInstance();
        const config = getStorageConfig();
        const repository = await factory.createRepository(config);
        const courseData = await repository.getAllCourses();
        setDbCourses(courseData);
        const displayCourses = courseData.map(convertCourseToDisplay);
        setCourses(displayCourses);
      } catch (error) {
        console.error("加载课程失败:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

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
      </div>
      {/* 简约列表 */}
      <div className="space-y-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedCourse(course)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{course.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
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
                  </div>
                </div>
              </div>
              <button
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCourse(course);
                }}
              >
                开始
              </button>
            </div>
          </div>
        ))}
      </div>{" "}
      {/* 简洁的课程详情模态框 */}
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
            </div>

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
                开始学习
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Courses;
