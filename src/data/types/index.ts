// 基础数据类型定义

// 中英文句子对
export interface SentencePair {
  id: number;
  chinese: string;
  english: string;
  phonetic?: string; // 新增：英文音标
  difficulty: "easy" | "medium" | "hard";
}

// 课程节次接口
export interface Lesson {
  id: number;
  title: string; // 节次标题，如 "第1节：基础问候"
  description?: string; // 节次描述
  sentences: SentencePair[]; // 该节次包含的句子练习
  estimatedTime?: number; // 预计完成时间（分钟）
}

// 课程接口
export interface Course {
  id: number;
  name: string; // 课程名称，如 "英语日常对话入门"
  description?: string; // 课程描述
  difficulty: "beginner" | "intermediate" | "advanced"; // 课程整体难度
  category: string; // 课程分类，如 "日常对话"、"商务英语"、"旅游英语"
  lessons: Lesson[]; // 课程包含的所有节次
  totalLessons: number; // 总节数
  estimatedHours?: number; // 预计总学习时长（小时）
  tags?: string[]; // 课程标签
  createdAt?: Date; // 创建时间
  updatedAt?: Date; // 更新时间
}

// 学习进度接口
export interface LearningProgress {
  courseId: number;
  lessonId: number;
  completedSentences: number[]; // 已完成的句子ID列表
  totalSentences: number; // 该节次总句子数
  accuracy?: number; // 准确率（0-1）
  completedAt?: Date; // 完成时间
  attempts: number; // 尝试次数
}

// 查询参数接口
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// API 响应接口
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
