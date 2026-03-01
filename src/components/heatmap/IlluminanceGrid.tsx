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
 * Axis orientation is auto-detected from the data.
 * The axis with span ≈ fieldLength is the "length" axis (horizontal on canvas).
 * The axis with span ≈ fieldWidth is the "width" axis (vertical on canvas).
 *
 * Mock data convention:  X = width, Y = length  → normal
 * C# app convention:     X = length, Y = width  → swapped
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

    const xsSorted = [...uniqueXs].sort((a, b) => b - a); // descending
    const ysSorted = [...uniqueYs].sort((a, b) => a - b); // ascending

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
      cols: ysSorted.length,
      rows: xsSorted.length,
      uniqueXs: xsSorted,
      uniqueYs: ysSorted,
    };
  }, [points]);

  // Auto-detect axis orientation & compute world bounds
  const worldBounds = useMemo(() => {
    // Measure actual data spans
    const xVals = points.map((p) => p.x);
    const yVals = points.map((p) => p.y);
    const xSpan = xVals.length > 0 ? Math.max(...xVals) - Math.min(...xVals) : 0;
    const ySpan = yVals.length > 0 ? Math.max(...yVals) - Math.min(...yVals) : 0;

    // Compare spans to field dimensions to detect orientation
    // Normal:  X ≈ fieldWidth,  Y ≈ fieldLength
    // Swapped: X ≈ fieldLength, Y ≈ fieldWidth
    const normalErr = Math.abs(xSpan - fieldWidth) + Math.abs(ySpan - fieldLength);
    const swappedErr = Math.abs(xSpan - fieldLength) + Math.abs(ySpan - fieldWidth);
    const swapped = swappedErr < normalErr;

    // Field half-dimensions in the world X/Y axes
    const xHalfField = swapped ? fieldLength / 2 : fieldWidth / 2;
    const yHalfField = swapped ? fieldWidth / 2 : fieldLength / 2;

    let xMin = -xHalfField, xMax = xHalfField;
    let yMin = -yHalfField, yMax = yHalfField;

    // Expand to include mast positions
    masts.forEach((m) => {
      xMin = Math.min(xMin, m.x);
      xMax = Math.max(xMax, m.x);
      yMin = Math.min(yMin, m.y);
      yMax = Math.max(yMax, m.y);
    });

    // Padding for labels
    const padX = (xMax - xMin) * 0.07;
    const padY = (yMax - yMin) * 0.05;
    xMin -= padX; xMax += padX;
    yMin -= padY; yMax += padY;

    // Display: horizontal = length axis, vertical = width axis
    return {
      xMin, xMax, yMin, yMax,
      swapped,
      hRange: swapped ? (xMax - xMin) : (yMax - yMin),
      vRange: swapped ? (yMax - yMin) : (xMax - xMin),
    };
  }, [points, fieldLength, fieldWidth, masts]);

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
      const { swapped, xMin, xMax, yMin, yMax, hRange, vRange } = worldBounds;

      const aspect = vRange / hRange;
      const canvasW = containerWidth;
      const canvasH = canvasW * aspect;

      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      canvas.style.width = `${canvasW}px`;
      canvas.style.height = `${canvasH}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // World-to-canvas mapping functions
      // toCanvasH: maps the "horizontal display coord" to canvas X
      // toCanvasV: maps the "vertical display coord" to canvas Y (flipped: + = top)
      const hMin = swapped ? xMin : yMin;
      const vMax = swapped ? yMax : xMax;

      const toCanvasH = (hCoord: number) =>
        ((hCoord - hMin) / hRange) * canvasW;
      const toCanvasV = (vCoord: number) =>
        ((vMax - vCoord) / vRange) * canvasH;

      // Extract the display-axis coordinate from a world (x, y) pair
      const getH = (x: number, y: number) => swapped ? x : y;
      const getV = (x: number, y: number) => swapped ? y : x;

      // Clear
      ctx.fillStyle = '#F8FAFB';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Cell dimensions in display coords
      const hValues = swapped ? uniqueXs : uniqueYs;
      const vValues = swapped ? uniqueYs : uniqueXs;

      const cellWorldH = hValues.length > 1
        ? Math.abs(hValues[hValues.length - 1] - hValues[0]) / (hValues.length - 1)
        : 1;
      const cellWorldV = vValues.length > 1
        ? Math.abs(vValues[vValues.length - 1] - vValues[0]) / (vValues.length - 1)
        : 1;

      const cellPixelW = (cellWorldH / hRange) * canvasW;
      const cellPixelH = (cellWorldV / vRange) * canvasH;

      // Draw grid cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r]?.[c];
          if (!cell) continue;

          const ch = getH(cell.x, cell.y);
          const cv = getV(cell.x, cell.y);
          const cx = toCanvasH(ch) - cellPixelW / 2;
          const cy = toCanvasV(cv) - cellPixelH / 2;
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
            ctx.fillText(String(Math.round(cell.eh)), toCanvasH(ch), toCanvasV(cv));
          }
        }
      }

      // Field outline: length always horizontal, width always vertical
      const halfFieldH = fieldLength / 2;
      const halfFieldV = fieldWidth / 2;

      // Total area outline (thin gray)
      ctx.strokeStyle = 'rgba(107, 114, 128, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toCanvasH(-halfFieldH), toCanvasV(halfFieldV),
        toCanvasH(halfFieldH) - toCanvasH(-halfFieldH),
        toCanvasV(-halfFieldV) - toCanvasV(halfFieldV)
      );

      // Playing area outline (dashed orange, inset ~10%)
      const paInset = 0.1;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(
        toCanvasH(-halfFieldH * (1 - paInset)), toCanvasV(halfFieldV * (1 - paInset)),
        toCanvasH(halfFieldH * (1 - paInset)) - toCanvasH(-halfFieldH * (1 - paInset)),
        toCanvasV(-halfFieldV * (1 - paInset)) - toCanvasV(halfFieldV * (1 - paInset))
      );
      ctx.setLineDash([]);

      // Draw aiming arrows: FROM mast TO aiming point
      if (showArrows) {
        masts.forEach((mast) => {
          const dir = directions.find((d) => d.id === mast.direction_id);
          if (!dir) return;

          let aimX: number, aimY: number;
          if (Array.isArray(dir.aimingLine) && dir.aimingLine.length >= 2 && typeof dir.aimingLine[1]?.x === 'number') {
            aimX = dir.aimingLine[1].x;
            aimY = dir.aimingLine[1].y;
          } else if (dir.vector && typeof dir.vector === 'object' && typeof dir.vector.x === 'number') {
            aimX = dir.vector.x;
            aimY = dir.vector.y;
          } else {
            return;
          }

          const fromH = toCanvasH(getH(mast.x, mast.y));
          const fromV = toCanvasV(getV(mast.x, mast.y));
          const toH = toCanvasH(getH(aimX, aimY));
          const toV = toCanvasV(getV(aimX, aimY));

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
        const mh = toCanvasH(getH(mast.x, mast.y));
        const mv = toCanvasV(getV(mast.x, mast.y));

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

        // Vertical axis coord determines top/bottom label placement
        const mastVCoord = getV(mast.x, mast.y);
        if (mastVCoord > halfFieldV * 0.5) labelV -= labelOffset;
        else if (mastVCoord < -halfFieldV * 0.5) labelV += labelOffset;
        else {
          const mastHCoord = getH(mast.x, mast.y);
          labelH += mastHCoord < 0 ? -labelOffset * 2 : labelOffset * 2;
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

      const { swapped, xMin, yMin, xMax, yMax, hRange, vRange } = worldBounds;

      // Inverse mapping: canvas → world x, y
      const hMin = swapped ? xMin : yMin;
      const vMax = swapped ? yMax : xMax;
      const hCoord = hMin + (mouseH / canvasW) * hRange;
      const vCoord = vMax - (mouseV / canvasH) * vRange;

      const worldX = swapped ? hCoord : vCoord;
      const worldY = swapped ? vCoord : hCoord;

      // Cell sizes in world coords (always X and Y)
      const cellWorldX = rows > 1 ? Math.abs(uniqueXs[0] - uniqueXs[uniqueXs.length - 1]) / (rows - 1) : 5;
      const cellWorldY = cols > 1 ? Math.abs(uniqueYs[uniqueYs.length - 1] - uniqueYs[0]) / (cols - 1) : 5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r]?.[c];
          if (!cell) continue;
          if (Math.abs(worldX - cell.x) < cellWorldX / 2 &&
              Math.abs(worldY - cell.y) < cellWorldY / 2) {
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
