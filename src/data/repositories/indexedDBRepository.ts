import { IDataRepository } from "../interfaces/dataRepository";
import {
  Course,
  Lesson,
  SentencePair,
  LearningProgress,
  QueryParams,
} from "../types";
import { sampleCourses } from "../sampleData";

// IndexedDB 数据库配置
const DB_NAME = "LanguageLearningDB";
const DB_VERSION = 1;

// Object Store 名称
const STORES = {
  COURSES: "courses",
  SENTENCES: "sentences",
  LEARNING_PROGRESS: "learningProgress",
  METADATA: "metadata",
} as const;

// IndexedDB 数据仓库实现
export class IndexedDBRepository implements IDataRepository {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // 初始化完成后加载示例数据
        this.loadSampleDataIfNeeded().then(resolve).catch(reject);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建课程存储
        if (!db.objectStoreNames.contains(STORES.COURSES)) {
          const courseStore = db.createObjectStore(STORES.COURSES, {
            keyPath: "id",
            autoIncrement: false,
          });
          courseStore.createIndex("category", "category", { unique: false });
          courseStore.createIndex("difficulty", "difficulty", {
            unique: false,
          });
          courseStore.createIndex("name", "name", { unique: false });
        }

        // 创建句子存储
        if (!db.objectStoreNames.contains(STORES.SENTENCES)) {
          const sentenceStore = db.createObjectStore(STORES.SENTENCES, {
            keyPath: "id",
            autoIncrement: false,
          });
          sentenceStore.createIndex("difficulty", "difficulty", {
            unique: false,
          });
        }

        // 创建学习进度存储
        if (!db.objectStoreNames.contains(STORES.LEARNING_PROGRESS)) {
          const progressStore = db.createObjectStore(STORES.LEARNING_PROGRESS, {
            keyPath: ["courseId", "lessonId"],
          });
          progressStore.createIndex("courseId", "courseId", { unique: false });
        }

