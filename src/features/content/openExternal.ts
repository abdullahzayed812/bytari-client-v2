import * as Linking from 'expo-linking';

/**
 * Open a backend-authorized URL (a content file download URL, or an `https://`
 * link found in an article body) in the OS handler — the system browser / PDF
 * viewer / image viewer.
 *
 * SECURITY (§6, §25, §33): only `http:` / `https:` are allowed. `javascript:`,
 * `file:`, `data:`, custom schemes and anything unparseable are rejected — the
 * app never executes a URL scheme it was handed from untrusted content or a
 * storage provider.
 *
 * Returns `true` if the URL was handed off, `false` if it was rejected or the
 * OS could not open it (the caller shows a toast/message).
 */
export async function openExternalUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;

  let scheme: string;
  try {
    scheme = new URL(url).protocol.toLowerCase();
  } catch {
    return false;
  }
  if (scheme !== 'http:' && scheme !== 'https:') return false;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract the `http(s)://` links from a plain-text article body so the reader
 * can render them as tappable spans. Bare text only — no markup is parsed.
 */
const URL_RE = /https?:\/\/[^\s<>()"']+/g;

export function extractLinks(text: string): string[] {
  return Array.from(new Set(text.match(URL_RE) ?? []));
}
