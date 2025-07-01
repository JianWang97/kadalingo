interface Phonetic {
  text: string;
  audio?: string;
}

interface Definition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface DictionaryEntry {
  word: string;
  chineseTranslation: string | null;
  phonetics: Phonetic[];
  meanings: Meaning[];
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

class DictionaryService {
  private static instance: DictionaryService;
  private cache: Map<string, DictionaryEntry[]>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  private async translateToZh(text: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.responseData?.translatedText || null;
    } catch (error) {
      console.error('Failed to translate text:', error);
      return null;
    }
  }

  public async lookupWord(word: string): Promise<DictionaryEntry[] | null> {
    try {
      // 检查缓存
      if (this.cache.has(word)) {
        return this.cache.get(word) || null;
      }

      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // 单词未找到
        }
        throw new Error(`Dictionary API error: ${response.statusText}`);
      }

      const data: DictionaryEntry[] = await response.json();
      
      // 只翻译单词本身
      const translation = await this.translateToZh(word);
      for (const entry of data) {
        entry.chineseTranslation = translation;
      }

      // 存入缓存
      this.cache.set(word, data);
      
      return data;
    } catch (error) {
      console.error('Failed to lookup word:', error);
      return null;
    }
  }

  // 获取音标（优先获取英式音标）
  public getPhonetic(entry: DictionaryEntry): string {
    if (!entry.phonetics || entry.phonetics.length === 0) {
      return '';
    }

    // 尝试找到带有音频的音标（通常这些是更完整的）
    const phoneticWithAudio = entry.phonetics.find(p => p.audio && p.text);
    if (phoneticWithAudio) {
      return phoneticWithAudio.text;
    }

    // 如果没有带音频的音标，返回第一个有文本的音标
    const firstWithText = entry.phonetics.find(p => p.text);
    return firstWithText ? firstWithText.text : '';
  }

  // 获取音频 URL（优先获取英式发音）
  public getAudioUrl(entry: DictionaryEntry): string | null {
    if (!entry.phonetics || entry.phonetics.length === 0) {
      return null;
    }

    // 查找英式发音（通常 URL 中包含 'uk' 或 'british'）
    const britishAudio = entry.phonetics.find(p => 
      p.audio && (p.audio.includes('uk') || p.audio.includes('british'))
    );

    if (britishAudio && britishAudio.audio) {
      return britishAudio.audio;
    }

    // 如果没有英式发音，返回第一个可用的音频
    const firstAudio = entry.phonetics.find(p => p.audio);
    return firstAudio?.audio || null;
  }
}

export const dictionaryService = DictionaryService.getInstance(); 