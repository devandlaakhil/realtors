export const DEFAULT_SERVICE_RADIUS_KM = 30;

type CoordinateValue = number | string | null | undefined;

export interface SearchCoordinates {
  lat?: CoordinateValue;
  lng?: CoordinateValue;
  latitude?: CoordinateValue;
  longitude?: CoordinateValue;
}

export function toFiniteNumber(value: CoordinateValue): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function searchLatitude(params?: SearchCoordinates | null): number | null {
  return toFiniteNumber(params?.lat ?? params?.latitude);
}

export function searchLongitude(params?: SearchCoordinates | null): number | null {
  return toFiniteNumber(params?.lng ?? params?.longitude);
}

export function distanceKm(
  fromLatValue: CoordinateValue,
  fromLngValue: CoordinateValue,
  toLatValue: CoordinateValue,
  toLngValue: CoordinateValue,
): number | null {
  const fromLat = toFiniteNumber(fromLatValue);
  const fromLng = toFiniteNumber(fromLngValue);
  const toLat = toFiniteNumber(toLatValue);
  const toLng = toFiniteNumber(toLngValue);

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) return null;

  const rad = Math.PI / 180;
  const dLat = (toLat - fromLat) * rad;
  const dLng = (toLng - fromLng) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat * rad) * Math.cos(toLat * rad) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinServiceRadius(
  params: SearchCoordinates | null | undefined,
  rowLatitude: CoordinateValue,
  rowLongitude: CoordinateValue,
  radiusKm = DEFAULT_SERVICE_RADIUS_KM,
): boolean {
  const km = distanceKm(searchLatitude(params), searchLongitude(params), rowLatitude, rowLongitude);
  return km !== null && km <= radiusKm;
}

