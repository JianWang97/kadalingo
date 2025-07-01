import { WordRecord, VocabularyStatus, WordMeaning } from '../../data/types';
import { RepositoryFactory, getStorageConfig } from '../../data/repositories/RepositoryFactory';
import { dictionaryService } from './dictionaryService';

class VocabularyService {
  private static instance: VocabularyService;

  private constructor() {}

  public static getInstance(): VocabularyService {
    if (!VocabularyService.instance) {
      VocabularyService.instance = new VocabularyService();
    }
    return VocabularyService.instance;
  }

  // 添加到生词本
  public async addToNewWords(word: string): Promise<void> {
    try {
      const factory = RepositoryFactory.getInstance();
      const config = getStorageConfig();
      const repo = await factory.createRepository(config);

      // 检查单词是否已存在
      const existingWord = await repo.getWordByValue(word);
      if (existingWord) {
        return; // 单词已存在，不重复添加
      }

      // 获取单词详细信息
      const dictionaryEntries = await dictionaryService.lookupWord(word);
      let meanings: WordMeaning[] = [];
      let phonetic = '';
      let audioUrl = '';
      let translation: string | undefined = undefined;

      if (dictionaryEntries && dictionaryEntries.length > 0) {
        const entry = dictionaryEntries[0];
        meanings = entry.meanings;
        phonetic = dictionaryService.getPhonetic(entry);
        audioUrl = dictionaryService.getAudioUrl(entry) || '';
        translation = entry.chineseTranslation || undefined;
      }

      // 创建新的单词记录
      const newWord: Omit<WordRecord, 'id'> = {
        word,
        translation,
        status: VocabularyStatus.NEW,
        errorCount: 0,
        dateAdded: Date.now(),
        phonetic,
        audioUrl,
        meanings
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

      const existingWord = await repo.getWordByValue(word);
      
      if (existingWord) {
        // 更新错误计数
        if (!isCorrect) {
          existingWord.errorCount += 1;
          existingWord.status = VocabularyStatus.ERROR;
        }
        await repo.updateWord(existingWord);
      } else if (!isCorrect) {
        // 如果单词不存在且输入错误，添加到错词本
        const dictionaryEntries = await dictionaryService.lookupWord(word);
        let meanings: WordMeaning[] = [];
        let phonetic = '';
        let audioUrl = '';
        let translation: string | undefined = undefined;

        if (dictionaryEntries && dictionaryEntries.length > 0) {
          const entry = dictionaryEntries[0];
          meanings = entry.meanings;
          phonetic = dictionaryService.getPhonetic(entry);
          audioUrl = dictionaryService.getAudioUrl(entry) || '';
          translation = entry.chineseTranslation || undefined;
        }

        const newWord: Omit<WordRecord, 'id'> = {
          word,
          translation,
          status: VocabularyStatus.ERROR,
          errorCount: 1,
          dateAdded: Date.now(),
          phonetic,
          audioUrl,
          meanings
        };

        await repo.addWord(newWord);
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