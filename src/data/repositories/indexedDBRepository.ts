import { Dexie } from 'dexie';
import type { Table } from 'dexie';
import { IDataRepository } from "../interfaces/dataRepository";
import {
  Course,
  Lesson,
  SentencePair,
  LearningProgress,
  QueryParams,
  WordRecord,
  VocabularyBook,
  VocabularyStatus,
  WordMeaning
} from "../types";
import { sampleCourses } from "../sampleCourses";
import { beginnerEnglishDialogueCourse } from '../beginnerEnglishDialogueCourse';

// Dexie 数据库类
class LanguageLearningDB extends Dexie {
  courses!: Table<Course>;
  learningProgress!: Table<LearningProgress>;
  metadata!: Table<{ key: string; value: unknown }>;
  words!: Table<WordRecord>;
  vocabularyBooks!: Table<VocabularyBook>;

  constructor() {
    super('LanguageLearningDB');
    
    this.version(1).stores({
      courses: 'id, category, difficulty, name, *tags',
      learningProgress: '[courseId+lessonId], courseId',
      metadata: 'key'
    });

    this.version(2).stores({
      words: '++id, word, status',
      vocabularyBooks: '++id, name, type'
    });

    // 添加版本3，处理法语数据迁移
    this.version(3).stores({}).upgrade(async tx => {
      // 已知的需要修复的数据位置
      const targetData = [
        {
          courseId: 1,  // beginnerEnglishDialogueCourse 的 ID
          lessonId: 4,  // "第4节：饮食喜好" 的 ID
          sentenceId: 40,  // "Bon appétit!" 句子的 ID
          newEnglish: "Enjoy your meal!",
          newPhonetic: "ɪnˈdʒɔɪ jɔː miːl"
        }
      ];

      for (const target of targetData) {
        const course = await tx.table('courses').get(target.courseId);
        if (!course) continue;

        const lesson = course.lessons?.find((l: Lesson) => l.id === target.lessonId);
        if (!lesson) continue;

        const sentence = lesson.sentences?.find((s: SentencePair) => s.id === target.sentenceId);
        if (!sentence) continue;

        // 更新句子内容
        sentence.english = target.newEnglish;
        sentence.phonetic = target.newPhonetic;

        // 保存更改
        await tx.table('courses').put(course);
      }
    });
  }
}

// Dexie 优化的数据仓库实现
export class IndexedDBRepository implements IDataRepository {
  private db: LanguageLearningDB;
  
  // 保留的ID范围配置
  private static readonly RESERVED_ID_RANGES = {
    // 系统默认课程ID范围：1-1000
    SYSTEM_COURSES: { min: 1, max: 1000 },
    // 用户课程ID从1001开始
    USER_COURSES: { min: 1001, max: Number.MAX_SAFE_INTEGER }
  };
  
  constructor() {
    this.db = new LanguageLearningDB();
  }
  async initialize(): Promise<void> {
    await this.db.open();
    await this.loadSampleDataIfNeeded();
    // 修复可能存在的错误ID计数器
    await this.fixUserCourseIdCounter();
  }

  async cleanup(): Promise<void> {
    await this.db.close();
  }  // 辅助方法：获取下一个课程ID
  private async getNextCourseId(): Promise<number> {
    const record = await this.db.metadata.get("nextCourseId");
    const currentValue = (record?.value as number) || IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min;
    
    // 确保当前值至少是用户课程的最小值
    const safeCurrentValue = Math.max(currentValue, IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min);
    const nextValue = safeCurrentValue + 1;
    
    await this.db.metadata.put({ key: "nextCourseId", value: nextValue });
    return safeCurrentValue;
  }
  // 辅助方法：获取并更新下一个ID
  private async getNextId(key: string, minValue = 1): Promise<number> {
    try {
      let currentValue: number;
      await this.db.transaction('rw', this.db.metadata, async () => {
        const record = await this.db.metadata.get(key);
        currentValue = (record?.value as number) || minValue;
        const nextValue = currentValue + 1;
        
        await this.db.metadata.put({ key, value: nextValue });
      });
      return currentValue!;
    } catch (error: unknown) {
      console.error(`Error getting next ID for ${key}:`, error);
      throw error;
    }
  }

