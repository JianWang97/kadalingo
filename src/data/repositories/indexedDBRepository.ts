import { Dexie } from 'dexie';
import type { Table } from 'dexie';
import { IDataRepository } from "../interfaces/dataRepository";
import {
  Course,
  Lesson,
  SentencePair,
  LearningProgress,
  QueryParams,
} from "../types";
import { sampleCourses } from "../sampleCourses";
import { beginnerEnglishDialogueCourse } from '../beginnerEnglishDialogueCourse';

// Dexie 数据库类
class LanguageLearningDB extends Dexie {
  courses!: Table<Course>;
  learningProgress!: Table<LearningProgress>;
  metadata!: Table<{ key: string; value: unknown }>;

  constructor() {
    super('LanguageLearningDB');
    
    this.version(1).stores({
      courses: 'id, category, difficulty, name, *tags',
      learningProgress: '[courseId+lessonId], courseId',
      metadata: 'key'
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
    const record = await this.db.metadata.get(key);
    const currentValue = (record?.value as number) || minValue;
    const nextValue = currentValue + 1;
    
    await this.db.metadata.put({ key, value: nextValue });
    return currentValue;
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
    const id = await this.getNextCourseId();
    
    // 验证生成的ID是否符合用户课程ID规范
    if (!this.validateUserCourseId(id)) {
      throw new Error(`Generated course ID ${id} is in reserved range. User courses must have ID >= ${IndexedDBRepository.RESERVED_ID_RANGES.USER_COURSES.min}`);
    }
    
    const course: Course = {
      ...courseData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.courses.add(course);
    return course;
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

}
