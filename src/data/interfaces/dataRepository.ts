import { Course, Lesson, SentencePair, LearningProgress, QueryParams } from '../types';

// 数据仓库接口，定义所有数据访问方法
export interface IDataRepository {
  // 初始化连接
  initialize(): Promise<void>;
  
  // 清理资源（可选）
  cleanup?(): Promise<void>;

  // 课程相关操作
  getAllCourses(params?: QueryParams): Promise<Course[]>;
  getCourseById(id: number): Promise<Course | null>;
  createCourse(course: Omit<Course, 'id'>): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | null>;
  deleteCourse(id: number): Promise<boolean>;
  getCoursesByCategory(category: string, params?: QueryParams): Promise<Course[]>;
  getCoursesByDifficulty(difficulty: Course['difficulty'], params?: QueryParams): Promise<Course[]>;

  // 节次相关操作
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  getLessonById(courseId: number, lessonId: number): Promise<Lesson | null>;
  createLesson(courseId: number, lesson: Omit<Lesson, 'id'>): Promise<Lesson>;
  updateLesson(courseId: number, lessonId: number, lesson: Partial<Lesson>): Promise<Lesson | null>;
  deleteLesson(courseId: number, lessonId: number): Promise<boolean>;

  // 句子相关操作
  getSentencesByLesson(courseId: number, lessonId: number): Promise<SentencePair[]>;
  getSentenceById(id: number): Promise<SentencePair | null>;
  createSentence(sentence: Omit<SentencePair, 'id'>): Promise<SentencePair>;
  updateSentence(id: number, sentence: Partial<SentencePair>): Promise<SentencePair | null>;
  deleteSentence(id: number): Promise<boolean>;
  getSentencesByDifficulty(difficulty: SentencePair['difficulty']): Promise<SentencePair[]>;

  // 学习进度相关操作
  getLearningProgress(courseId: number, lessonId: number): Promise<LearningProgress | null>;
  saveLearningProgress(progress: LearningProgress): Promise<LearningProgress>;
  updateLearningProgress(courseId: number, lessonId: number, progress: Partial<LearningProgress>): Promise<LearningProgress | null>;
  getAllLearningProgress(): Promise<LearningProgress[]>;
  deleteLearningProgress(courseId: number, lessonId: number): Promise<boolean>;

  // 搜索功能
  searchCourses(keyword: string, params?: QueryParams): Promise<Course[]>;
  searchSentences(keyword: string, params?: QueryParams): Promise<SentencePair[]>;

  // 统计功能
  getCourseStatistics(courseId: number): Promise<{
    totalLessons: number;
    totalSentences: number;
    completedSentences: number;
    averageAccuracy: number;
  }>;
  
  // 批量操作
  createCourses(courses: Omit<Course, 'id'>[]): Promise<Course[]>;
  createSentences(sentences: Omit<SentencePair, 'id'>[]): Promise<SentencePair[]>;
}
