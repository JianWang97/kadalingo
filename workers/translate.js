// 速率限制配置
const RATE_LIMIT = {
  HOURLY: {
    MAX_REQUESTS: 300,    // 每小时最大请求数
    WINDOW_SIZE: 3600,    // 时间窗口大小（秒）
  },
  DAILY: {
    MAX_REQUESTS: 500,    // 每天最大请求数
    WINDOW_SIZE: 86400,   // 时间窗口大小（秒）
  },
  BLOCK_DURATION: 3600,   // 超出限制后的封禁时间（秒）
};

// 缓存配置
const CACHE_CONFIG = {
  TTL: 31536000,  // 缓存有效期为一年（秒）
};

// 用于生成随机字符串作为 salt
function generateSalt() {
  return Math.random().toString(36).substring(2);
}

// 生成签名
async function generateSign(text, salt, appid, key) {
  const str = appid + text + salt + key;
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 检查速率限制
async function checkRateLimit(env, ip) {
  const now = Math.floor(Date.now() / 1000);
  const hourlyWindowKey = `${ip}:hourly:${Math.floor(now / RATE_LIMIT.HOURLY.WINDOW_SIZE)}`;
  const dailyWindowKey = `${ip}:daily:${Math.floor(now / RATE_LIMIT.DAILY.WINDOW_SIZE)}`;
  
  // 检查是否被封禁
  const blockKey = `${ip}:blocked`;
  const isBlocked = await env.RATE_LIMITS.get(blockKey);
  if (isBlocked) {
    throw new Error('Translation limit exceeded. Please try again in 1 hour.');
  }

  // 获取当前小时的请求数
  let hourlyCount = parseInt(await env.RATE_LIMITS.get(hourlyWindowKey) || '0');
  hourlyCount++;

  // 获取当前天的请求数
  let dailyCount = parseInt(await env.RATE_LIMITS.get(dailyWindowKey) || '0');
  dailyCount++;

  // 如果超出小时限制，设置封禁
  if (hourlyCount > RATE_LIMIT.HOURLY.MAX_REQUESTS) {
    await env.RATE_LIMITS.put(blockKey, 'true', { expirationTtl: RATE_LIMIT.BLOCK_DURATION });
    throw new Error('Hourly translation limit (300 words) exceeded. Please try again in 1 hour.');
  }

  // 如果超出每日限制，设置封禁
  if (dailyCount > RATE_LIMIT.DAILY.MAX_REQUESTS) {
    await env.RATE_LIMITS.put(blockKey, 'true', { expirationTtl: RATE_LIMIT.BLOCK_DURATION });
    throw new Error('Daily translation limit (500 words) exceeded. Please try again tomorrow.');
  }

  // 更新请求计数
  await env.RATE_LIMITS.put(hourlyWindowKey, hourlyCount.toString(), { expirationTtl: RATE_LIMIT.HOURLY.WINDOW_SIZE });
  await env.RATE_LIMITS.put(dailyWindowKey, dailyCount.toString(), { expirationTtl: RATE_LIMIT.DAILY.WINDOW_SIZE });
  return true;
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

      // 检查缓存
      const cachedResult = await getFromCache(env, text, from, to);
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
      const sign = await generateSign(text, salt, appid, key);

      // 构建百度翻译 API 请求
      const url = new URL('https://fanyi-api.baidu.com/api/trans/vip/translate');
      url.searchParams.append('q', text);
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
        await setToCache(env, text, from, to, translation);
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