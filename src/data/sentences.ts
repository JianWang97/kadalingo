// 中英文句子练习数据
export interface SentencePair {
  id: number;
  chinese: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
}

export const sentencePairs: SentencePair[] = [
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
    id: 10,
    chinese: "我计划明天去购物",
    english: "I plan to go shopping tomorrow",
    difficulty: "medium",
  },
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
  {
    id: 16,
    chinese: "我的朋友来自不同国家",
    english: "My friends come from different countries",
    difficulty: "medium",
  },
  {
    id: 17,
    chinese: "音乐能够表达情感",
    english: "Music can express emotions",
    difficulty: "easy",
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
  {
    id: 20,
    chinese: "团队合作比个人努力更有效",
    english: "Teamwork is more effective than individual effort",
    difficulty: "hard",
  },
];
