// Only allow same-origin, path-only redirects. Blocks open redirects such as
// "//evil.com", "/\evil.com" or "https://evil.com" passed through ?next=.
export function safeNext(next, fallback = '/dashboard') {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}
