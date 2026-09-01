/**
 * Re-exported from the `veterinarian` feature, which owns the actual
 * `PresignProvider` implementation (it wraps `veterinarianApi`, which lives
 * there). Kept as its own file here — per the registration feature's public
 * surface — so screens/components in this feature import it the same way as
 * every other registration hook, without reaching into `@/features/veterinarian`
 * directly.
 *
 * IMPORTANT: this file (and everything that imports it) must stay a
 * one-directional dependency on `veterinarian` — the `veterinarian` feature
 * must never import anything from `registration`, or this re-export would
 * close an import cycle back through `veterinarian`'s own screens/index.
 */
export {
  useVeterinarianDocumentPresignProvider,
  type UseVeterinarianDocumentPresignProvider,
  type VeterinarianDocumentRef,
} from '@/features/veterinarian';