  // 辅助方法：获取表中当前最大ID
  private async getMaxId(table: Table<any>): Promise<number> {
    const lastRecord = await table.orderBy(':id').last();
    return lastRecord?.id || 0;
  }

  // 辅助方法：确保ID不重复
  private async ensureUniqueId(table: Table<any>, id: number): Promise<number> {
    const exists = await table.get(id);
    if (exists) {
      // 如果ID已存在，获取当前最大ID并加1
      const maxId = await this.getMaxId(table);
      return maxId + 1;
    }
    return id;
  }

  // 辅助方法：检查ID是否在保留范围内
  private isReservedCourseId(id: number): boolean {
    const { min, max } = IndexedDBRepository.RESERVED_ID_RANGES.SYSTEM_COURSES;
    return id >= min && id <= max;
  }

  // 辅助方法：验证课程ID是否可用于用户创建
  private validateUserCourseId(id: number): boolean {
    const { min } = IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES;
    return id >= min;
  }

  // 辅助方法：检查是否需要加载示例数据
  private async loadSampleDataIfNeeded(): Promise<void> {
    const courses = await this.getAllCourses();
    if (courses.length === 0) {
      await this.loadSampleData();
    }
  }  // 加载示例数据
  private async loadSampleData(): Promise<void> {
    await this.db.transaction('rw', this.db.courses, this.db.metadata, async () => {
      // 检查 sampleCourses 的 id 是否已存在，避免重复插入
      const existingIds = new Set((await this.db.courses.toArray()).map(c => c.id));
      const newCourses = sampleCourses.filter(course => !existingIds.has(course.id));
      if (newCourses.length > 0) {
        await this.db.courses.bulkAdd(newCourses);
      }
      if (beginnerEnglishDialogueCourse.id && !existingIds.has(beginnerEnglishDialogueCourse.id)) {
        await this.db.courses.add(beginnerEnglishDialogueCourse);
      }      
      // 设置用户课程的起始ID，确保不与系统保留ID冲突
      // 检查是否已有nextCourseId记录，如果没有才设置
      const existingRecord = await this.db.metadata.get("nextCourseId");
      if (!existingRecord) {
        const userCoursesStartId = IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min;
        await this.db.metadata.put({ key: "nextCourseId", value: userCoursesStartId });
      }
    });
  }
  
  // 公共方法：获取保留ID范围信息
  static getReservedIdRanges() {
    return IndexedDBRepository.RESERVED_ID_RANGES;
  }

  // 公共方法：检查ID是否为系统保留ID
  static isSystemReservedId(id: number): boolean {
    const { min, max } = IndexedDBRepository.RESERVED_ID_RANGES.SYSTEM_COURSES;
    return id >= min && id <= max;
  }

  // 公共方法：获取下一个可用的用户课程ID（用于外部调用）
  async getNextAvailableUserCourseId(): Promise<number> {
    return this.getNextCourseId();
  }
  
  // 课程相关操作
  async getAllCourses(params?: QueryParams): Promise<Course[]> {
    let courses = await this.db.courses.toArray();

    // 应用过滤器
    if (params?.filters) {
      courses = this.applyCourseFilters(courses, params.filters);
    }

    // 应用排序
    if (params?.sortBy) {
      courses = this.sortCourses(
        courses,
        params.sortBy,
        params.sortOrder || "asc"
      );
    }

    // 应用分页
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      courses = courses.slice(start, end);
    }

