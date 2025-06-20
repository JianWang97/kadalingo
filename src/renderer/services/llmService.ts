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

// 新增流式生成相关接口
export interface StreamChunk {
  type:
    | "title"
    | "description"
    | "sentence"
    | "complete"
    | "error"
    | "thinking";
  data?: string | GeneratedSentence | GeneratedCourse | { error: string };
  progress?: number;
}

export interface PartialCourse {
  title?: string;
  description?: string;
  level?: "beginner" | "intermediate" | "advanced";
  sentences: GeneratedSentence[];
  isComplete: boolean;
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
  // 流式生成课程方法
  async *generateCourseStream(
    topic: string,
    level: "beginner" | "intermediate" | "advanced" = "beginner",
    sentenceCount = 20
  ): AsyncGenerator<StreamChunk, void, unknown> {
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

    try {
      const response = await this.makeStreamRequest([
        { role: "user", content: prompt },
      ]);
      let fullResponse = "";
      let jsonStarted = false;
      let braceCount = 0;
      let lastSentenceCount = 0;
      let thinkingContent = "";
      for await (const chunk of response) {
        // 处理 thinking 内容
        let thinkingDelta = null;

        // 直接从 chunk.thinking 获取
        if ("thinking" in chunk && chunk.thinking) {
          thinkingDelta = chunk.thinking;
        }
        // 或者从 delta.thinking 获取（如果存在）
        else if (
          chunk.choices?.[0]?.delta &&
          "thinking" in chunk.choices[0].delta
        ) {
          thinkingDelta = (chunk.choices[0].delta as Record<string, unknown>)
            .thinking as string;
        }
        // 处理 reasoning_content 字段
        else if (
          chunk.choices?.[0]?.delta &&
          "reasoning_content" in chunk.choices[0].delta
        ) {
          thinkingDelta = (chunk.choices[0].delta as Record<string, unknown>)
            .reasoning_content as string;
        }
        // 处理完整的 thinking 对象中的 reasoning_content
        else if (
          chunk.choices?.[0]?.message &&
          "thinking" in chunk.choices[0].message
        ) {
          const thinkingObj = chunk.choices[0].message.thinking as Record<
            string,
            unknown
          >;
          if (thinkingObj && "reasoning_content" in thinkingObj) {
            thinkingDelta = thinkingObj.reasoning_content as string;
          }
        }        if (thinkingDelta) {
          thinkingContent += thinkingDelta;
          yield {
            type: "thinking",
            data: thinkingContent,
            progress: 5,
          };
        }

        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          fullResponse += content;

          // 检测 JSON 开始
          if (!jsonStarted && content.includes("{")) {
            jsonStarted = true;
          }

          if (jsonStarted) {
            // 计算大括号数量来判断 JSON 是否完整
            for (const char of content) {
              if (char === "{") braceCount++;
              if (char === "}") braceCount--;
            }

            // 尝试解析部分 JSON
            try {
              const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch && braceCount === 0) {
                const courseData: RawCourse = JSON.parse(jsonMatch[0]);

                // 发送完整的课程数据
                const completeChunk: StreamChunk = {
                  type: "complete",
                  data: {
                    title: courseData.title,
                    description: courseData.description,
                    level: courseData.level,
                    sentences: courseData.sentences.map((s) => ({
                      chinese: s.chinese,
                      english: s.english,
                      difficulty: s.difficulty || "easy",
                    })),
                  },
                  progress: 100,
                };

                yield completeChunk;
                return;
              } else if (jsonMatch) {
                // 尝试解析部分内容
                const partial = this.parsePartialJson(jsonMatch[0]);
                if (partial) {
                  if (partial.title) {
                    yield {
                      type: "title",
                      data: partial.title,
                      progress: 10,
                    };
                  }

                  if (partial.description) {
                    yield {
                      type: "description",
                      data: partial.description,
                      progress: 20,
                    };
                  }

                  if (
                    partial.sentences &&
                    partial.sentences.length > lastSentenceCount
                  ) {
                    const newSentences =
                      partial.sentences.slice(lastSentenceCount);
                    for (const sentence of newSentences) {
                      const progress = Math.min(
                        90,
                        30 + (partial.sentences.length / sentenceCount) * 60
                      );
                      yield {
                        type: "sentence",
                        data: {
                          chinese: sentence.chinese,
                          english: sentence.english,
                          difficulty: sentence.difficulty || "easy",
                        },
                        progress,
                      };
                    }
                    lastSentenceCount = partial.sentences.length;
                  }
                }
              }
            } catch (parseError) {
              // JSON 还不完整，继续等待
              continue;
            }
          }
        }
      }
    } catch (error) {
      const errorChunk: StreamChunk = {
        type: "error",
        data: { error: (error as Error).message },
        progress: 0,
      };

      yield errorChunk;
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
  }  private async makeStreamRequest(
    messages: Array<{ role: string; content: string }>
  ): Promise<
    AsyncIterable<{
      choices?: Array<{
        delta?: {
          content?: string;
          thinking?: string;
          reasoning_content?: string;
        };
        message?: {
          thinking?: string | Record<string, unknown>;
        };
      }>;
      thinking?: string;
    }>
  > {
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
        stream: true,
        thinking: { type: "enabled" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API请求失败: ${response.status} ${errorText}`);
    }

    return this.parseSSEStream(response);
  }  private async *parseSSEStream(response: Response): AsyncGenerator<
    {
      choices?: Array<{
        delta?: {
          content?: string;
          thinking?: string;
          reasoning_content?: string;
        };
        message?: {
          thinking?: string | Record<string, unknown>;
        };
      }>;
      thinking?: string;
    },
    void,
    unknown
  > {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应内容");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "" || trimmedLine === "data: [DONE]") {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);
              yield data;
            } catch (error) {
              console.warn("Failed to parse SSE data:", trimmedLine);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parsePartialJson(jsonStr: string): Partial<RawCourse> | null {
    try {
      // 尝试解析完整的 JSON
      return JSON.parse(jsonStr);
    } catch (error) {
      // 如果解析失败，尝试解析部分内容
      try {
        const result: Partial<RawCourse> = {};

        // 提取 title
        const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]*)"?/);
        if (titleMatch) {
          result.title = titleMatch[1];
        }

        // 提取 description
        const descMatch = jsonStr.match(/"description"\s*:\s*"([^"]*)"?/);
        if (descMatch) {
          result.description = descMatch[1];
        }

        // 提取 level
        const levelMatch = jsonStr.match(/"level"\s*:\s*"([^"]*)"?/);
        if (
          levelMatch &&
          ["beginner", "intermediate", "advanced"].includes(levelMatch[1])
        ) {
          result.level = levelMatch[1] as
            | "beginner"
            | "intermediate"
            | "advanced";
        }

        // 提取 sentences 数组
        const sentencesMatch = jsonStr.match(
          /"sentences"\s*:\s*\[([\s\S]*?)(\]|$)/
        );
        if (sentencesMatch) {
          const sentencesStr = sentencesMatch[1];
          const sentences: RawSentence[] = [];

          // 匹配完整的句子对象
          const sentenceRegex =
            /\{\s*"chinese"\s*:\s*"([^"]*)"[^}]*"english"\s*:\s*"([^"]*)"[^}]*"difficulty"\s*:\s*"([^"]*)"[^}]*\}/g;
          let match;

          // eslint-disable-next-line no-cond-assign
          while ((match = sentenceRegex.exec(sentencesStr)) !== null) {
            sentences.push({
              chinese: match[1],
              english: match[2],
              difficulty: match[3] as "easy" | "medium" | "hard",
            });
          }

          result.sentences = sentences;
        }

        return Object.keys(result).length > 0 ? result : null;
      } catch (parseError) {
        return null;
      }
    }
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
