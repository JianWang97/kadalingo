// Simplified dictionary service: only query Chinese translation

class DictionaryService {
  private static instance: DictionaryService;
  private cache: Map<string, string | null> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  public async getChineseTranslation(word: string): Promise<string | null> {
    const key = word.trim();
    try {
      const response = await fetch('https://kadalingo.top/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: key,
          from: 'en',
          to: 'zh'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Translation API error:', data.error || response.statusText);
        return null;
      }

      const data = await response.json();
      const translation = data.translation ?? null;
      this.cache.set(key, translation);
      return translation;
    } catch (error) {
      console.error('Failed to translate text:', error);
      this.cache.set(key, null);
      return null;
    }
  }
}

export const dictionaryService = DictionaryService.getInstance();