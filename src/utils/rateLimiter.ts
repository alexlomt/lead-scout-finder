
interface RateLimitData {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private storage: Map<string, RateLimitData> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, data] of this.storage.entries()) {
      if (now >= data.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  public checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const data = this.storage.get(identifier);

    if (!data || now >= data.resetTime) {
      // First request or window expired
      const resetTime = now + this.config.windowMs;
      this.storage.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime
      };
    }

    if (data.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime
      };
    }

    // Increment count
    data.count++;
    this.storage.set(identifier, data);

    return {
      allowed: true,
      remaining: this.config.maxRequests - data.count,
      resetTime: data.resetTime
    };
  }

  public getRemainingTime(identifier: string): number {
    const data = this.storage.get(identifier);
    if (!data) return 0;
    return Math.max(0, data.resetTime - Date.now());
  }
}

// Create rate limiter instances for different operations
export const searchRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 searches per hour
  windowMs: 60 * 60 * 1000 // 1 hour
});

export const exportRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 exports per hour
  windowMs: 60 * 60 * 1000 // 1 hour
});

// Helper function to get user-specific rate limit key
export const getUserRateLimitKey = (userId: string, operation: string): string => {
  return `${operation}:${userId}`;
};
