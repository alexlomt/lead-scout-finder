
import { useState, useCallback } from 'react';
import { searchRateLimiter, exportRateLimiter, getUserRateLimitKey } from '@/utils/rateLimiter';
import { useAuth } from '@/contexts/AuthContext';

type RateLimitOperation = 'search' | 'export';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  checkLimit: (operation: RateLimitOperation) => boolean;
  getRemainingTime: (operation: RateLimitOperation) => number;
}

export const useRateLimit = (): RateLimitResult => {
  const { user } = useAuth();
  const [rateLimitState, setRateLimitState] = useState({
    search: { remaining: 10, resetTime: 0 },
    export: { remaining: 5, resetTime: 0 }
  });

  const getRateLimiter = (operation: RateLimitOperation) => {
    return operation === 'search' ? searchRateLimiter : exportRateLimiter;
  };

  const checkLimit = useCallback((operation: RateLimitOperation): boolean => {
    if (!user) return false;

    const limiter = getRateLimiter(operation);
    const key = getUserRateLimitKey(user.id, operation);
    const result = limiter.checkLimit(key);

    setRateLimitState(prev => ({
      ...prev,
      [operation]: {
        remaining: result.remaining,
        resetTime: result.resetTime
      }
    }));

    return result.allowed;
  }, [user]);

  const getRemainingTime = useCallback((operation: RateLimitOperation): number => {
    if (!user) return 0;

    const limiter = getRateLimiter(operation);
    const key = getUserRateLimitKey(user.id, operation);
    return limiter.getRemainingTime(key);
  }, [user]);

  return {
    allowed: true,
    remaining: rateLimitState.search.remaining,
    resetTime: rateLimitState.search.resetTime,
    checkLimit,
    getRemainingTime
  };
};
