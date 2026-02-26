import type { GeoCenter } from '../utils/coordinates';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DATA SOURCE LEGEND (temporary audit)                       ║
 * ║                                                             ║
 * ║  🟢 DUMP  — extracted from PostgreSQL sample dump           ║
 * ║  🔵 PDF   — read from the sample PDF report                ║
 * ║  🟡 INVENTED — made up / estimated (no source)             ║
 * ║  ⚠️  MISMATCH — value conflicts between dump and PDF       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/**
 * Geographic center for the demo sports field (Ibbenbüren / Münster area).
 * 🟢 DUMP — all values extracted from PostgreSQL sample dump:
 *   - Field polygon corners decoded from WKB geometry (SRID 4326)
 *   - Center = average of the four polygon corners
 *   - Edge 0→1 bearing ≈ 143.7° → Y+ axis (field length) points ~323.7° (NNW)
 *
 * In production, these come from the `fields` table geometry column.
 */
export const mockGeoCenter: GeoCenter = {
  lng: 7.18433015,                                               // 🟢 DUMP
  lat: 52.33465923,                                              // 🟢 DUMP
  fieldBearing: 323.7,                                           // 🟢 DUMP (computed from polygon edges)
};

/**
 * Real building facade lines extracted from the PostgreSQL sample dump.
 * 🟢 DUMP — all coordinate values from dump.
 *
 * The `buildings` table stores facades as LineStrings (wall faces, not footprints).
 * Coordinates are in our local system: x = width direction, y = length direction.
 *
 * Note: Dump uses (x=length, y=width), so values are swapped here:
 *   our_x = dump_y,  our_y = dump_x
 *
 * Building 10 → Fassade 1: straight wall, height 8m, elev_relative +3m
 * Building 11 → Fassade 2: straight wall, height 8m, elev_relative +2m
 * Building 12 → Fassade 3: L-shaped wall (3 vertices), height 8m, elev_relative +2m
 */
export const mockBuildingFacades: { label: string; line: { x: number; y: number }[] }[] = [
  {
    label: 'Fassade 1',                                          // 🟢 DUMP (building id=10)
    line: [
      { x: 72.90, y: 43.27 },                                   // 🟢 DUMP
      { x: 70.51, y: 29.44 },                                   // 🟢 DUMP
    ],
  },
  {
    label: 'Fassade 2',                                          // 🟢 DUMP (building id=11)
    line: [
      { x: 65.39, y: 23.26 },                                   // 🟢 DUMP
      { x: 59.63, y: -1.75 },                                   // 🟢 DUMP
    ],
  },
  {
    label: 'Fassade 3',                                          // 🟢 DUMP (building id=12)
    line: [
      { x: 50.38, y: -24.98 },                                  // 🟢 DUMP
      { x: 54.74, y: -11.87 },                                  // 🟢 DUMP
      { x: 57.78, y: -12.84 },                                  // 🟢 DUMP
    ],
  },
];
