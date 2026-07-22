const RATE_LIMIT_STORE = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = RATE_LIMIT_STORE.get(key) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= maxRequests) return false;
  recent.push(now);
  RATE_LIMIT_STORE.set(key, recent);
  return true;
}

export function getRateLimitHeaders(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const timestamps = RATE_LIMIT_STORE.get(key) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, maxRequests - recent.length)),
    "X-RateLimit-Reset": String(Math.ceil((now + windowMs) / 1000)),
  };
}
