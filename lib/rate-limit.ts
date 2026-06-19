/**
 * Simple in-memory rate limiter.
 * For production scale, swap the map for a Redis store.
 */

interface RateLimitEntry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // e.g. 60_000 for 1 minute
  max:      number; // e.g. 10
}

export function rateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; remaining: number } {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.max - 1 };
  }

  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: opts.max - entry.count };
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again.", code: "RATE_LIMITED" }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
  );
}
