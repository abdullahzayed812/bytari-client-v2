/**
 * Optional http(s) link attached to a broadcast / message. Mirrors the server's
 * `linkUrlSchema`: only web URLs are accepted, so a tap can only open a browser.
 */
export function isHttpUrl(value: string): boolean {
  const v = value.trim();
  if (!/^https?:\/\/\S+$/i.test(v)) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** '' → null; otherwise the trimmed link. */
export function normalizeLink(value: string | undefined | null): string | null {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : null;
}