        // 创建元数据存储（用于存储下一个ID等信息）
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, {
            keyPath: "key",
          });
        }
      };
    });
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // 辅助方法：获取下一个课程ID
  private async getNextCourseId(): Promise<number> {
    return this.getNextId("nextCourseId");
  }

  // 辅助方法：获取下一个句子ID
  private async getNextSentenceId(): Promise<number> {
    return this.getNextId("nextSentenceId");
  }

  // 辅助方法：获取并更新下一个ID
  private async getNextId(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.METADATA], "readwrite");
      const store = transaction.objectStore(STORES.METADATA);

      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        const currentValue = getRequest.result?.value || 1;
        const nextValue = currentValue + 1;

        const putRequest = store.put({ key, value: nextValue });
        putRequest.onsuccess = () => resolve(currentValue);
        putRequest.onerror = () => reject(new Error(`Failed to update ${key}`));
      };

      getRequest.onerror = () => reject(new Error(`Failed to get ${key}`));
    });
  }

  // 辅助方法：检查是否需要加载示例数据
  private async loadSampleDataIfNeeded(): Promise<void> {
    const courses = await this.getAllCourses();
    if (courses.length === 0) {
      await this.loadSampleData();
    }
  }

  // 加载示例数据
  private async loadSampleData(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const transaction = this.db.transaction(
      [STORES.COURSES, STORES.SENTENCES, STORES.METADATA],
      "readwrite"
    );
    const courseStore = transaction.objectStore(STORES.COURSES);
    const sentenceStore = transaction.objectStore(STORES.SENTENCES);

    // 加载课程数据
    for (const course of sampleCourses) {
      courseStore.put(course);

      // 加载句子数据
      for (const lesson of course.lessons) {
        for (const sentence of lesson.sentences) {
          sentenceStore.put(sentence);
        }
      }
    }

    // 设置下一个ID
    const metadataStore = transaction.objectStore(STORES.METADATA);
    metadataStore.put({ key: "nextCourseId", value: sampleCourses.length + 1 });

    // 计算最大句子ID
    let maxSentenceId = 0;
    for (const course of sampleCourses) {
      for (const lesson of course.lessons) {
        for (const sentence of lesson.sentences) {
          if (sentence.id > maxSentenceId) {
            maxSentenceId = sentence.id;
          }
        }
      }
    }
    metadataStore.put({ key: "nextSentenceId", value: maxSentenceId + 1 });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(new Error("Failed to load sample data"));
    });
  }

  // 课程相关操作
  async getAllCourses(params?: QueryParams): Promise<Course[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.COURSES], "readonly");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.getAll();

      request.onsuccess = () => {
        let courses = request.result as Course[];

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

        resolve(courses);
      };

      request.onerror = () => reject(new Error("Failed to get courses"));
    });
  }

  async getCourseById(id: number): Promise<Course | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.COURSES], "readonly");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(new Error("Failed to get course"));
    });
  }

  async createCourse(courseData: Omit<Course, "id">): Promise<Course> {
    const id = await this.getNextCourseId();
    const course: Course = {
      ...courseData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.COURSES], "readwrite");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.put(course);

      request.onsuccess = () => resolve(course);
      request.onerror = () => reject(new Error("Failed to create course"));
    });
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
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.COURSES], "readwrite");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.put(updatedCourse);

      request.onsuccess = () => resolve(updatedCourse);
      request.onerror = () => reject(new Error("Failed to update course"));
    });
  }

  async deleteCourse(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.COURSES], "readwrite");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  async getCoursesByCategory(
    category: string,
    params?: QueryParams
  ): Promise<Course[]> {
    const filteredParams = {
      ...params,
      filters: { ...params?.filters, category },
    };
    return this.getAllCourses(filteredParams);
  }

  async getCoursesByDifficulty(
    difficulty: Course["difficulty"],
    params?: QueryParams
  ): Promise<Course[]> {
    const filteredParams = {
      ...params,
      filters: { ...params?.filters, difficulty },
    };
    return this.getAllCourses(filteredParams);
  }

  // 节次相关操作
  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    const course = await this.getCourseById(courseId);
    return course?.lessons || [];
  }

  async getLessonById(
    courseId: number,
    lessonId: number
  ): Promise<Lesson | null> {
    const course = await this.getCourseById(courseId);
    return course?.lessons.find((lesson) => lesson.id === lessonId) || null;
  }

  async createLesson(
    courseId: number,
    lessonData: Omit<Lesson, "id">
  ): Promise<Lesson> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error(`Course with id ${courseId} not found`);
    }

    const lesson: Lesson = {
      ...lessonData,
      id: Math.max(...course.lessons.map((l) => l.id), 0) + 1,
    };

    course.lessons.push(lesson);
    course.totalLessons = course.lessons.length;
    course.updatedAt = new Date();

    await this.updateCourse(courseId, course);
    return lesson;
  }

  async updateLesson(
    courseId: number,
    lessonId: number,
    lessonData: Partial<Lesson>
  ): Promise<Lesson | null> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      return null;
    }

    const lessonIndex = course.lessons.findIndex(
      (lesson) => lesson.id === lessonId
    );
    if (lessonIndex === -1) {
      return null;
    }

    const updatedLesson: Lesson = {
      ...course.lessons[lessonIndex],
      ...lessonData,
      id: lessonId, // 确保ID不被更改
    };

    course.lessons[lessonIndex] = updatedLesson;
    course.updatedAt = new Date();

    await this.updateCourse(courseId, course);
    return updatedLesson;
  }

  async deleteLesson(courseId: number, lessonId: number): Promise<boolean> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      return false;
    }

    const initialLength = course.lessons.length;
    course.lessons = course.lessons.filter((lesson) => lesson.id !== lessonId);

    if (course.lessons.length < initialLength) {
      course.totalLessons = course.lessons.length;
      course.updatedAt = new Date();
      await this.updateCourse(courseId, course);
      return true;
    }

    return false;
  }

  // 句子相关操作
  async getSentencesByLesson(
    courseId: number,
    lessonId: number
  ): Promise<SentencePair[]> {
    const lesson = await this.getLessonById(courseId, lessonId);
    return lesson?.sentences || [];
  }

  async getSentenceById(id: number): Promise<SentencePair | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readonly");
      const store = transaction.objectStore(STORES.SENTENCES);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(new Error("Failed to get sentence"));
    });
  }

  async createSentence(
    sentenceData: Omit<SentencePair, "id">
  ): Promise<SentencePair> {
    const id = await this.getNextSentenceId();
    const sentence: SentencePair = {
      ...sentenceData,
      id,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readwrite");
      const store = transaction.objectStore(STORES.SENTENCES);
      const request = store.put(sentence);

      request.onsuccess = () => resolve(sentence);
      request.onerror = () => reject(new Error("Failed to create sentence"));
    });
  }

  async updateSentence(
    id: number,
    sentenceData: Partial<SentencePair>
  ): Promise<SentencePair | null> {
    const existingSentence = await this.getSentenceById(id);
    if (!existingSentence) {
      return null;
    }

    const updatedSentence: SentencePair = {
      ...existingSentence,
      ...sentenceData,
      id, // 确保ID不被更改
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readwrite");
      const store = transaction.objectStore(STORES.SENTENCES);
      const request = store.put(updatedSentence);

      request.onsuccess = () => resolve(updatedSentence);
      request.onerror = () => reject(new Error("Failed to update sentence"));
    });
  }

  async deleteSentence(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readwrite");
      const store = transaction.objectStore(STORES.SENTENCES);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  async getSentencesByDifficulty(
    difficulty: SentencePair["difficulty"]
  ): Promise<SentencePair[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readonly");
      const store = transaction.objectStore(STORES.SENTENCES);
      const index = store.index("difficulty");
      const request = index.getAll(difficulty);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () =>
        reject(new Error("Failed to get sentences by difficulty"));
    });
  }

  // 学习进度相关操作
  async getLearningProgress(
    courseId: number,
    lessonId: number
  ): Promise<LearningProgress | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        [STORES.LEARNING_PROGRESS],
        "readonly"
      );
      const store = transaction.objectStore(STORES.LEARNING_PROGRESS);
      const request = store.get([courseId, lessonId]);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () =>
        reject(new Error("Failed to get learning progress"));
    });
  }

  async saveLearningProgress(
    progress: LearningProgress
  ): Promise<LearningProgress> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        [STORES.LEARNING_PROGRESS],
        "readwrite"
      );
      const store = transaction.objectStore(STORES.LEARNING_PROGRESS);
      const request = store.put(progress);

      request.onsuccess = () => resolve(progress);
      request.onerror = () =>
        reject(new Error("Failed to save learning progress"));
    });
  }

  async updateLearningProgress(
    courseId: number,
    lessonId: number,
    progressData: Partial<LearningProgress>
  ): Promise<LearningProgress | null> {
    const existingProgress = await this.getLearningProgress(courseId, lessonId);

    if (!existingProgress) {
      return null;
    }

    const updatedProgress: LearningProgress = {
      ...existingProgress,
      ...progressData,
      courseId, // 确保ID不被更改
      lessonId,
    };

    return this.saveLearningProgress(updatedProgress);
  }

  async getAllLearningProgress(): Promise<LearningProgress[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        [STORES.LEARNING_PROGRESS],
        "readonly"
      );
      const store = transaction.objectStore(STORES.LEARNING_PROGRESS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () =>
        reject(new Error("Failed to get all learning progress"));
    });
  }

  async deleteLearningProgress(
    courseId: number,
    lessonId: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        [STORES.LEARNING_PROGRESS],
        "readwrite"
      );
      const store = transaction.objectStore(STORES.LEARNING_PROGRESS);
      const request = store.delete([courseId, lessonId]);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  // 搜索功能
  async searchCourses(
    keyword: string,
    params?: QueryParams
  ): Promise<Course[]> {
    const allCourses = await this.getAllCourses();
    const lowerKeyword = keyword.toLowerCase();

    const courses = allCourses.filter(
      (course) =>
        course.name.toLowerCase().includes(lowerKeyword) ||
        course.description?.toLowerCase().includes(lowerKeyword) ||
        course.category.toLowerCase().includes(lowerKeyword) ||
        course.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    );

    return this.applyCourseParams(courses, params);
  }

  async searchSentences(
    keyword: string,
    params?: QueryParams
  ): Promise<SentencePair[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORES.SENTENCES], "readonly");
      const store = transaction.objectStore(STORES.SENTENCES);
      const request = store.getAll();

      request.onsuccess = () => {
        const lowerKeyword = keyword.toLowerCase();
        let sentences = (request.result as SentencePair[]).filter(
          (sentence) =>
            sentence.chinese.toLowerCase().includes(lowerKeyword) ||
            sentence.english.toLowerCase().includes(lowerKeyword)
        );

        // 应用分页
        if (params?.page && params?.pageSize) {
          const start = (params.page - 1) * params.pageSize;
          const end = start + params.pageSize;
          sentences = sentences.slice(start, end);
        }

        resolve(sentences);
      };

      request.onerror = () => reject(new Error("Failed to search sentences"));
    });
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
      progressCount > 0 ? totalAccuracy / progressCount : 0;

    return {
      totalLessons,
      totalSentences,
      completedSentences,
      averageAccuracy,
    };
  }

  // 批量操作
  async createCourses(coursesData: Omit<Course, "id">[]): Promise<Course[]> {
    const courses: Course[] = [];
    for (const courseData of coursesData) {
      const course = await this.createCourse(courseData);
      courses.push(course);
    }
    return courses;
  }

  async createSentences(
    sentencesData: Omit<SentencePair, "id">[]
  ): Promise<SentencePair[]> {
    const sentences: SentencePair[] = [];
    for (const sentenceData of sentencesData) {
      const sentence = await this.createSentence(sentenceData);
      sentences.push(sentence);
    }
    return sentences;
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

  private applyCourseParams(courses: Course[], params?: QueryParams): Course[] {
    let result = courses;

    // 应用过滤器
    if (params?.filters) {
      result = this.applyCourseFilters(result, params.filters);
    }

    // 应用排序
    if (params?.sortBy) {
      result = this.sortCourses(
        result,
        params.sortBy,
        params.sortOrder || "asc"
      );
    }

    // 应用分页
    if (params?.page && params?.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      result = result.slice(start, end);
    }

    return result;
  }
}
