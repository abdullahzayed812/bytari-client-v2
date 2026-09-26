/**
 * What a farm's QR code encodes: ONLY its join code, behind a fixed prefix so
 * the scanner can reject unrelated QR codes. No farm name, owner, id or other
 * data — the backend resolves the code (and re-checks the joiner is an
 * approved veterinarian) exactly as when the code is typed in.
 */
const PREFIX = 'bytari-farm:';

export function farmQrPayload(joinCode: string): string {
  return `${PREFIX}${joinCode}`;
}

/** The join code inside a scanned payload, or `null` when it is not a Bytari farm code. */
export function parseFarmQrPayload(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed.toLowerCase().startsWith(PREFIX)) return null;
  const code = trimmed.slice(PREFIX.length).trim();
  return /^[A-Za-z0-9-]{4,64}$/.test(code) ? code : null;
}
