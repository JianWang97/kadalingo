// 速率限制配置 - 适应 Worker 实例重启的弹性设计
const RATE_LIMIT = {
  // 更保守的限制，考虑到实例重启会重置计数器
  PER_INSTANCE: {
    MAX_REQUESTS: 50,     // 每个实例最大请求数（降低单实例限制）
    WINDOW_SIZE: 3600,    // 时间窗口大小（秒）
  },
  // 短期突发限制
  BURST: {
    MAX_REQUESTS: 10,     // 短时间内最大请求数
    WINDOW_SIZE: 300,     // 5分钟窗口
  },
  BLOCK_DURATION: 1800,   // 超出限制后的封禁时间（30分钟，减少封禁时间）
};

// 内容限制配置
const CONTENT_LIMIT = {
  MAX_WORDS: 3,           // 最大单词数限制
  MAX_CHARS: 100,         // 最大字符数限制（防止超长单词）
};

// 缓存配置
const CACHE_CONFIG = {
  TTL: 31536000,  // 缓存有效期为一年（秒）
};

// 内存中的速率限制计数器（Worker 实例级别）
const rateLimitCache = new Map();

// 用于生成随机字符串作为 salt
function generateSalt() {
  return Math.random().toString(36).substring(2);
}

// 验证翻译内容是否符合要求
function validateTranslationContent(text) {
  // 检查字符长度
  if (text.length > CONTENT_LIMIT.MAX_CHARS) {
    throw new Error(`Text too long. Maximum ${CONTENT_LIMIT.MAX_CHARS} characters allowed.`);
  }

  // 清理文本：去除多余空格和标点符号
  const cleanText = text.trim()
    .replace(/[^\w\s\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, ' ') // 保留字母、数字、中文、日文
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim();

  if (!cleanText) {
    throw new Error('Text cannot be empty.');
  }

  // 计算单词数（支持中英文混合）
  let wordCount = 0;
  
  // 分割为英文单词和中文字符
  const segments = cleanText.split(/\s+/);
  
  for (const segment of segments) {
    if (!segment) continue;
    
    // 如果包含中文字符，每个中文字符算作一个单词
    const chineseChars = segment.match(/[\u4e00-\u9fff]/g);
    if (chineseChars) {
      wordCount += chineseChars.length;
    }
    
    // 如果包含英文字符，整个段落算作一个单词
    const englishPart = segment.replace(/[\u4e00-\u9fff]/g, '').trim();
    if (englishPart) {
      wordCount += 1;
    }
  }

  if (wordCount > CONTENT_LIMIT.MAX_WORDS) {
    throw new Error(`Too many words. Maximum ${CONTENT_LIMIT.MAX_WORDS} words allowed, found ${wordCount} words.`);
  }

  return cleanText;
}

// 生成签名
async function generateSign(text, salt, appid, key) {
  const str = appid + text + salt + key;
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 检查速率限制 - 适应 Worker 实例特性的弹性设计
async function checkRateLimit(env, ip) {
  const now = Math.floor(Date.now() / 1000);
  const instanceWindowKey = `${ip}:instance:${Math.floor(now / RATE_LIMIT.PER_INSTANCE.WINDOW_SIZE)}`;
  const burstWindowKey = `${ip}:burst:${Math.floor(now / RATE_LIMIT.BURST.WINDOW_SIZE)}`;
  
  // 检查是否被封禁
  const blockKey = `${ip}:blocked`;
  const blockData = rateLimitCache.get(blockKey);
  if (blockData && blockData.expiry > now) {
    throw new Error('Translation limit exceeded. Please try again in 30 minutes.');
  }

  // 获取当前实例窗口的请求数
  const instanceData = rateLimitCache.get(instanceWindowKey) || { count: 0, expiry: now + RATE_LIMIT.PER_INSTANCE.WINDOW_SIZE };
  let instanceCount = instanceData.count + 1;

  // 获取突发窗口的请求数
  const burstData = rateLimitCache.get(burstWindowKey) || { count: 0, expiry: now + RATE_LIMIT.BURST.WINDOW_SIZE };
  let burstCount = burstData.count + 1;

  // 检查突发限制（防止短时间内大量请求）
  if (burstCount > RATE_LIMIT.BURST.MAX_REQUESTS) {
    rateLimitCache.set(blockKey, { expiry: now + RATE_LIMIT.BLOCK_DURATION });
    throw new Error('Too many requests in short time. Please try again in 30 minutes.');
  }

  // 检查实例限制
  if (instanceCount > RATE_LIMIT.PER_INSTANCE.MAX_REQUESTS) {
    rateLimitCache.set(blockKey, { expiry: now + RATE_LIMIT.BLOCK_DURATION });
    throw new Error('Translation limit exceeded. Please try again in 30 minutes.');
  }

  // 更新请求计数
  rateLimitCache.set(instanceWindowKey, { count: instanceCount, expiry: now + RATE_LIMIT.PER_INSTANCE.WINDOW_SIZE });
  rateLimitCache.set(burstWindowKey, { count: burstCount, expiry: now + RATE_LIMIT.BURST.WINDOW_SIZE });
  
  // 定期清理过期数据
  cleanupExpiredEntries();
  
  return true;
}

// 清理过期的内存缓存条目
function cleanupExpiredEntries() {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, data] of rateLimitCache) {
    if (data.expiry && data.expiry < now) {
      rateLimitCache.delete(key);
    }
  }
}

