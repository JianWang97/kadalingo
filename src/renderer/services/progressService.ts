import { LearningProgress } from "../../data/types";
import { RepositoryFactory, getStorageConfig } from "../../data/repositories/RepositoryFactory";

export class ProgressService {
  private static instance: ProgressService;

  public static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  // 获取课程的学习进度
  async getCourseProgress(courseId: number): Promise<LearningProgress[]> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      const allProgress = await repo.getAllLearningProgress();
      return allProgress.filter(p => p.courseId === courseId);
    } catch (error) {
      console.error("Failed to get course progress:", error);
      return [];
    }
  }

  // 获取课时的学习进度
  async getLessonProgress(courseId: number, lessonId: number): Promise<LearningProgress | null> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      return await repo.getLearningProgress(courseId, lessonId);
    } catch (error) {
      console.error("Failed to get lesson progress:", error);
      return null;
    }
  }

  // 更新句子完成状态
  async markSentenceCompleted(
    courseId: number,
    lessonId: number,
    sentenceId: number,
    isCorrect: boolean,
    totalSentences: number
  ): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      
      // 获取现有进度
      let progress = await repo.getLearningProgress(courseId, lessonId);
      
      if (!progress) {
        // 创建新的进度记录
        progress = {
          courseId,
          lessonId,
          completedSentences: [],
          totalSentences,
          attempts: 0,
          accuracy: 0
        };
      }      // 更新完成的句子列表（无论是否正确都记录为已完成）
      if (!progress.completedSentences.includes(sentenceId)) {
        progress.completedSentences.push(sentenceId);
      }

      // 增加尝试次数
      progress.attempts += 1;      // 计算完成进度（已完成句子数 / 总句子数）
      // 注意：这里的 accuracy 字段实际上表示的是完成进度，不是准确率
      progress.accuracy = progress.completedSentences.length / totalSentences;

      // 如果课时完成，记录完成时间
      if (progress.completedSentences.length === totalSentences) {
        progress.completedAt = new Date();
      }

      // 保存进度
      await repo.saveLearningProgress(progress);
    } catch (error) {
      console.error("Failed to mark sentence completed:", error);
    }
  }

  // 计算课程完成度
  async getCourseCompletionRate(courseId: number): Promise<number> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      
      const stats = await repo.getCourseStatistics(courseId);
      if (stats.totalSentences === 0) return 0;
      
      return stats.completedSentences / stats.totalSentences;
    } catch (error) {
      console.error("Failed to get course completion rate:", error);
      return 0;
    }
  }

  // 获取课程是否已完成
  async isCourseCompleted(courseId: number): Promise<boolean> {
    const completionRate = await this.getCourseCompletionRate(courseId);
    return completionRate >= 1.0;
  }

  // 获取课时是否已完成
  async isLessonCompleted(courseId: number, lessonId: number): Promise<boolean> {
    const progress = await this.getLessonProgress(courseId, lessonId);
    if (!progress) return false;
    
    return progress.completedSentences.length === progress.totalSentences;
  }

  // 重置课程进度
  async resetCourseProgress(courseId: number): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      
      const allProgress = await repo.getAllLearningProgress();
      const courseProgress = allProgress.filter(p => p.courseId === courseId);
      
      // 删除该课程的所有进度记录
      for (const progress of courseProgress) {
        await repo.deleteLearningProgress(progress.courseId, progress.lessonId);
      }
    } catch (error) {
      console.error("Failed to reset course progress:", error);
    }
  }

  // 重置课时进度
  async resetLessonProgress(courseId: number, lessonId: number): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);
      
      await repo.deleteLearningProgress(courseId, lessonId);
    } catch (error) {
      console.error("Failed to reset lesson progress:", error);
    }
  }
}