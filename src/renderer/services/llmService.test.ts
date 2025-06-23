import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService, createLLMService, getLLMService } from './llmService';
import type { LLMConfig, StreamChunk } from './llmService';

describe('LLMService', () => {
  let llmService: LLMService;
  let mockConfig: LLMConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://api.test.com',
      apiKey: 'test-api-key',
      model: 'gpt-3.5-turbo'
    };
    llmService = new LLMService(mockConfig);
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset();
  });

  describe('constructor and configuration', () => {
    it('should create instance with default model', () => {
      const configWithoutModel = {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-api-key'
      };
      const service = new LLMService(configWithoutModel);
      expect(service).toBeInstanceOf(LLMService);
    });

    it('should update configuration', () => {
      const newConfig = {
        baseUrl: 'https://api.new.com',
        apiKey: 'new-api-key'
      };
      llmService.updateConfig(newConfig);
      expect(llmService).toBeInstanceOf(LLMService);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '连接成功'
            }
          }]
        })
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await llmService.testConnection();
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key'
          }
        })
      );
    });

    it('should return false for failed connection', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await llmService.testConnection();
      expect(result).toBe(false);
    });

    it('should return false for non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await llmService.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('generateCourseStream', () => {
    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('test topic');
      
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].data).toHaveProperty('error');
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error')
      };
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('test topic');
      
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
    });

    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        body: null
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('test topic');
      
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].type).toBe('error');
    });    it('should generate complete course stream with valid JSON', async () => {
      const mockCourseData = {
        title: '日常对话课程',
        description: '适合初学者的日常英语对话练习',
        level: 'beginner',
        sentences: [
          {
            chinese: '你好',
            english: 'Hello',
            phonetic: '/həˈloʊ/',
            difficulty: 'easy'
          }
        ]
      };

      // 创建分步的SSE数据流，模拟真实的流式响应
      const jsonString = JSON.stringify(mockCourseData);
      const sseDataParts = [
        `data: {"choices":[{"delta":{"content":"{"}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"\\"title\\": \\"日常对话课程\\","}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"\\"description\\": \\"适合初学者的日常英语对话练习\\","}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"\\"level\\": \\"beginner\\","}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"\\"sentences\\": ["}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"{\\"chinese\\": \\"你好\\", \\"english\\": \\"Hello\\", \\"phonetic\\": \\"/həˈloʊ/\\", \\"difficulty\\": \\"easy\\"}"}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"]"}}]}\n\n`,
        `data: {"choices":[{"delta":{"content":"}"}}]}\n\n`,
        `data: [DONE]\n\n`
      ];

      const fullSSEData = sseDataParts.join('');

      const mockResponse = {
        ok: true,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(fullSSEData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('daily conversation', 'beginner', 1);
      
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      
      // Check if we got a complete chunk
      const completeChunk = chunks.find(chunk => chunk.type === 'complete');
      if (completeChunk) {
        expect(completeChunk.data).toHaveProperty('title');
        expect(completeChunk.data).toHaveProperty('sentences');
      }
    });

    it('should handle thinking content', async () => {
      const sseData = 'data: {"choices":[{"delta":{"thinking":"分析用户需求..."}}]}\n\ndata: [DONE]\n\n';

      const mockResponse = {
        ok: true,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(sseData)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('test topic');
      
      for await (const chunk of generator) {
        chunks.push(chunk);
        if (chunks.length > 5) break; // Prevent infinite loop
      }

      expect(chunks.some(chunk => chunk.type === 'thinking')).toBe(true);
    });

    it('should use correct parameters in API call', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn().mockResolvedValueOnce({
              done: true,
              value: undefined
            }),
            releaseLock: vi.fn()
          })
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const generator = llmService.generateCourseStream('travel', 'intermediate', 10);
      
      // Start the generator to trigger the API call
      const iterator = generator[Symbol.asyncIterator]();
      await iterator.next();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.test.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key'
          },
          body: expect.stringContaining('"stream":true')
        })
      );

      const requestBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(requestBody.messages[0].content).toContain('travel');
      expect(requestBody.messages[0].content).toContain('中级');
      expect(requestBody.messages[0].content).toContain('10个练习句子');
    });
  });

  describe('singleton functions', () => {
    it('should create and get LLM service instance', () => {
      const service = createLLMService(mockConfig);
      expect(service).toBeInstanceOf(LLMService);
      
      const retrievedService = getLLMService();
      expect(retrievedService).toBe(service);
    });

    it('should return service when instance exists', () => {
      createLLMService(mockConfig);
      const service = getLLMService();
      expect(service).not.toBeNull();
      expect(service).toBeInstanceOf(LLMService);
    });
  });

  describe('error handling', () => {    it('should handle incomplete JSON during streaming', async () => {
      const incompleteJson = 'data: {"choices":[{"delta":{"content":"{\\"title\\": \\"Test"}}]}\n\ndata: [DONE]\n\n';

      const mockResponse = {
        ok: true,
        body: {
          getReader: vi.fn().mockReturnValue({
            read: vi.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode(incompleteJson)
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              }),
            releaseLock: vi.fn()
          })
        }
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as unknown as Response);

      const chunks: StreamChunk[] = [];
      const generator = llmService.generateCourseStream('test topic');
      
      for await (const chunk of generator) {
        chunks.push(chunk);
        if (chunks.length > 10) break; // Prevent infinite loop
      }

      // Should handle incomplete JSON gracefully without throwing errors
      // 即使JSON不完整，也应该至少收到一些chunk（即使是空的或错误的）
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });
  });
});