// 生成缓存键
function generateCacheKey(text, from, to) {
  return `${from}:${to}:${text}`;
}

// 从缓存获取翻译结果
async function getFromCache(env, text, from, to) {
  const cacheKey = generateCacheKey(text, from, to);
  return await env.TRANSLATE_CACHE.get(cacheKey);
}

// 将翻译结果存入缓存
async function setToCache(env, text, from, to, translation) {
  const cacheKey = generateCacheKey(text, from, to);
  await env.TRANSLATE_CACHE.put(cacheKey, translation, { expirationTtl: CACHE_CONFIG.TTL });
}

export default {
  async fetch(request, env) {
    // 处理 CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 获取客户端 IP
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      // 检查速率限制
      await checkRateLimit(env, clientIP);

      // 获取请求体
      const { text, from = 'en', to = 'zh' } = await request.json();

      if (!text) {
        return new Response(
          JSON.stringify({ error: 'Text is required' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      // 验证翻译内容
      let validatedText;
      try {
        validatedText = validateTranslationContent(text);
      } catch (validationError) {
        return new Response(
          JSON.stringify({ error: validationError.message }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }

      // 检查缓存
      const cachedResult = await getFromCache(env, validatedText, from, to);
      if (cachedResult) {
        return new Response(
          JSON.stringify({ translation: cachedResult, cached: true }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=31536000',
            }
          }
        );
      }

      // 使用环境变量中的凭证
      const appid = env.BAIDU_TRANSLATE_APPID;
      const key = env.BAIDU_TRANSLATE_KEY;

      // 生成 salt 和签名
      const salt = generateSalt();
      const sign = await generateSign(validatedText, salt, appid, key);

      // 构建百度翻译 API 请求
      const url = new URL('https://fanyi-api.baidu.com/api/trans/vip/translate');
      url.searchParams.append('q', validatedText);
      url.searchParams.append('from', from);
      url.searchParams.append('to', to);
      url.searchParams.append('appid', appid);
      url.searchParams.append('salt', salt);
      url.searchParams.append('sign', sign);

      // 调用百度翻译 API
      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.error_code) {
        throw new Error(data.error_msg);
      }

      const translation = data.trans_result?.[0]?.dst || null;

      // 存入缓存
      if (translation) {
        await setToCache(env, validatedText, from, to, translation);
      }

      // 返回翻译结果
      return new Response(
        JSON.stringify({
          translation,
          cached: false
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=31536000',
          }
        }
      );

    } catch (error) {
      console.error('Translation error:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Translation failed',
          code: error.code || 500
        }),
        { 
          status: error.message.includes('Rate limit') ? 429 : 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  }
}; 