    return courses;
  }

  async getCourseById(id: number): Promise<Course | null> {
    return await this.db.courses.get(id) || null;
  }
  async createCourse(courseData: Omit<Course, "id">): Promise<Course> {
    let id = await this.getNextCourseId();
    
    // 验证生成的ID是否符合用户课程ID规范
    if (!this.validateUserCourseId(id)) {
      throw new Error(`Generated course ID ${id} is in reserved range. User courses must have ID >= ${IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min}`);
    }

    id = await this.ensureUniqueId(this.db.courses, id);
    
    const course: Course = {
      ...courseData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await this.db.courses.add(course);
      return course;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConstraintError') {
        console.error(`Duplicate key error for course:`, error);
        throw new Error(`Failed to create course: duplicate key error`);
      }
      throw error;
    }
  }

  async updateCourse(
    id: number,
    courseData: Partial<Course>
  ): Promise<Course | null> {
    const existingCourse = await this.getCourseById(id);
    if (!existingCourse) {
      return null;
    }

    const updatedCourse: Course = {
      ...existingCourse,
      ...courseData,
      id, // 确保ID不被更改
      updatedAt: new Date(),
    };    await this.db.courses.put(updatedCourse);
    return updatedCourse;
  }
  async deleteCourse(id: number): Promise<boolean> {
    // 检查是否为系统保留课程
    if (this.isReservedCourseId(id)) {
      console.warn(`Cannot delete system reserved course with ID ${id}`);
      return false;
    }
    
    try {
      await this.db.courses.delete(id);
      return true;
    } catch {
      return false;
    }
  }

  // 系统课程管理方法
  async getSystemCourses(): Promise<Course[]> {
    const allCourses = await this.db.courses.toArray();
    return allCourses.filter(course => this.isReservedCourseId(course.id));
  }

  async getUserCourses(): Promise<Course[]> {
    const allCourses = await this.db.courses.toArray();
    return allCourses.filter(course => !this.isReservedCourseId(course.id));
  }

  // 重置系统课程数据（危险操作，谨慎使用）
  async resetSystemCourses(): Promise<void> {
    await this.db.transaction('rw', this.db.courses, async () => {
      // 删除所有系统课程
      const systemCourses = await this.getSystemCourses();
      for (const course of systemCourses) {
        await this.db.courses.delete(course.id);
      }
      
      // 重新加载示例数据
      await this.loadSampleData();
    });
  }
  
  // 节次相关操作
  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    const course = await this.getCourseById(courseId);
    return course?.lessons || [];
  }

  // 句子相关操作
  async getSentencesByLesson(
    courseId: number,
    lessonId: number
  ): Promise<SentencePair[]> {
    const course = await this.getCourseById(courseId);
    const lesson = course?.lessons.find((lesson) => lesson.id === lessonId);
    return lesson?.sentences || [];
  }
  // 学习进度相关操作
  async getLearningProgress(
    courseId: number,
    lessonId: number
  ): Promise<LearningProgress | null> {
    return await this.db.learningProgress.get([courseId, lessonId]) || null;
  }

  async saveLearningProgress(
    progress: LearningProgress
  ): Promise<LearningProgress> {
    await this.db.learningProgress.put(progress);
    return progress;
  }

  async getAllLearningProgress(): Promise<LearningProgress[]> {
    return await this.db.learningProgress.toArray();
  }

  async deleteLearningProgress(
    courseId: number,
    lessonId: number
  ): Promise<boolean> {
    try {
      await this.db.learningProgress.delete([courseId, lessonId]);
      return true;
    } catch {
      return false;
    }
  }

  // 统计功能
  async getCourseStatistics(courseId: number): Promise<{
    totalLessons: number;
    totalSentences: number;
    completedSentences: number;
    averageAccuracy: number;
  }> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error(`Course with id ${courseId} not found`);
    }

    const totalLessons = course.lessons.length;
    const totalSentences = course.lessons.reduce(
      (sum, lesson) => sum + lesson.sentences.length,
      0
    );

    // 计算已完成的句子数和平均准确率
    let completedSentences = 0;
    let totalAccuracy = 0;
    let progressCount = 0;

    for (const lesson of course.lessons) {
      const progress = await this.getLearningProgress(courseId, lesson.id);
      if (progress) {
        completedSentences += progress.completedSentences.length;
        if (progress.accuracy !== undefined) {
          totalAccuracy += progress.accuracy;
          progressCount++;
        }
      }
    }

    const averageAccuracy =
      progressCount > 0 ? totalAccuracy / progressCount : 0;    return {
      totalLessons,
      totalSentences,
      completedSentences,
      averageAccuracy,
    };
  }

  // 公共方法：修复用户课程ID计数器（用于修复错误的ID序列）
  async fixUserCourseIdCounter(): Promise<void> {
    const allCourses = await this.db.courses.toArray();
    
    // 找到所有用户课程中的最大ID
    const userCourses = allCourses.filter(course => 
      !IndexedDBRepository.isSystemReservedId(course.id)
    );
    
    let nextId = IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min;
    
    if (userCourses.length > 0) {
      const maxUserCourseId = Math.max(...userCourses.map(course => course.id));
      nextId = Math.max(nextId, maxUserCourseId + 1);
    }
    
    // 更新nextCourseId记录
    await this.db.metadata.put({ key: "nextCourseId", value: nextId });
  }

  // 私有辅助方法
  private applyCourseFilters(
    courses: Course[],
    filters: Record<string, unknown>
  ): Course[] {
    return courses.filter((course) => {
      for (const [key, value] of Object.entries(filters)) {
        if (key === "category" && course.category !== value) {
          return false;
        }
        if (key === "difficulty" && course.difficulty !== value) {
          return false;
        }
        if (key === "tags" && value && Array.isArray(value)) {
          const hasMatchingTag = value.some((tag) =>
            course.tags?.includes(tag as string)
          );
          if (!hasMatchingTag) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private sortCourses(
    courses: Course[],
    sortBy: string,
    sortOrder: "asc" | "desc"
  ): Course[] {
    return courses.sort((a, b) => {
      let valueA: unknown;
      let valueB: unknown;

      switch (sortBy) {
        case "name":
          valueA = a.name;
          valueB = b.name;
          break;
        case "createdAt":
          valueA = a.createdAt;
          valueB = b.createdAt;
          break;
        case "updatedAt":
          valueA = a.updatedAt;
          valueB = b.updatedAt;
          break;
        case "totalLessons":
          valueA = a.totalLessons;
          valueB = b.totalLessons;
          break;
        case "estimatedHours":
          valueA = a.estimatedHours || 0;
          valueB = b.estimatedHours || 0;
          break;
        default:
          return 0;
      }

      if (valueA === undefined || valueA === null) return 1;
      if (valueB === undefined || valueB === null) return -1;

      let comparison = 0;
      if (valueA < valueB) {
        comparison = -1;
      } else if (valueA > valueB) {
        comparison = 1;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  // 节次相关操作
  async getLessonById(courseId: number, lessonId: number): Promise<Lesson | null> {
    const course = await this.getCourseById(courseId);
    return course?.lessons.find(lesson => lesson.id === lessonId) || null;
  }

  async createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
    const course = await this.getCourseById(lesson.courseId);
    if (!course) {
      throw new Error(`Course with id ${lesson.courseId} not found`);
    }

    let id = await this.getNextId('nextLessonId');
    id = await this.ensureUniqueId(this.db.courses, id); // 虽然lesson存储在course中，但我们仍然需要确保ID唯一

    const newLesson: Lesson = {
      ...lesson,
      id,
      sentences: lesson.sentences || []
    };

    try {
      course.lessons.push(newLesson);
      await this.updateCourse(course.id, { lessons: course.lessons });
      return newLesson;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConstraintError') {
        console.error(`Duplicate key error for lesson:`, error);
        throw new Error(`Failed to create lesson: duplicate key error`);
      }
      throw error;
    }
  }

  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | null> {
    const course = await this.getCourseById(lessonData.courseId!);
    if (!course) return null;

    const lessonIndex = course.lessons.findIndex(lesson => lesson.id === id);
    if (lessonIndex === -1) return null;

    const updatedLesson = {
      ...course.lessons[lessonIndex],
      ...lessonData,
      id // 确保ID不被更改
    };

    course.lessons[lessonIndex] = updatedLesson;
    await this.updateCourse(course.id, { lessons: course.lessons });
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const courses = await this.getAllCourses();
    for (const course of courses) {
      const lessonIndex = course.lessons.findIndex(lesson => lesson.id === id);
      if (lessonIndex !== -1) {
        course.lessons.splice(lessonIndex, 1);
        await this.updateCourse(course.id, { lessons: course.lessons });
        return true;
      }
    }
    return false;
  }

  // 句子相关操作
  async createSentence(sentence: Omit<SentencePair, 'id'>): Promise<SentencePair> {
    const lesson = await this.getLessonById(sentence.lessonId!, sentence.lessonId!);
    if (!lesson) {
      throw new Error(`Lesson with id ${sentence.lessonId} not found`);
    }

    const newSentence: SentencePair = {
      ...sentence,
      id: await this.getNextId('nextSentenceId')
    };

    lesson.sentences.push(newSentence);
    const course = await this.getCourseById(lesson.courseId);
    if (course) {
      await this.updateCourse(course.id, { lessons: course.lessons });
    }
    return newSentence;
  }

  async updateSentence(id: number, sentenceData: Partial<SentencePair>): Promise<SentencePair | null> {
    const courses = await this.getAllCourses();
    for (const course of courses) {
      for (const lesson of course.lessons) {
        const sentenceIndex = lesson.sentences.findIndex(s => s.id === id);
        if (sentenceIndex !== -1) {
          const updatedSentence = {
            ...lesson.sentences[sentenceIndex],
            ...sentenceData,
            id // 确保ID不被更改
          };
          lesson.sentences[sentenceIndex] = updatedSentence;
          await this.updateCourse(course.id, { lessons: course.lessons });
          return updatedSentence;
        }
      }
    }
    return null;
  }

  async deleteSentence(id: number): Promise<boolean> {
    const courses = await this.getAllCourses();
    for (const course of courses) {
      for (const lesson of course.lessons) {
        const sentenceIndex = lesson.sentences.findIndex(s => s.id === id);
        if (sentenceIndex !== -1) {
          lesson.sentences.splice(sentenceIndex, 1);
          await this.updateCourse(course.id, { lessons: course.lessons });
          return true;
        }
      }
    }
    return false;
  }

  // 学习进度相关操作
  async updateLearningProgress(progress: LearningProgress): Promise<void> {
    await this.saveLearningProgress(progress);
  }

  async resetLearningProgress(courseId: number, lessonId: number): Promise<void> {
    await this.deleteLearningProgress(courseId, lessonId);
  }

  // 词汇管理方法
  private async initializeWordTables(): Promise<void> {
    if (!this.db.words) {
      this.db.version(2).stores({
        words: '++id, word, status',
        vocabularyBooks: '++id, name, type'
      });
      await this.db.open();
    }
  }

  async createWordRecord(
    word: string,
    translation?: string,
    isError: boolean = false,
    additionalInfo?: {
      phonetic?: string;
      audioUrl?: string;
      meanings?: WordMeaning[];
    }
  ): Promise<WordRecord> {
    await this.initializeWordTables();
    
    // 首先检查单词是否已存在
    const existingWord = await this.getWordRecord(word);
    if (existingWord) {
      throw new Error(`Word "${word}" already exists in the database`);
    }

    const newWord: WordRecord = {
      word,
      translation,
      status: isError ? VocabularyStatus.ERROR : VocabularyStatus.NEW,
      errorCount: isError ? 1 : 0,
      dateAdded: Date.now(),
      // 添加额外的字段
      phonetic: additionalInfo?.phonetic,
      audioUrl: additionalInfo?.audioUrl,
      meanings: additionalInfo?.meanings
    };

    try {
      const id = await this.db.words.add(newWord);
      newWord.id = id;

      // 根据单词状态添加到对应的词汇本
      const bookType = isError ? 'ERROR' : 'NEW';
      const books = await this.db.vocabularyBooks.where('type').equals(bookType).toArray();
      
      if (books.length > 0) {
        // 如果存在对应类型的词汇本，添加到第一个词汇本中
        const book = books[0];
        book.words = [...book.words, newWord];
        book.updatedAt = new Date();
        await this.db.vocabularyBooks.put(book);
      } else {
        // 如果不存在对应类型的词汇本，创建一个新的
        const bookName = isError ? '错词本' : '生词本';
        await this.createVocabularyBook(bookName, bookType, [newWord]);
      }

      return newWord;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConstraintError') {
        console.error(`Duplicate key error for word "${word}":`, error);
        throw new Error(`Failed to create word record: duplicate key error`);
      }
      throw error;
    }
  }

  async getWordRecord(word: string): Promise<WordRecord | null> {
    await this.initializeWordTables();
    return await this.db.words.where('word').equals(word).first() || null;
  }

  async updateWordRecord(wordRecord: WordRecord): Promise<WordRecord> {
    await this.initializeWordTables();
    
    // 确保保留所有字段
    const existingWord = await this.getWordRecord(wordRecord.word);
    if (!existingWord) {
      throw new Error(`Word "${wordRecord.word}" not found`);
    }

    const updatedWord: WordRecord = {
      ...existingWord,
      ...wordRecord,
      id: existingWord.id, // 确保ID不变
      dateAdded: existingWord.dateAdded, // 确保添加日期不变
      // 确保可选字段被正确处理
      phonetic: wordRecord.phonetic ?? existingWord.phonetic,
      audioUrl: wordRecord.audioUrl ?? existingWord.audioUrl,
      meanings: wordRecord.meanings ?? existingWord.meanings
    };

    await this.db.words.put(updatedWord);

    // 更新词汇本中的单词信息
    const books = await this.getAllVocabularyBooks();
    for (const book of books) {
      const wordIndex = book.words.findIndex(w => w.id === updatedWord.id);
      if (wordIndex !== -1) {
        book.words[wordIndex] = updatedWord;
        book.updatedAt = new Date();
        await this.db.vocabularyBooks.put(book);
      }
    }

    return updatedWord;
  }

  async incrementWordError(word: string): Promise<WordRecord | null> {
    const wordRecord = await this.getWordRecord(word);
    if (!wordRecord) {
      // 如果单词不存在，创建一个新的错误单词记录
      try {
        return await this.createWordRecord(word, undefined, true);
      } catch (error) {
        console.error(`Failed to create error word record for "${word}":`, error);
        return null;
      }
    }

    const updatedWord: WordRecord = {
      ...wordRecord,
      errorCount: (wordRecord.errorCount || 0) + 1,
      status: VocabularyStatus.ERROR,
      // 保留所有原有字段
      phonetic: wordRecord.phonetic,
      audioUrl: wordRecord.audioUrl,
      meanings: wordRecord.meanings,
      dateAdded: wordRecord.dateAdded
    };

    try {
      await this.updateWordRecord(updatedWord);

      // 从生词本移动到错词本
      if (wordRecord.status !== VocabularyStatus.ERROR) {
        // 从原词汇本中移除
        const oldBooks = await this.getAllVocabularyBooks();
        for (const book of oldBooks) {
          if (book.words.some(w => w.id === wordRecord.id)) {
            book.words = book.words.filter(w => w.id !== wordRecord.id);
            book.updatedAt = new Date();
            await this.db.vocabularyBooks.put(book);
          }
        }

        // 添加到错词本
        const errorBooks = await this.db.vocabularyBooks.where('type').equals('ERROR').toArray();
        if (errorBooks.length > 0) {
          const errorBook = errorBooks[0];
          errorBook.words = [...errorBook.words, updatedWord];
          errorBook.updatedAt = new Date();
          await this.db.vocabularyBooks.put(errorBook);
        } else {
          await this.createVocabularyBook('错词本', 'ERROR', [updatedWord]);
        }
      }

      return updatedWord;
    } catch (error) {
      console.error(`Failed to increment error count for word "${word}":`, error);
      return null;
    }
  }

  async markWordAsMastered(word: string): Promise<WordRecord | null> {
    const wordRecord = await this.getWordRecord(word);
    if (!wordRecord) return null;

    const updatedWord: WordRecord = {
      ...wordRecord,
      status: VocabularyStatus.MASTERED,
      dateAdded: wordRecord.dateAdded
    };

    await this.updateWordRecord(updatedWord);
    return updatedWord;
  }

  async createVocabularyBook(
    name: string, 
    type: 'NEW' | 'ERROR' | 'MASTERED',
    initialWords: WordRecord[] = []
  ): Promise<VocabularyBook> {
    await this.initializeWordTables();
    
    // 检查是否已存在同名词汇本
    const existingBooks = await this.db.vocabularyBooks.where('name').equals(name).toArray();
    if (existingBooks.length > 0) {
      throw new Error(`Vocabulary book "${name}" already exists`);
    }

    const now = new Date();
    const newBook: VocabularyBook = {
      name,
      type,
      words: initialWords,
      createdAt: now,
      updatedAt: now
    };

    try {
      const id = await this.db.vocabularyBooks.add(newBook);
      newBook.id = id;
      return newBook;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ConstraintError') {
        console.error(`Duplicate key error for vocabulary book "${name}":`, error);
        throw new Error(`Failed to create vocabulary book: duplicate key error`);
      }
      throw error;
    }
  }

  async getVocabularyBook(id: number): Promise<VocabularyBook | null> {
    await this.initializeWordTables();
    return await this.db.vocabularyBooks.get(id) || null;
  }

  async getAllVocabularyBooks(): Promise<VocabularyBook[]> {
    await this.initializeWordTables();
    return await this.db.vocabularyBooks.toArray();
  }

  async getWordsByStatus(status: string): Promise<WordRecord[]> {
    await this.initializeWordTables();
    return await this.db.words.where('status').equals(status).toArray();
  }

  async getErrorWords(): Promise<WordRecord[]> {
    return this.getWordsByStatus('ERROR');
  }

  async getMasteredWords(): Promise<WordRecord[]> {
    return this.getWordsByStatus('MASTERED');
  }

  async getWordByValue(word: string): Promise<WordRecord | null> {
    return this.getWordRecord(word);
  }

  async addWord(word: Omit<WordRecord, 'id'>): Promise<void> {
    await this.createWordRecord(
      word.word,
      word.translation,
      word.status === VocabularyStatus.ERROR,
      {
        phonetic: word.phonetic,
        audioUrl: word.audioUrl,
        meanings: word.meanings
      }
    );
  }

  async updateWord(word: WordRecord): Promise<void> {
    await this.updateWordRecord(word);
  }

  async deleteWord(id: number): Promise<void> {
    await this.initializeWordTables();
    await this.db.words.delete(id);
  }

  // 进度相关
  async getLessonProgress(courseId: number, lessonId: number): Promise<{ completedSentences: number[] }> {
    const progress = await this.getLearningProgress(courseId, lessonId);
    return {
      completedSentences: progress?.completedSentences || []
    };
  }

  async updateLessonProgress(courseId: number, lessonId: number, completedSentences: number[]): Promise<void> {
    const lesson = await this.getLessonById(courseId, lessonId);
    if (!lesson) {
      throw new Error(`Lesson not found: courseId=${courseId}, lessonId=${lessonId}`);
    }

    const progress: LearningProgress = {
      courseId,
      lessonId,
      completedSentences,
      totalSentences: lesson.sentences.length,
      accuracy: 0,
      attempts: 0
    };

    await this.saveLearningProgress(progress);
  }

  async resetLessonProgress(courseId: number, lessonId: number): Promise<void> {
    await this.resetLearningProgress(courseId, lessonId);
  }
}
