import { Course, Lesson, SentencePair } from './types';

// 工具函数：根据课程ID获取课程
export const getCourseById = (courses: Course[], courseId: number): Course | undefined => {
  return courses.find(course => course.id === courseId);
};

// 工具函数：根据课程ID和节次ID获取节次
export const getLessonById = (courses: Course[], courseId: number, lessonId: number): Lesson | undefined => {
  const course = getCourseById(courses, courseId);
  return course?.lessons.find(lesson => lesson.id === lessonId);
};

// 工具函数：获取课程的总句子数
export const getTotalSentencesInCourse = (course: Course): number => {
  return course.lessons.reduce((total, lesson) => total + lesson.sentences.length, 0);
};

// 工具函数：获取节次的句子总数
export const getSentencesCountInLesson = (lesson: Lesson): number => {
  return lesson.sentences.length;
};

// 工具函数：按分类获取课程
export const getCoursesByCategory = (courses: Course[], category: string): Course[] => {
  return courses.filter(course => course.category === category);
};

// 工具函数：按难度获取课程
export const getCoursesByDifficulty = (courses: Course[], difficulty: Course['difficulty']): Course[] => {
  return courses.filter(course => course.difficulty === difficulty);
};

// 工具函数：按难度获取句子
export const getSentencesByDifficulty = (sentences: SentencePair[], difficulty: SentencePair['difficulty']): SentencePair[] => {
  return sentences.filter(sentence => sentence.difficulty === difficulty);
};

