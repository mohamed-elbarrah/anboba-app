import "server-only";

const windowMs = 60_000;
const maxRequests = 10;
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Best-effort process-local limiter; deployments should put a shared limiter in front of the app. */
export function allowSubmission(key: string) {
  const now = Date.now();
  for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  if (buckets.size >= 10_000 && !buckets.has(key)) return false;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= maxRequests) return false;
  current.count += 1;
  return true;
}
