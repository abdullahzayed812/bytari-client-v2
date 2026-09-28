/**
 * RFC 4122 v4-shaped id for client idempotency keys (e.g. a broadcast's
 * `clientRequestId`, so a double tap / retry is de-duplicated server-side).
 * Uniqueness only — NOT a security token, so `Math.random` is sufficient.
 */
export function newRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
