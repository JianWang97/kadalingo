import { describe, it, expect, beforeEach, vi } from "vitest";
import { CourseStatsService } from "./courseStatsService";
import { Course, LearningProgress } from "../../data/types";
import { IDataRepository } from "../../data/interfaces/dataRepository";
import { TestUtils } from "../../test/testUtils";
// Mock 数据
const mockCourses: Course[] = [
  {
    id: 1,
    name: "英语基础对话",
    difficulty: "beginner",
    category: "日常对话",
    lessons: [],
    totalLessons: 3,
    estimatedHours: 2,
  },
  {
    id: 2,
    name: "商务英语入门",
    difficulty: "intermediate",
    category: "商务英语",
    lessons: [],
    totalLessons: 5,
    estimatedHours: 4,
  },
];

const mockProgress: LearningProgress[] = [
  {
    courseId: 1,
    lessonId: 1,
    completedSentences: [1, 2, 3],
    totalSentences: 3,
    accuracy: 0.9,
    attempts: 1,
  },
  {
    courseId: 1,
    lessonId: 2,
    completedSentences: [1, 2],
    totalSentences: 4,
    accuracy: 0.8,
    attempts: 2,
  },
  {
    courseId: 2,
    lessonId: 1,
    completedSentences: [1, 2, 3, 4, 5],
    totalSentences: 5,
    accuracy: 0.95,
    attempts: 1,
  },
];

// Mock Repository
const createMockRepository = (): IDataRepository => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  getAllCourses: vi.fn().mockResolvedValue(mockCourses),
  getAllLearningProgress: vi.fn().mockResolvedValue(mockProgress),
  getCourseById: vi
    .fn()
    .mockImplementation((id: number) =>
      Promise.resolve(mockCourses.find((c) => c.id === id) || null)
    ),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  getLessonsByCourse: vi.fn(),
  getSentencesByLesson: vi.fn(),
  getLearningProgress: vi.fn(),
  saveLearningProgress: vi.fn(),
  deleteLearningProgress: vi.fn(),
  getCourseStatistics: vi.fn(),
});

