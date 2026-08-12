type Entry = { count: number; resetAt: number };

const globalRateLimits = globalThis as unknown as {
  rateLimits?: Map<string, Entry>;
};
const entries = globalRateLimits.rateLimits ?? new Map<string, Entry>();
globalRateLimits.rateLimits = entries;

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function requestIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
