import { Course, Lesson, SentencePair, LearningProgress, QueryParams } from '../types';

// 数据仓库接口，定义所有数据访问方法
export interface IDataRepository {
  // 初始化连接
  initialize(): Promise<void>;
  
  // 清理资源（可选）
  cleanup?(): Promise<void>;

  // 课程相关操作
  getAllCourses(params?: QueryParams): Promise<Course[]>;  getCourseById(id: number): Promise<Course | null>;
  createCourse(course: Omit<Course, 'id'>): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | null>;
  deleteCourse(id: number): Promise<boolean>;
  // 节次相关操作
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  // 句子相关操作
  getSentencesByLesson(courseId: number, lessonId: number): Promise<SentencePair[]>;
  // 学习进度相关操作
  getLearningProgress(courseId: number, lessonId: number): Promise<LearningProgress | null>;
  saveLearningProgress(progress: LearningProgress): Promise<LearningProgress>;
  getAllLearningProgress(): Promise<LearningProgress[]>;
  deleteLearningProgress(courseId: number, lessonId: number): Promise<boolean>;
  // 统计功能
  getCourseStatistics(courseId: number): Promise<{
    totalLessons: number;
    totalSentences: number;
    completedSentences: number;
    averageAccuracy: number;
  }>;
}
