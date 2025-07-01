import {
  Course,
  Lesson,
  SentencePair,
  LearningProgress,
  QueryParams,
  WordRecord,
  VocabularyBook,
  VocabularyStatus
} from "../types";

export interface QueryParams {
  [key: string]: any;
}

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
  // 节次相关操作
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  getLessonById(courseId: number, lessonId: number): Promise<Lesson | null>;
  createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | null>;
  deleteLesson(id: number): Promise<boolean>;
  // 句子相关操作
  getSentencesByLesson(courseId: number, lessonId: number): Promise<SentencePair[]>;
  createSentence(sentence: Omit<SentencePair, 'id'>): Promise<SentencePair>;
  updateSentence(id: number, sentence: Partial<SentencePair>): Promise<SentencePair | null>;
  deleteSentence(id: number): Promise<boolean>;
  // 学习进度相关操作
  getLearningProgress(courseId: number, lessonId: number): Promise<LearningProgress | null>;
  updateLearningProgress(progress: LearningProgress): Promise<void>;
  resetLearningProgress(courseId: number, lessonId: number): Promise<void>;
  // 统计功能
  getCourseStatistics(courseId: number): Promise<{
    totalLessons: number;
    totalSentences: number;
    completedSentences: number;
    averageAccuracy: number;
  }>;

  // 词汇管理方法
  createWordRecord(word: string, translation?: string): Promise<WordRecord>;
  getWordRecord(word: string): Promise<WordRecord | null>;
  updateWordRecord(wordRecord: WordRecord): Promise<WordRecord>;
  incrementWordError(word: string): Promise<WordRecord | null>;
  markWordAsMastered(word: string): Promise<WordRecord | null>;
  createVocabularyBook(name: string, type: 'NEW' | 'ERROR' | 'MASTERED'): Promise<VocabularyBook>;
  getVocabularyBook(id: number): Promise<VocabularyBook | null>;
  getAllVocabularyBooks(): Promise<VocabularyBook[]>;
  getWordsByStatus(status: string): Promise<WordRecord[]>;
  getErrorWords(): Promise<WordRecord[]>;
  getMasteredWords(): Promise<WordRecord[]>;
  getWordByValue(word: string): Promise<WordRecord | null>;
  addWord(word: Omit<WordRecord, 'id'>): Promise<void>;
  updateWord(word: WordRecord): Promise<void>;
  deleteWord(id: number): Promise<void>;

  // 进度相关
  getLessonProgress(courseId: number, lessonId: number): Promise<{ completedSentences: number[] }>;
  updateLessonProgress(courseId: number, lessonId: number, completedSentences: number[]): Promise<void>;
  resetLessonProgress(courseId: number, lessonId: number): Promise<void>;
}
