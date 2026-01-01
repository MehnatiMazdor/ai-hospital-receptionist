import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';

// 10 queries per ip per minute
export const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute per user
  analytics: true,
});