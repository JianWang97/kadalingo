
import { Course } from './types';

// 示例课程数据
export const sampleCourses: Course[] = [
  {
    id: 1,
    name: "英语日常对话入门",
    description: "学习基础的英语日常对话，适合初学者",
    difficulty: "beginner",
    category: "日常对话",
    totalLessons: 3,
    estimatedHours: 2,
    tags: ["基础", "日常", "问候"],
    lessons: [
      {
        id: 1,
        title: "第1节：基础问候与介绍",
        description: "学习基本的问候语和自我介绍",
        estimatedTime: 20,
        sentences: [
          {
            id: 1,
            chinese: "今天天气很好",
            english: "The weather is nice today",
            difficulty: "easy",
          },
          {
            id: 2,
            chinese: "我喜欢学习英语",
            english: "I like learning English",
            difficulty: "easy",
          },
          {
            id: 3,
            chinese: "你好，很高兴见到你",
            english: "Hello, nice to meet you",
            difficulty: "easy",
          },
          {
            id: 4,
            chinese: "请问现在几点了",
            english: "What time is it now",
            difficulty: "easy",
          },
          {
            id: 17,
            chinese: "音乐能够表达情感",
            english: "Music can express emotions",
            difficulty: "easy",
          },
        ],
      },
      {
        id: 2,
        title: "第2节：日常需求表达",
        description: "学习表达日常需求和购物用语",
        estimatedTime: 25,
        sentences: [
          {
            id: 5,
            chinese: "我想要一杯咖啡",
            english: "I would like a cup of coffee",
            difficulty: "easy",
          },
          {
            id: 6,
            chinese: "这本书非常有趣",
            english: "This book is very interesting",
            difficulty: "medium",
          },
          {
            id: 7,
            chinese: "我们需要努力工作",
            english: "We need to work hard",
            difficulty: "medium",
          },
          {
            id: 10,
            chinese: "我计划明天去购物",
            english: "I plan to go shopping tomorrow",
            difficulty: "medium",
          },
          {
            id: 16,
            chinese: "我的朋友来自不同国家",
            english: "My friends come from different countries",
            difficulty: "medium",
          },
        ],
      },
      {
        id: 3,
        title: "第3节：兴趣爱好与健康",
        description: "学习谈论兴趣爱好和健康相关话题",
        estimatedTime: 30,
        sentences: [
          {
            id: 8,
            chinese: "春天的花朵很美丽",
            english: "The flowers in spring are beautiful",
            difficulty: "medium",
          },
          {
            id: 9,
            chinese: "他正在学习如何编程",
            english: "He is learning how to program",
            difficulty: "medium",
          },
          {
            id: 18,
            chinese: "运动有益于身体健康",
            english: "Exercise is good for physical health",
            difficulty: "medium",
          },
          {
            id: 19,
            chinese: "阅读可以扩展知识面",
            english: "Reading can expand knowledge",
            difficulty: "medium",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "商务英语进阶",
    description: "面向有一定基础的学习者，学习商务场景下的英语表达",
    difficulty: "intermediate",
    category: "商务英语",
    totalLessons: 2,
    estimatedHours: 3,
    tags: ["商务", "职场", "进阶"],
    lessons: [
      {
        id: 4,
        title: "第1节：职场沟通",
        description: "学习职场环境下的有效沟通",
        estimatedTime: 45,
        sentences: [
          {
            id: 11,
            chinese: "科技正在改变我们的生活",
            english: "Technology is changing our lives",
            difficulty: "hard",
          },
          {
            id: 12,
            chinese: "教育对个人发展很重要",
            english: "Education is important for personal development",
            difficulty: "hard",
          },
          {
            id: 20,
            chinese: "团队合作比个人努力更有效",
            english: "Teamwork is more effective than individual effort",
            difficulty: "hard",
          },
        ],
      },
      {
        id: 5,
        title: "第2节：国际合作与交流",
        description: "学习国际商务合作中的沟通技巧",
        estimatedTime: 50,
        sentences: [
          {
            id: 13,
            chinese: "环境保护是全球性问题",
            english: "Environmental protection is a global issue",
            difficulty: "hard",
          },
          {
            id: 14,
            chinese: "创新思维能够解决复杂问题",
            english: "Innovative thinking can solve complex problems",
            difficulty: "hard",
          },
          {
            id: 15,
            chinese: "文化交流促进相互理解",
            english: "Cultural exchange promotes mutual understanding",
            difficulty: "hard",
          },
        ],
      },
    ],
  },
];
