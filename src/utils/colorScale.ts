/**
 * Maps a lux value to an RGB color using the heatmap gradient.
 * Gradient: brown (low) → orange → yellow → light green → green (high)
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

const GRADIENT_STOPS: { value: number; color: RGB }[] = [
  { value: 0,   color: { r: 139, g: 69,  b: 19  } }, // brown
  { value: 60,  color: { r: 180, g: 83,  b: 9   } }, // dark orange
  { value: 75,  color: { r: 217, g: 119, b: 6   } }, // orange
  { value: 85,  color: { r: 234, g: 179, b: 8   } }, // yellow
  { value: 95,  color: { r: 132, g: 204, b: 22  } }, // lime
  { value: 110, color: { r: 34,  g: 197, b: 94  } }, // green
  { value: 130, color: { r: 21,  g: 128, b: 61  } }, // dark green
  { value: 200, color: { r: 21,  g: 128, b: 61  } }, // dark green (clamp)
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function luxToColor(lux: number): string {
  if (lux <= GRADIENT_STOPS[0].value) {
    const c = GRADIENT_STOPS[0].color;
    return `rgb(${c.r}, ${c.g}, ${c.b})`;
  }

  for (let i = 1; i < GRADIENT_STOPS.length; i++) {
    if (lux <= GRADIENT_STOPS[i].value) {
      const prev = GRADIENT_STOPS[i - 1];
      const curr = GRADIENT_STOPS[i];
      const t = (lux - prev.value) / (curr.value - prev.value);

      const r = Math.round(lerp(prev.color.r, curr.color.r, t));
      const g = Math.round(lerp(prev.color.g, curr.color.g, t));
      const b = Math.round(lerp(prev.color.b, curr.color.b, t));

      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color;
  return `rgb(${last.r}, ${last.g}, ${last.b})`;
}

/**
 * Returns contrasting text color (white or dark) for readability
 */
export function textColorForLux(lux: number): string {
  // Parse the rgb color to check luminance
  if (lux < 75) return '#FFFFFF';
  if (lux > 120) return '#FFFFFF';
  return '#1A1A2E'; // dark text on yellow/lime backgrounds
}

/**
 * Reconfigure gradient stops for a different range (e.g. different sport class)
 */
export function createGradient(min: number, max: number) {
  return {
    luxToColor: (lux: number) => luxToColor(lux),
    textColor: (lux: number) => textColorForLux(lux),
    min,
    max,
  };
}
