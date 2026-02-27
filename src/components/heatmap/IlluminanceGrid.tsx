import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { CalculationPoint, LightPoint, Direction } from '../../types';
import { luxToColor, textColorForLux } from '../../utils/colorScale';
import { HeatmapTooltip } from './HeatmapTooltip';

interface IlluminanceGridProps {
  points: CalculationPoint[];
  masts: LightPoint[];
  directions: Direction[];
  fieldLength: number;
  fieldWidth: number;
}

interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  eh: number;
  point: CalculationPoint;
}

interface TooltipData {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  lux: number;
  point: CalculationPoint;
}

/*
 * Coordinate convention (from DB / lightpoints):
 *   X = field WIDTH direction  (short side, ±34m field, masts at ±37.5m)
 *   Y = field LENGTH direction (long side,  ±52.5m field, masts at ±55m)
 *
 * Display mapping (landscape orientation like the PDF):
 *   Horizontal canvas axis ← Y (length, wider range)
 *   Vertical canvas axis   ← X (width, narrower range, flipped so +X = top)
 */

export function IlluminanceGrid({
  points,
  masts,
  directions,
  fieldLength,
  fieldWidth,
}: IlluminanceGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [showArrows, setShowArrows] = useState(true);
  const [showValues, setShowValues] = useState(true);

  // Build grid from points (memoized)
  const grid = useMemo(() => {
    const uniqueXs = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b);
    const uniqueYs = [...new Set(points.map((p) => p.y))].sort((a, b) => a - b);

    const pointMap = new Map<string, CalculationPoint>();
    points.forEach((p) => pointMap.set(`${p.x},${p.y}`, p));

    // Build cells: row = X index (top→bottom = max X → min X), col = Y index (left→right = min Y → max Y)
    const xsSorted = [...uniqueXs].sort((a, b) => b - a); // descending: top row = highest X
    const ysSorted = [...uniqueYs].sort((a, b) => a - b); // ascending: left col = lowest Y

    const cells: GridCell[][] = [];
    xsSorted.forEach((x, row) => {
      cells[row] = [];
      ysSorted.forEach((y, col) => {
        const point = pointMap.get(`${x},${y}`);
        if (point) {
          cells[row][col] = { row, col, x, y, eh: point.eh, point };
        }
      });
    });

    return {
      cells,
      cols: ysSorted.length,   // Y values = columns (horizontal)
      rows: xsSorted.length,   // X values = rows (vertical)
      uniqueXs: xsSorted,      // descending (top to bottom)
      uniqueYs: ysSorted,      // ascending (left to right)
    };
  }, [points]);

  // Compute world bounds including grid AND mast positions
  // World coords: H = Y (length), V = X (width)
  const worldBounds = useMemo(() => {
    const halfW = fieldWidth / 2;   // X range of field: ±halfW
    const halfL = fieldLength / 2;  // Y range of field: ±halfL

    let xMin = -halfW, xMax = halfW;
    let yMin = -halfL, yMax = halfL;

    // Expand to include mast positions
    masts.forEach((m) => {
      xMin = Math.min(xMin, m.x);
      xMax = Math.max(xMax, m.x);
      yMin = Math.min(yMin, m.y);
      yMax = Math.max(yMax, m.y);
    });

    // Add padding for labels
    const padX = (xMax - xMin) * 0.07;
    const padY = (yMax - yMin) * 0.05;
    xMin -= padX; xMax += padX;
    yMin -= padY; yMax += padY;

    // Display dimensions: H = Y range, V = X range
    return {
      xMin, xMax, yMin, yMax,
      hRange: yMax - yMin,  // horizontal = Y (length)
      vRange: xMax - xMin,  // vertical = X (width)
    };
  }, [fieldLength, fieldWidth, masts]);

  // Draw effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { cells, cols, rows, uniqueXs, uniqueYs } = grid;
    if (cols === 0 || rows === 0) return;

    const rafId = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const containerWidth = Math.max(container.clientWidth, 600);

      // Canvas aspect: horizontal = Y range (length), vertical = X range (width)
      const aspect = worldBounds.vRange / worldBounds.hRange;
      const canvasW = containerWidth;
      const canvasH = canvasW * aspect;

      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // World-to-canvas mapping:
      //   Horizontal: world Y → canvas X  (Y increases left to right)
      //   Vertical:   world X → canvas Y  (X increases bottom to top, so flip)
      const toCanvasH = (worldY: number) =>
        ((worldY - worldBounds.yMin) / worldBounds.hRange) * canvasW;
      const toCanvasV = (worldX: number) =>
        ((worldBounds.xMax - worldX) / worldBounds.vRange) * canvasH;

      // Clear
      ctx.fillStyle = '#F8FAFB';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Cell dimensions in world coords
      const cellWorldH = cols > 1
        ? (uniqueYs[uniqueYs.length - 1] - uniqueYs[0]) / (cols - 1)
        : 1;
      const cellWorldV = rows > 1
        ? (uniqueXs[0] - uniqueXs[uniqueXs.length - 1]) / (rows - 1)
        : 1;
      // Cell dimensions in pixels
      const cellPixelW = (cellWorldH / worldBounds.hRange) * canvasW;
      const cellPixelH = (cellWorldV / worldBounds.vRange) * canvasH;

      // Draw grid cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r]?.[c];
          if (!cell) continue;

          const cx = toCanvasH(cell.y) - cellPixelW / 2;
          const cy = toCanvasV(cell.x) - cellPixelH / 2;
          const isHovered = hoveredCell?.row === r && hoveredCell?.col === c;

          ctx.fillStyle = luxToColor(cell.eh);
          ctx.fillRect(cx, cy, cellPixelW, cellPixelH);

          if (isHovered) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(cx + 1.5, cy + 1.5, cellPixelW - 3, cellPixelH - 3);
          }

          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx, cy, cellPixelW, cellPixelH);

          if (showValues && cellPixelW > 22) {
            ctx.fillStyle = textColorForLux(cell.eh);
            const fontSize = Math.max(Math.min(cellPixelW * 0.38, cellPixelH * 0.38), 9);
            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(Math.round(cell.eh)), toCanvasH(cell.y), toCanvasV(cell.x));
          }
        }
      }

      // Draw total area outline (thin gray)
      const halfW = fieldWidth / 2;
      const halfL = fieldLength / 2;
      ctx.strokeStyle = 'rgba(107, 114, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toCanvasH(-halfL), toCanvasV(halfW),
        toCanvasH(halfL) - toCanvasH(-halfL),
        toCanvasV(-halfW) - toCanvasV(halfW)
      );

      // Draw playing area outline (dashed orange, inset ~10%)
      const paInset = 0.1;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(
        toCanvasH(-halfL * (1 - paInset)), toCanvasV(halfW * (1 - paInset)),
        toCanvasH(halfL * (1 - paInset)) - toCanvasH(-halfL * (1 - paInset)),
        toCanvasV(-halfW * (1 - paInset)) - toCanvasV(halfW * (1 - paInset))
      );
      ctx.setLineDash([]);

      // Draw aiming arrows: FROM mast TO aiming point
      if (showArrows) {
        masts.forEach((mast) => {
          const dir = directions.find((d) => d.id === mast.direction_id);
          if (!dir) return;

          // Use aimingLine[1] if available, fall back to vector
          let aimX: number, aimY: number;
          if (dir.aimingLine && dir.aimingLine.length >= 2) {
            aimX = dir.aimingLine[1].x;
            aimY = dir.aimingLine[1].y;
          } else if (dir.vector) {
            aimX = dir.vector.x;
            aimY = dir.vector.y;
          } else {
            return;
          }

          const fromH = toCanvasH(mast.y);
          const fromV = toCanvasV(mast.x);
          const toH = toCanvasH(aimY);
          const toV = toCanvasV(aimX);

          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fromH, fromV);
          ctx.lineTo(toH, toV);
          ctx.stroke();

          const angle = Math.atan2(toV - fromV, toH - fromH);
          const headLen = 10;
          ctx.fillStyle = '#2563EB';
          ctx.beginPath();
          ctx.moveTo(toH, toV);
          ctx.lineTo(toH - headLen * Math.cos(angle - Math.PI / 6), toV - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(toH - headLen * Math.cos(angle + Math.PI / 6), toV - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        });
      }

      // Draw mast markers and labels
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      masts.forEach((mast, i) => {
        const mh = toCanvasH(mast.y);
        const mv = toCanvasV(mast.x);

        // Mast dot
        ctx.beginPath();
        ctx.arc(mh, mv, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1A2E';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label — offset away from field center
        const labelOffset = 18;
        let labelH = mh;
        let labelV = mv;

        // X determines top/bottom (masts above or below the grid)
        if (mast.x > halfW * 0.5) labelV -= labelOffset;       // above grid → label above
        else if (mast.x < -halfW * 0.5) labelV += labelOffset;  // below grid → label below
        else {
          // Side masts (x≈0) — shouldn't happen with current data but handle anyway
          labelH += mast.y < 0 ? -labelOffset * 2 : labelOffset * 2;
        }

        ctx.fillStyle = '#1A1A2E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Mast ${i + 1}`, labelH, labelV);
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [grid, worldBounds, hoveredCell, showArrows, showValues, masts, directions, fieldLength, fieldWidth]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setHoveredCell((prev) => prev));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Mouse tracking for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { cells, cols, rows, uniqueXs, uniqueYs } = grid;
      if (cols === 0) return;

      const rect = canvas.getBoundingClientRect();
      const mouseH = e.clientX - rect.left;
      const mouseV = e.clientY - rect.top;
      const canvasW = canvas.clientWidth;
      const canvasH = canvas.clientHeight;

      // Inverse mapping: canvas → world
      const worldY = worldBounds.yMin + (mouseH / canvasW) * worldBounds.hRange;
      const worldX = worldBounds.xMax - (mouseV / canvasH) * worldBounds.vRange;

      // Cell sizes in world coords
      const cellWorldH = cols > 1 ? (uniqueYs[uniqueYs.length - 1] - uniqueYs[0]) / (cols - 1) : 5;
      const cellWorldV = rows > 1 ? (uniqueXs[0] - uniqueXs[uniqueXs.length - 1]) / (rows - 1) : 5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r]?.[c];
          if (!cell) continue;
          if (Math.abs(worldX - cell.x) < cellWorldV / 2 &&
              Math.abs(worldY - cell.y) < cellWorldH / 2) {
            setHoveredCell({ row: r, col: c });
            setTooltip({
              x: cell.x, y: cell.y,
              screenX: e.clientX, screenY: e.clientY,
              lux: cell.eh, point: cell.point,
            });
            return;
          }
        }
      }
      setHoveredCell(null);
      setTooltip(null);
    },
    [grid, worldBounds]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setTooltip(null);
  }, []);

  return (
    <div className="bg-card-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-break-before">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-signify-dark">
            Beleuchtungsstärke E<sub className="text-xs">m</sub> in lux
          </h3>
          <p className="text-sm text-signify-gray mt-0.5">
            Alle Werte berechnet mit Wartungsfaktor: 0,92
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-signify-gray">
            <input
              type="checkbox"
              checked={showArrows}
              onChange={(e) => setShowArrows(e.target.checked)}
              className="accent-signify-teal rounded"
            />
            Pfeile
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-signify-gray">
            <input
              type="checkbox"
              checked={showValues}
              onChange={(e) => setShowValues(e.target.checked)}
              className="accent-signify-teal rounded"
            />
            Werte
          </label>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="heatmap-container px-4 py-6 overflow-x-auto" style={{ minWidth: 600 }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="mx-auto cursor-crosshair block"
          width={800}
          height={600}
        />
      </div>

      {/* Color Legend */}
      <div className="px-8 pb-6">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xs text-signify-gray">Niedrig</span>
          <div className="flex h-4 rounded-full overflow-hidden w-64">
            {[0, 10, 30, 60, 85, 100, 130, 180].map((lux) => (
              <div key={lux} className="flex-1" style={{ backgroundColor: luxToColor(lux) }} />
            ))}
          </div>
          <span className="text-xs text-signify-gray">Hoch</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && <HeatmapTooltip data={tooltip} />}
    </div>
  );
}
