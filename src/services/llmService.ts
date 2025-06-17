export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model?: string;
}

export interface GeneratedSentence {
  chinese: string;
  english: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface GeneratedCourse {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  sentences: GeneratedSentence[];
}

interface RawSentence {
  chinese: string;
  english: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface RawCourse {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  sentences: RawSentence[];
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      model: config.model || "gpt-3.5-turbo",
    };
  }

  updateConfig(config: Partial<LLMConfig>) {
    this.config = { ...this.config, ...config };
  }
  async generateSentences(
    topic: string,
    count = 10,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<GeneratedSentence[]> {
    const prompt = `生成${count}个关于"${topic}"主题的中英文对照句子。
要求：
1. 句子难度为${
      difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难"
    }
2. 中文句子要自然流畅，适合中国人学习英语使用
3. 英文翻译要准确地道
4. 请返回JSON格式数组，每个对象包含chinese、english和difficulty字段
5. 中文中不要带有拼音或注音或英文，也不要有引号，直接是中文句子
6. 每个句子都要完整且有意义且语句尽量保持10个以内，除非是成语或固定搭配

示例格式：
[
  {"chinese": "今天天气很好。", "english": "The weather is nice today.", "difficulty": "easy"},
  {"chinese": "我喜欢在周末读书。", "english": "I like reading books on weekends.", "difficulty": "easy"}
]`;

    const response = await this.makeRequest([
      { role: "user", content: prompt },
    ]);
    try {
      const sentences: RawSentence[] = JSON.parse(response);
      return sentences.map((sentence: RawSentence) => ({
        chinese: sentence.chinese,
        english: sentence.english,
        difficulty: sentence.difficulty || difficulty,
      }));
    } catch (error) {
      throw new Error("解析生成的句子失败");
    }
  }
  async generateCourse(
    topic: string,
    level: "beginner" | "intermediate" | "advanced" = "beginner",
    sentenceCount = 20
  ): Promise<GeneratedCourse> {
    const prompt = `为"${topic}"主题创建一个完整的英语学习课程。
要求：
1. 课程等级：${
      level === "beginner" ? "初级" : level === "intermediate" ? "中级" : "高级"
    }
2. 包含${sentenceCount}个练习句子
3. 课程要有清晰的标题和描述
4. 句子要循序渐进，符合课程等级

请返回JSON格式：
{
  "title": "课程标题",
  "description": "课程描述",
  "level": "${level}",
  "sentences": [
    {"chinese": "中文句子", "english": "English sentence", "difficulty": "easy"}
  ]
}`;

    const response = await this.makeRequest([
      { role: "user", content: prompt },
    ]);
    try {
      const course: RawCourse = JSON.parse(response);
      return {
        title: course.title,
        description: course.description,
        level: course.level,
        sentences: course.sentences.map((sentence: RawSentence) => ({
          chinese: sentence.chinese,
          english: sentence.english,
          difficulty: sentence.difficulty || "easy",
        })),
      };
    } catch (error) {
      throw new Error("解析生成的课程失败");
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest([{ role: "user", content: '请回复"连接成功"' }]);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async makeRequest(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
        thinking: {"type":"disabled"},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API请求失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("LLM API返回格式错误");
    }

    return data.choices[0].message.content;
  }
}

// 单例实例
let llmServiceInstance: LLMService | null = null;

export const createLLMService = (config: LLMConfig): LLMService => {
  llmServiceInstance = new LLMService(config);
  return llmServiceInstance;
};

export const getLLMService = (): LLMService | null => {
  return llmServiceInstance;
};