// 工具函数：搜索课程（按名称、描述、分类、标签）
export const searchCourses = (courses: Course[], keyword: string): Course[] => {
  const lowerKeyword = keyword.toLowerCase();
  return courses.filter(course =>
    course.name.toLowerCase().includes(lowerKeyword) ||
    course.description?.toLowerCase().includes(lowerKeyword) ||
    course.category.toLowerCase().includes(lowerKeyword) ||
    course.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
};

// 工具函数：搜索句子（按中文、英文内容）
export const searchSentences = (sentences: SentencePair[], keyword: string): SentencePair[] => {
  const lowerKeyword = keyword.toLowerCase();
  return sentences.filter(sentence =>
    sentence.chinese.toLowerCase().includes(lowerKeyword) ||
    sentence.english.toLowerCase().includes(lowerKeyword)
  );
};

// 工具函数：获取所有分类
export const getAllCategories = (courses: Course[]): string[] => {
  const categories = new Set(courses.map(course => course.category));
  return Array.from(categories).sort();
};

// 工具函数：获取所有标签
export const getAllTags = (courses: Course[]): string[] => {
  const tags = new Set<string>();
  courses.forEach(course => {
    course.tags?.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
};

// 工具函数：计算课程完成进度
export const calculateCourseProgress = (
  course: Course,
  completedSentenceIds: number[]
): {
  totalSentences: number;
  completedSentences: number;
  progressPercentage: number;
  lessonsProgress: Array<{
    lessonId: number;
    lessonTitle: string;
    totalSentences: number;
    completedSentences: number;
    progressPercentage: number;
  }>;
} => {
  const totalSentences = getTotalSentencesInCourse(course);
  const completedSentences = completedSentenceIds.length;
  const progressPercentage = totalSentences > 0 ? (completedSentences / totalSentences) * 100 : 0;

  const lessonsProgress = course.lessons.map(lesson => {
    const lessonSentenceIds = lesson.sentences.map(s => s.id);
    const lessonCompletedSentences = lessonSentenceIds.filter(id => 
      completedSentenceIds.includes(id)
    ).length;
    const lessonProgressPercentage = lesson.sentences.length > 0 
      ? (lessonCompletedSentences / lesson.sentences.length) * 100 
      : 0;

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      totalSentences: lesson.sentences.length,
      completedSentences: lessonCompletedSentences,
      progressPercentage: lessonProgressPercentage,
    };
  });

  return {
    totalSentences,
    completedSentences,
    progressPercentage,
    lessonsProgress,
  };
};

// 工具函数：生成练习统计
export const generatePracticeStatistics = (
  attempts: Array<{
    sentenceId: number;
    correct: boolean;
    timestamp: Date;
    timeTaken?: number; // 毫秒
  }>
): {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  difficultySentences: number[];
} => {
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(attempt => attempt.correct).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  
  // 计算平均用时
  const timeTakenAttempts = attempts.filter(attempt => attempt.timeTaken !== undefined);
  const averageTime = timeTakenAttempts.length > 0
    ? timeTakenAttempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0) / timeTakenAttempts.length
    : 0;
  
  // 找出难点句子（错误率高的句子）
  const sentenceStats = new Map<number, { correct: number; total: number }>();
  attempts.forEach(attempt => {
    const stats = sentenceStats.get(attempt.sentenceId) || { correct: 0, total: 0 };
    stats.total++;
    if (attempt.correct) {
      stats.correct++;
    }
    sentenceStats.set(attempt.sentenceId, stats);
  });
  
  const difficultySentences = Array.from(sentenceStats.entries())
    .filter(([, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.6) // 错误率超过40%且尝试过2次以上
    .map(([sentenceId]) => sentenceId);

  return {
    totalAttempts,
    correctAttempts,
    accuracy,
    averageTime,
    difficultySentences,
  };
};

// 工具函数：推荐下一个练习内容
export const recommendNextLesson = (
  courses: Course[],
  completedLessonIds: number[]
): {
  courseId: number;
  lessonId: number;
  courseName: string;
  lessonTitle: string;
  reason: string;
} | null => {
  // 找到有未完成节次的课程
  for (const course of courses) {
    for (const lesson of course.lessons) {
      if (!completedLessonIds.includes(lesson.id)) {
        return {
          courseId: course.id,
          lessonId: lesson.id,
          courseName: course.name,
          lessonTitle: lesson.title,
          reason: `继续学习 "${course.name}" 课程`,
        };
      }
    }
  }
  
  return null;
};

// 工具函数：验证数据完整性
export const validateCourseData = (course: Course): string[] => {
  const errors: string[] = [];
  
  if (!course.name || course.name.trim() === '') {
    errors.push('课程名称不能为空');
  }
  
  if (!course.category || course.category.trim() === '') {
    errors.push('课程分类不能为空');
  }
  
  if (course.lessons.length === 0) {
    errors.push('课程至少需要包含一个节次');
  }
  
  if (course.totalLessons !== course.lessons.length) {
    errors.push('课程总节数与实际节数不匹配');
  }
  
  // 验证节次数据
  course.lessons.forEach((lesson, index) => {
    if (!lesson.title || lesson.title.trim() === '') {
      errors.push(`第${index + 1}节：节次标题不能为空`);
    }
    
    if (lesson.sentences.length === 0) {
      errors.push(`第${index + 1}节：节次至少需要包含一个句子`);
    }
    
    // 验证句子数据
    lesson.sentences.forEach((sentence, sentenceIndex) => {
      if (!sentence.chinese || sentence.chinese.trim() === '') {
        errors.push(`第${index + 1}节，第${sentenceIndex + 1}个句子：中文内容不能为空`);
      }
      
      if (!sentence.english || sentence.english.trim() === '') {
        errors.push(`第${index + 1}节，第${sentenceIndex + 1}个句子：英文内容不能为空`);
      }
    });
  });
  
  return errors;
};

// 工具函数：格式化时间
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${remainingMinutes}分钟`;
};

// 工具函数：格式化难度标签
export const formatDifficultyLabel = (difficulty: Course['difficulty'] | SentencePair['difficulty']): string => {
  const labels = {
    beginner: '初级',
    easy: '简单',
    intermediate: '中级',
    medium: '中等',
    advanced: '高级',
    hard: '困难',
  };
  
  return labels[difficulty] || difficulty;
};
