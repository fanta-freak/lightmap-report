import { useRef, useEffect, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LightPoint, Direction, Building } from '../../types';
import {
  localToLngLat,
  fieldPolygonGeoJSON,
  getBounds,
  type GeoCenter,
} from '../../utils/coordinates';

/* ─── Types ─── */

export interface ReportMapProps {
  /** Geographic center + field bearing */
  geoCenter: GeoCenter;
  /** Half-dimensions of the field */
  halfWidth: number;
  halfLength: number;
  /** Mast positions (local coords) */
  masts?: LightPoint[];
  /** Aiming directions (local coords — vector field is the aiming point) */
  directions?: Direction[];
  /** Building outlines (will show as blue rectangles; needs position data) */
  buildings?: Building[];
  /** Building facade lines in local coords (rendered as thick blue lines) */
  buildingFacades?: { label: string; line: { x: number; y: number }[] }[];
  /** Show labels */
  showMastLabels?: boolean;
  showBuildingLabels?: boolean;
  /** Extra CSS class */
  className?: string;
  /** Map height */
  height?: number;
}

/* ─── Tile source ─── */

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Satellite',
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        '&copy; Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/* ─── Component ─── */

export function ReportMap({
  geoCenter,
  halfWidth,
  halfLength,
  masts = [],
  directions = [],
  buildingFacades = [],
  showMastLabels = true,
  showBuildingLabels = true,
  className = '',
  height = 420,
}: ReportMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // ── Pre-compute all GeoJSON data ──
  const geoData = useMemo(() => {
    // Field polygon
    const fieldFeature = fieldPolygonGeoJSON(halfWidth, halfLength, geoCenter);

    // Mast points
    const mastFeatures: GeoJSON.Feature[] = masts.map((m, i) => {
      const lngLat = localToLngLat(m.x, m.y, geoCenter);
      return {
        type: 'Feature' as const,
        properties: { label: `Mast ${i + 1}` },
        geometry: { type: 'Point' as const, coordinates: lngLat },
      };
    });

    // Direction arrows (from mast to aiming point)
    const arrowFeatures: GeoJSON.Feature[] = [];
    for (let i = 0; i < masts.length; i++) {
      const mast = masts[i];
      const dir = directions.find((d) => d.id === mast.direction_id);
      if (!dir) continue;

      const fromLngLat = localToLngLat(mast.x, mast.y, geoCenter);
      // Use aimingLine[1] if available, fall back to vector
      let aimX: number, aimY: number;
      if (dir.aimingLine && dir.aimingLine.length >= 2) {
        aimX = dir.aimingLine[1].x;
        aimY = dir.aimingLine[1].y;
      } else if (dir.vector) {
        aimX = dir.vector.x;
        aimY = dir.vector.y;
      } else {
        continue;
      }
      const toLngLat = localToLngLat(aimX, aimY, geoCenter);

      arrowFeatures.push({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [fromLngLat, toLngLat],
        },
      });
    }

    // Building facade lines
    const buildingFeatures: GeoJSON.Feature[] = buildingFacades.map((bf) => {
      const coords = bf.line.map((p) => localToLngLat(p.x, p.y, geoCenter));
      return {
        type: 'Feature' as const,
        properties: { label: bf.label },
        geometry: { type: 'LineString' as const, coordinates: coords },
      };
    });

    // Building label points (midpoint of facade line)
    const buildingLabelFeatures: GeoJSON.Feature[] = buildingFacades.map((bf) => {
      const mid = Math.floor(bf.line.length / 2);
      // For 2-point lines, average the endpoints; for 3+ points, use the middle vertex
      const cx = bf.line.length === 2
        ? (bf.line[0].x + bf.line[1].x) / 2
        : bf.line[mid].x;
      const cy = bf.line.length === 2
        ? (bf.line[0].y + bf.line[1].y) / 2
        : bf.line[mid].y;
      const lngLat = localToLngLat(cx, cy, geoCenter);
      return {
        type: 'Feature' as const,
        properties: { label: bf.label },
        geometry: { type: 'Point' as const, coordinates: lngLat },
      };
    });

    // Collect all points for bounds calculation
    const allPoints: [number, number][] = [];
    const fieldCoords = fieldFeature.geometry.coordinates[0];
    fieldCoords.forEach((c) => allPoints.push(c as [number, number]));
    mastFeatures.forEach((f) => {
      if (f.geometry.type === 'Point') {
        allPoints.push(f.geometry.coordinates as [number, number]);
      }
    });
    buildingFeatures.forEach((f) => {
      if (f.geometry.type === 'LineString') {
        f.geometry.coordinates.forEach((c) =>
          allPoints.push(c as [number, number])
        );
      }
    });

    const bounds = getBounds(allPoints, 30);

    return {
      fieldFeature,
      mastFeatures,
      arrowFeatures,
      buildingFeatures,
      buildingLabelFeatures,
      bounds,
    };
  }, [geoCenter, halfWidth, halfLength, masts, directions, buildingFacades]);

  // ── Initialize map ──
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      bounds: geoData.bounds as maplibregl.LngLatBoundsLike,
      fitBoundsOptions: { padding: 40 },
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    mapRef.current = map;

    map.on('load', () => {
      // ── Field polygon (orange outline) ──
      map.addSource('field', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [geoData.fieldFeature],
        },
      });
      map.addLayer({
        id: 'field-fill',
        type: 'fill',
        source: 'field',
        paint: {
          'fill-color': '#F97316',
          'fill-opacity': 0.08,
        },
      });
      map.addLayer({
        id: 'field-outline',
        type: 'line',
        source: 'field',
        paint: {
          'line-color': '#F97316',
          'line-width': 3,
          'line-opacity': 0.9,
        },
      });

      // ── Direction arrows (orange lines) ──
      if (geoData.arrowFeatures.length > 0) {
        map.addSource('arrows', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoData.arrowFeatures,
          },
        });
        map.addLayer({
          id: 'arrows-line',
          type: 'line',
          source: 'arrows',
          paint: {
            'line-color': '#F97316',
            'line-width': 2,
            'line-opacity': 0.85,
          },
        });
      }

      // ── Building facade lines (blue) ──
      if (geoData.buildingFeatures.length > 0) {
        map.addSource('buildings', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoData.buildingFeatures,
          },
        });
        map.addLayer({
          id: 'buildings-line',
          type: 'line',
          source: 'buildings',
          paint: {
            'line-color': '#3B82F6',
            'line-width': 5,
            'line-opacity': 0.9,
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
        });

        // Building labels
        if (showBuildingLabels) {
          map.addSource('building-labels', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: geoData.buildingLabelFeatures,
            },
          });
          map.addLayer({
            id: 'building-labels-layer',
            type: 'symbol',
            source: 'building-labels',
            layout: {
              'text-field': ['get', 'label'],
              'text-size': 11,
              'text-anchor': 'center',
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#93C5FD',
              'text-halo-color': '#1E293B',
              'text-halo-width': 1.5,
            },
          });
        }
      }

      // ── Mast markers (cyan dots + labels) ──
      if (geoData.mastFeatures.length > 0) {
        map.addSource('masts', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geoData.mastFeatures,
          },
        });
        map.addLayer({
          id: 'masts-circle',
          type: 'circle',
          source: 'masts',
          paint: {
            'circle-radius': 7,
            'circle-color': '#67E8F9',
            'circle-stroke-color': '#0E7490',
            'circle-stroke-width': 2,
          },
        });

        if (showMastLabels) {
          map.addLayer({
            id: 'masts-label',
            type: 'symbol',
            source: 'masts',
            layout: {
              'text-field': ['get', 'label'],
              'text-size': 12,
              'text-offset': [0, -1.5],
              'text-anchor': 'bottom',
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#FEF3C7',
              'text-halo-color': '#1E293B',
              'text-halo-width': 1.5,
            },
          });
        }
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geoData, showMastLabels, showBuildingLabels]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}
