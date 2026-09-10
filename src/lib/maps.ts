/**
 * A Google Maps search URL for an organization's location — coordinates when
 * present (exact pin), otherwise a text search on the address. Shared by
 * every "Directions" / location action (Clinic Details, Veterinary Office
 * Details) so the fallback behaviour never drifts between screens.
 */
export function mapsUrl(
  address: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
