/**
 * Transforms local field coordinates (meters) to geographic coordinates (lng, lat).
 *
 * Local coordinate system:
 *   X = field WIDTH direction  (±34 m for a 68m-wide field)
 *   Y = field LENGTH direction (±52.5 m for a 105m-long field)
 *
 * The `fieldBearing` defines the compass bearing (degrees clockwise from north)
 * that the local Y+ axis points towards. For example, if Y+ points NNW, bearing ≈ 340°.
 */

const DEG_TO_RAD = Math.PI / 180;

/** Meters per degree of latitude (constant everywhere) */
const METERS_PER_DEG_LAT = 111_320;

/** Meters per degree of longitude (varies with latitude) */
function metersPerDegLng(latDeg: number): number {
  return 111_320 * Math.cos(latDeg * DEG_TO_RAD);
}

export interface GeoCenter {
  lng: number;
  lat: number;
  /** Compass bearing of the field Y+ axis (degrees clockwise from north) */
  fieldBearing: number;
}

/**
 * Convert a local (x, y) position in meters to [lng, lat].
 *
 * Steps:
 *  1. Rotate local coords by fieldBearing so X → geographic east, Y → geographic north
 *  2. Convert meters offset to degree offset
 *  3. Add to center
 */
export function localToLngLat(
  localX: number,
  localY: number,
  center: GeoCenter,
): [number, number] {
  const bearingRad = center.fieldBearing * DEG_TO_RAD;

  // Rotate: bearing B is CW from north (direction of local Y+).
  // The dump's local coordinate system is LEFT-handed:
  //   Y+ points at bearing B (NNW for this field)
  //   X+ points at bearing B − 90° (SSW — to the LEFT of Y+)
  //
  // For a direction at bearing θ:  east = sin(θ), north = cos(θ)
  //   X+ at (B−90°): east = sin(B−90°) = −cos(B),  north = cos(B−90°) = sin(B)
  //   Y+ at B:        east = sin(B),                 north = cos(B)
  //
  //   geoEast  = localX * (−cos B) + localY * sin B
  //   geoNorth = localX * sin B     + localY * cos B
  const geoEast = -localX * Math.cos(bearingRad) + localY * Math.sin(bearingRad);
  const geoNorth = localX * Math.sin(bearingRad) + localY * Math.cos(bearingRad);

  const dLng = geoEast / metersPerDegLng(center.lat);
  const dLat = geoNorth / METERS_PER_DEG_LAT;

  return [center.lng + dLng, center.lat + dLat];
}

/**
 * Convert a ring of local points to a GeoJSON-compatible coordinate ring (closed).
 */
export function localRingToLngLat(
  points: { x: number; y: number }[],
  center: GeoCenter,
): [number, number][] {
  const ring = points.map((p) => localToLngLat(p.x, p.y, center));
  // Close the ring
  if (ring.length > 0) {
    ring.push(ring[0]);
  }
  return ring;
}

/**
 * Create a GeoJSON Feature for a field rectangle given half-dimensions.
 */
export function fieldPolygonGeoJSON(
  halfWidth: number,
  halfLength: number,
  center: GeoCenter,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const corners = [
    { x: -halfWidth, y: halfLength },   // top-left
    { x: halfWidth, y: halfLength },    // top-right
    { x: halfWidth, y: -halfLength },   // bottom-right
    { x: -halfWidth, y: -halfLength },  // bottom-left
  ];
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [localRingToLngLat(corners, center)],
    },
  };
}

/**
 * Compute the bounding box that contains all given [lng, lat] points with padding.
 */
export function getBounds(
  points: [number, number][],
  paddingMeters: number = 40,
): [[number, number], [number, number]] {
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Add padding in degrees
  const avgLat = (minLat + maxLat) / 2;
  const dLng = paddingMeters / metersPerDegLng(avgLat);
  const dLat = paddingMeters / METERS_PER_DEG_LAT;

  return [
    [minLng - dLng, minLat - dLat],
    [maxLng + dLng, maxLat + dLat],
  ];
}
