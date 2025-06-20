import { Course, LearningProgress } from '../data/types';
import { IDataRepository } from '../data/interfaces/dataRepository';

// 课程统计服务
export class CourseStatsService {
  constructor(private repository: IDataRepository) {}

  // 获取课程统计信息
  async getCourseStats() {
    try {
      const courses = await this.repository.getAllCourses();
      const allProgress = await this.repository.getAllLearningProgress();
      
      return {
        totalCourses: courses.length,
        completedCourses: this.getCompletedCoursesCount(courses, allProgress),
        inProgressCourses: this.getInProgressCoursesCount(courses, allProgress),
        totalLessons: this.getTotalLessonsCount(courses),
        completedLessons: this.getCompletedLessonsCount(allProgress)
      };
    } catch (error) {
      console.error('获取课程统计失败:', error);
      return {
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLessons: 0,
        completedLessons: 0
      };
    }
  }

  // 获取已完成的课程数量
  private getCompletedCoursesCount(courses: Course[], progressList: LearningProgress[]): number {
    return courses.filter(course => {
      const courseProgress = progressList.filter(p => p.courseId === course.id);
      if (courseProgress.length === 0) return false;
      
      // 检查该课程的所有课时是否都已完成
      const totalLessons = course.totalLessons;
      const completedLessons = courseProgress.filter(p => 
        p.completedSentences.length === p.totalSentences && p.totalSentences > 0
      ).length;
      
      return completedLessons === totalLessons;
    }).length;
  }

  // 获取正在进行的课程数量
  private getInProgressCoursesCount(courses: Course[], progressList: LearningProgress[]): number {
    return courses.filter(course => {
      const courseProgress = progressList.filter(p => p.courseId === course.id);
      if (courseProgress.length === 0) return false;
      
      // 有进度但未完全完成的课程
      const totalLessons = course.totalLessons;
      const completedLessons = courseProgress.filter(p => 
        p.completedSentences.length === p.totalSentences && p.totalSentences > 0
      ).length;
      
      return completedLessons > 0 && completedLessons < totalLessons;
    }).length;
  }

  // 获取总课时数
  private getTotalLessonsCount(courses: Course[]): number {
    return courses.reduce((total, course) => total + course.totalLessons, 0);
  }

  // 获取已完成的课时数
  private getCompletedLessonsCount(progressList: LearningProgress[]): number {
    return progressList.filter(p => 
      p.completedSentences.length === p.totalSentences && p.totalSentences > 0
    ).length;
  }

  // 获取课程完成状态
  async getCourseCompletionStatus(courseId: number): Promise<boolean> {
    try {
      const course = await this.repository.getCourseById(courseId);
      if (!course) return false;

      const progressList = await this.repository.getAllLearningProgress();
      const courseProgress = progressList.filter(p => p.courseId === courseId);
      
      if (courseProgress.length === 0) return false;
      
      const completedLessons = courseProgress.filter(p => 
        p.completedSentences.length === p.totalSentences && p.totalSentences > 0
      ).length;
      
      return completedLessons === course.totalLessons;
    } catch (error) {
      console.error('获取课程完成状态失败:', error);
      return false;
    }
  }

  // 获取学习进度百分比
  async getLearningProgressPercentage(): Promise<number> {
    try {
      const courses = await this.repository.getAllCourses();
      const allProgress = await this.repository.getAllLearningProgress();
      
      if (courses.length === 0) return 0;
      
      const totalLessons = this.getTotalLessonsCount(courses);
      const completedLessons = this.getCompletedLessonsCount(allProgress);
      
      return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    } catch (error) {
      console.error('获取学习进度失败:', error);
      return 0;
    }
  }
}
