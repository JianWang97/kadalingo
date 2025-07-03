import { WordRecord, VocabularyStatus } from '../../data/types';
import { RepositoryFactory, getStorageConfig } from '../../data/repositories/RepositoryFactory';
import { dictionaryService } from './dictionaryService';
import { getLocalTranslation } from '../../data/commonWordsDictionary';

class VocabularyService {
  private static instance: VocabularyService;
  private static wordTranslateQueue: string[] = [];

  public static getInstance(): VocabularyService {
    if (!VocabularyService.instance) {
      VocabularyService.instance = new VocabularyService();
    }
    return VocabularyService.instance;
  }

  // 获取单词翻译（优先使用本地字典）
  private async getWordTranslation(word: string): Promise<string | null> {
    // 首先检查本地字典
    const localTranslation = getLocalTranslation(word);
    if (localTranslation) {
      return localTranslation;
    }
    
    // 如果本地字典没有，则使用API获取
    try {
      return await dictionaryService.getChineseTranslation(word);
    } catch (error) {
      console.warn(`Failed to get translation for "${word}":`, error);
      return null;
    }
  }

  public async addToNewWords(word: string): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);

      // 检查单词是否已存在
      const existingWord = await repo.getWordByValue(word);
      if (existingWord) {
        console.log(`Word "${word}" already exists in vocabulary.`);
        
        return; // 单词已存在，不重复添加
      }
      if (VocabularyService.wordTranslateQueue.includes(word)) {
        console.log(`Word "${word}" is already being translated.`);
        return;
      }
      VocabularyService.wordTranslateQueue.push(word);
      // 使用新的翻译方法（优先本地字典）
      const translation = await this.getWordTranslation(word);
      VocabularyService.wordTranslateQueue.splice(VocabularyService.wordTranslateQueue.indexOf(word), 1);
      // 创建新的单词记录
      const newWord: Omit<WordRecord, 'id'> = {
        word,
        translation: translation || undefined,
        status: VocabularyStatus.NEW,
        errorCount: 0,
        dateAdded: Date.now(),
        phonetic: '',
        audioUrl: '',
        meanings: []
      };

      await repo.addWord(newWord);

    } catch (error) {
      console.error('Failed to add word to vocabulary:', error);
      throw error;
    }
  }

  // 处理单词输入（用于跟踪错误）
  public async processWordInput(word: string, isCorrect: boolean): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);

      let existingWord = await repo.getWordByValue(word);
      
      if (existingWord) {
        if (!isCorrect) {
          existingWord.errorCount += 1;
          existingWord.status = VocabularyStatus.ERROR;
          await repo.updateWord(existingWord);
        }
        // If correct, we don't need to do anything
        return;
      }

      // Only add new words if they are incorrect
      if (!isCorrect) {
        const translation = await this.getWordTranslation(word);
        const newWord: Omit<WordRecord, 'id'> = {
          word,
          translation: translation || undefined,
          status: VocabularyStatus.ERROR,
          errorCount: 1,
          dateAdded: Date.now(),
          phonetic: '',
          audioUrl: '',
          meanings: []
        };

        try {
          await repo.addWord(newWord);
        } catch (error) {
          // If word was added by another process, just update it
          existingWord = await repo.getWordByValue(word);
          if (existingWord) {
            existingWord.errorCount += 1;
            existingWord.status = VocabularyStatus.ERROR;
            await repo.updateWord(existingWord);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Failed to process word input:', error);
      throw error;
    }
  }

  // 标记单词为已掌握
  public async markWordAsMastered(word: string): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);

      const existingWord = await repo.getWordByValue(word);
      if (existingWord) {
        existingWord.status = VocabularyStatus.MASTERED;
        await repo.updateWord(existingWord);
      }
    } catch (error) {
      console.error('Failed to mark word as mastered:', error);
      throw error;
    }
  }

  // 获取生词本中的单词
  public async getNewWords(): Promise<WordRecord[]> {
    const factory = RepositoryFactory.getInstance();
    const config = getStorageConfig();
    const repo = await factory.createRepository(config);
    return await repo.getWordsByStatus(VocabularyStatus.NEW);
  }

  // 获取错词本中的单词
  public async getErrorWords(): Promise<WordRecord[]> {
    const factory = RepositoryFactory.getInstance();
    const config = getStorageConfig();
    const repo = await factory.createRepository(config);
    return await repo.getErrorWords();
  }

  // 获取已掌握的单词
  public async getMasteredWords(): Promise<WordRecord[]> {
    const factory = RepositoryFactory.getInstance();
    const config = getStorageConfig();
    const repo = await factory.createRepository(config);
    return await repo.getMasteredWords();
  }

  // 获取单词的详细信息
  async getWordDetails(word: string): Promise<WordRecord | null> {
    const factory = RepositoryFactory.getInstance();
    const config = getStorageConfig();
    const repo = await factory.createRepository(config);
    return await repo.getWordRecord(word);
  }

  // 获取单词的错误次数
  async getWordErrorCount(word: string): Promise<number> {
    const factory = RepositoryFactory.getInstance();
    const config = getStorageConfig();
    const repo = await factory.createRepository(config);
    const record = await repo.getWordRecord(word);
    return record?.errorCount || 0;
  }
}

export const vocabularyService = VocabularyService.getInstance();