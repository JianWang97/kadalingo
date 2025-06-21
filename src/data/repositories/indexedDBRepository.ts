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
  constructor() {
    this.db = new LanguageLearningDB();
  }

  async initialize(): Promise<void> {
    await this.db.open();
    await this.loadSampleDataIfNeeded();
  }

  async cleanup(): Promise<void> {
    await this.db.close();
  }
  // 辅助方法：获取下一个课程ID
  private async getNextCourseId(): Promise<number> {
    return this.getNextId("nextCourseId");
  }

  // 辅助方法：获取并更新下一个ID
  private async getNextId(key: string): Promise<number> {
    const record = await this.db.metadata.get(key);
    const currentValue = (record?.value as number) || 1;
    const nextValue = currentValue + 1;
    
    await this.db.metadata.put({ key, value: nextValue });
    return currentValue;
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
      // 设置下一个ID
      // 查找当前系统中最大的课程ID，确保下一个ID不会冲突
      const maxId = sampleCourses.reduce((max, course) => Math.max(max, course.id), 0);
      await this.db.metadata.put({ key: "nextCourseId", value: maxId + 1 });
    });
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
    try {
      await this.db.courses.delete(id);
      return true;
    } catch {
      return false;
    }
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
