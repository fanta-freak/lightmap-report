import { useEffect, useRef } from 'react';
import type { CalculationPoint } from '../../types';
import { luxToColor } from '../../utils/colorScale';

interface TooltipData {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  lux: number;
  point: CalculationPoint;
}

interface HeatmapTooltipProps {
  data: TooltipData;
}

export function HeatmapTooltip({ data }: HeatmapTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    let x = data.screenX + 16;
    let y = data.screenY - 10;

    // Keep tooltip in viewport
    if (x + rect.width > window.innerWidth - 10) {
      x = data.screenX - rect.width - 16;
    }
    if (y + rect.height > window.innerHeight - 10) {
      y = window.innerHeight - rect.height - 10;
    }
    if (y < 10) y = 10;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }, [data]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-signify-dark text-white rounded-xl shadow-2xl px-4 py-3 pointer-events-none"
      style={{ minWidth: 180 }}
    >
      {/* Lux value badge */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg"
          style={{ backgroundColor: luxToColor(data.lux) }}
        />
        <div>
          <div className="text-xl font-bold">{data.lux} lux</div>
          <div className="text-xs text-gray-400">
            E<sub>h</sub> Horizontal
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="border-t border-white/10 pt-2 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-gray-400">Position X</div>
        <div className="text-right font-mono">{data.x.toFixed(1)} m</div>
        <div className="text-gray-400">Position Y</div>
        <div className="text-right font-mono">{data.y.toFixed(1)} m</div>
        {data.point.ev != null && data.point.ev > 0 && (
          <>
            <div className="text-gray-400">E<sub>v</sub> Vertikal</div>
            <div className="text-right font-mono">{data.point.ev} lux</div>
          </>
        )}
      </div>
    </div>
  );
}