describe("CourseStatsService", () => {
  let service: CourseStatsService;
  let mockRepository: IDataRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new CourseStatsService(mockRepository);
  });

  describe("getCourseStats", () => {
    it("应该返回正确的课程统计信息", async () => {
      const stats = await service.getCourseStats();

      expect(stats).toEqual({
        totalCourses: 2,
        completedCourses: 0, // 没有完全完成的课程
        inProgressCourses: 2, // 两个课程都有进度
        totalLessons: 8, // 3 + 5
        completedLessons: 2, // 两个课时完全完成：courseId 1 lessonId 1 和 courseId 2 lessonId 1
      });
    });

    it("当没有课程时应该返回零值统计", async () => {
      vi.mocked(mockRepository.getAllCourses).mockResolvedValue([]);
      vi.mocked(mockRepository.getAllLearningProgress).mockResolvedValue([]);

      const stats = await service.getCourseStats();

      expect(stats).toEqual({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLessons: 0,
        completedLessons: 0,
      });
    });
    it("当发生错误时应该返回默认值", async () => {
      // 抑制预期的错误日志输出
      const consoleSpy = TestUtils.suppressConsoleError();

      vi.mocked(mockRepository.getAllCourses).mockRejectedValue(
        new Error("数据库错误")
      );

      const stats = await service.getCourseStats();

      expect(stats).toEqual({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLessons: 0,
        completedLessons: 0,
      });

      // 验证错误被正确记录
      expect(consoleSpy).toHaveBeenCalledWith(
        "获取课程统计失败:",
        expect.any(Error)
      );

      // 恢复 console.error
      consoleSpy.mockRestore();
    });
  });

  describe("getCourseCompletionStatus", () => {
    it("当课程不存在时应该返回 false", async () => {
      const result = await service.getCourseCompletionStatus(999);
      expect(result).toBe(false);
    });

    it("当课程没有学习进度时应该返回 false", async () => {
      vi.mocked(mockRepository.getAllLearningProgress).mockResolvedValue([]);

      const result = await service.getCourseCompletionStatus(1);
      expect(result).toBe(false);
    });

    it("当课程部分完成时应该返回 false", async () => {
      const result = await service.getCourseCompletionStatus(1);
      expect(result).toBe(false);
    });
    it("当发生错误时应该返回 false", async () => {
      // 抑制预期的错误日志输出
      const consoleSpy = TestUtils.suppressConsoleError();

      vi.mocked(mockRepository.getCourseById).mockRejectedValue(
        new Error("数据库错误")
      );

      const result = await service.getCourseCompletionStatus(1);
      expect(result).toBe(false);

      // 验证错误被正确记录
      expect(consoleSpy).toHaveBeenCalledWith(
        "获取课程完成状态失败:",
        expect.any(Error)
      );

      // 恢复 console.error
      consoleSpy.mockRestore();
    });
  });

  describe("getLearningProgressPercentage", () => {
    it("应该返回正确的学习进度百分比", async () => {
      const percentage = await service.getLearningProgressPercentage(); // 总课时数: 8, 完成课时数: 2
      // 进度百分比: (2/8) * 100 = 25
      expect(percentage).toBe(25);
    });

    it("当没有课程时应该返回 0", async () => {
      vi.mocked(mockRepository.getAllCourses).mockResolvedValue([]);

      const percentage = await service.getLearningProgressPercentage();
      expect(percentage).toBe(0);
    });

    it("当总课时数为 0 时应该返回 0", async () => {
      const coursesWithNoLessons = mockCourses.map((course) => ({
        ...course,
        totalLessons: 0,
      }));
      vi.mocked(mockRepository.getAllCourses).mockResolvedValue(
        coursesWithNoLessons
      );

      const percentage = await service.getLearningProgressPercentage();
      expect(percentage).toBe(0);
    });
    it("当发生错误时应该返回 0", async () => {
      // 抑制预期的错误日志输出
      const consoleSpy = TestUtils.suppressConsoleError();

      vi.mocked(mockRepository.getAllCourses).mockRejectedValue(
        new Error("数据库错误")
      );

      const percentage = await service.getLearningProgressPercentage();
      expect(percentage).toBe(0);

      // 验证错误被正确记录
      expect(consoleSpy).toHaveBeenCalledWith(
        "获取学习进度失败:",
        expect.any(Error)
      );

      // 恢复 console.error
      consoleSpy.mockRestore();
    });
  });

  describe("私有方法测试 (通过公共方法间接测试)", () => {
    it("getTotalLessonsCount - 应该正确计算总课时数", async () => {
      const stats = await service.getCourseStats();
      expect(stats.totalLessons).toBe(8); // 3 + 5
    });
    it("getCompletedLessonsCount - 应该正确计算已完成课时数", async () => {
      const stats = await service.getCourseStats();
      expect(stats.completedLessons).toBe(2); // 两个课时完全完成：courseId 1 lessonId 1 和 courseId 2 lessonId 1
    });

    it("getCompletedCoursesCount - 应该正确计算已完成课程数", async () => {
      const stats = await service.getCourseStats();
      expect(stats.completedCourses).toBe(0); // 没有课程完全完成
    });

    it("getInProgressCoursesCount - 应该正确计算进行中课程数", async () => {
      const stats = await service.getCourseStats();
      expect(stats.inProgressCourses).toBe(2); // 两个课程都有进度但未完成
    });
  });

  describe("边界情况测试", () => {
    it("应该处理空的进度列表", async () => {
      vi.mocked(mockRepository.getAllLearningProgress).mockResolvedValue([]);

      const stats = await service.getCourseStats();
      expect(stats.completedCourses).toBe(0);
      expect(stats.inProgressCourses).toBe(0);
      expect(stats.completedLessons).toBe(0);
    });

    it("应该处理课程总课时数为 0 的情况", async () => {
      const coursesWithNoLessons = mockCourses.map((course) => ({
        ...course,
        totalLessons: 0,
      }));
      vi.mocked(mockRepository.getAllCourses).mockResolvedValue(
        coursesWithNoLessons
      );

      const stats = await service.getCourseStats();
      expect(stats.totalLessons).toBe(0);
      expect(stats.completedCourses).toBe(0);
    });

    it("应该处理进度中句子数为 0 的情况", async () => {
      const progressWithZeroSentences: LearningProgress[] = [
        {
          courseId: 1,
          lessonId: 1,
          completedSentences: [],
          totalSentences: 0,
          attempts: 1,
        },
      ];
      vi.mocked(mockRepository.getAllLearningProgress).mockResolvedValue(
        progressWithZeroSentences
      );

      const stats = await service.getCourseStats();
      expect(stats.completedLessons).toBe(0);
    });
  });
});
