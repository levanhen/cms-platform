import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __cmsRedis: Redis | null | undefined;
}

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  client.on("error", (error) => {
    console.error("[redis]", error.message);
  });
  return client;
}

export function getRedis() {
  if (globalThis.__cmsRedis === undefined) {
    globalThis.__cmsRedis = createRedis();
  }
  return globalThis.__cmsRedis;
}

async function readyRedis() {
  const redis = getRedis();
  if (!redis) return null;
  try {
    if (redis.status === "wait") await redis.connect();
    return redis;
  } catch {
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const redis = await readyRedis();
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      // fall through
    }
  }

  const value = await loader();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // ignore
    }
  }

  return value;
}

export async function invalidateKeys(keys: string[]) {
  const redis = await readyRedis();
  if (!redis || keys.length === 0) return;
  try {
    const expanded: string[] = [];
    for (const key of keys) {
      if (key.includes("*")) {
        const found = await redis.keys(key);
        expanded.push(...found);
      } else {
        expanded.push(key);
      }
    }
    if (expanded.length) await redis.del(...expanded);
  } catch (error) {
    console.error("[redis:invalidate]", error);
  }
}
