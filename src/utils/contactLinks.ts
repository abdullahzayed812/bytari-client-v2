import { Linking } from 'react-native';

/**
 * Contact actions shared by every profile that shows a phone number or a
 * website (clinics, offices, syndicates, members, offers…). Only `tel:` and
 * http(s) URLs are ever produced — a stored value can never turn into a
 * `javascript:` / `intent:` link — and nothing is opened without a user tap
 * (the dialer opens pre-filled; the user still starts the call).
 */

/** `tel:` URL from a displayed number: keeps one leading `+` and the digits. `null` if no digits. */
export function telUrl(phone: string | null | undefined): string | null {
  const raw = (phone ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `tel:${raw.startsWith('+') || raw.startsWith('00') ? '+' : ''}${
    raw.startsWith('00') ? digits.slice(2) : digits
  }`;
}

/**
 * Normalised http(s) URL for a stored website, or `null` when it is not a
 * safe web address. Adds `https://` to a bare host (`example.com`), collapses
 * a duplicated scheme (`https://https://x`, `http://https://x`) and rejects
 * any other scheme.
 */
export function websiteUrl(value: string | null | undefined): string | null {
  let v = (value ?? '').trim();
  if (!v || /\s/.test(v)) return null;
  // collapse repeated schemes — keep the innermost one
  while (/^https?:\/\/https?:\/\//i.test(v)) v = v.replace(/^https?:\/\//i, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) {
    // `javascript:`, `data:`, `mailto:`, `ftp:`… — but allow `host:port`
    if (!/^[a-z0-9.-]+:\d+(\/|$)/i.test(v)) return null;
  }
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, '')}`;
  try {
    const u = new URL(v);
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !u.hostname.includes('.')) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Opens the dialer pre-filled with `phone`. Resolves `false` when it cannot. */
export async function openPhone(phone: string | null | undefined): Promise<boolean> {
  const url = telUrl(phone);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Opens `website` in the browser (a new tab on web). Resolves `false` when unsafe / unopenable. */
export async function openWebsite(website: string | null | undefined): Promise<boolean> {
  const url = websiteUrl(website);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
