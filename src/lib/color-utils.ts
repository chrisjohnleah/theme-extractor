// Color conversion and manipulation utilities

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// Parse any color format to RGB
export function parseColor(color: string): RGB | null {
  color = color.trim().toLowerCase();

  // Hex format
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // RGB format
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // HSL format
  const hslMatch = color.match(/hsla?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%?,\s*(\d+(?:\.\d+)?)%?/);
  if (hslMatch) {
    return hslToRgb({
      h: parseFloat(hslMatch[1]),
      s: parseFloat(hslMatch[2]),
      l: parseFloat(hslMatch[3]),
    });
  }

  // Named colors (common ones)
  const namedColors: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    transparent: '#00000000',
  };

  if (namedColors[color]) {
    return hexToRgb(namedColors[color]);
  }

  return null;
}

// Hex to RGB conversion
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  // Handle shorthand hex (#fff)
  const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (shortResult) {
    return {
      r: parseInt(shortResult[1] + shortResult[1], 16),
      g: parseInt(shortResult[2] + shortResult[2], 16),
      b: parseInt(shortResult[3] + shortResult[3], 16),
    };
  }

  return null;
}

// RGB to Hex conversion
export function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

// RGB to HSL conversion
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360 * 10) / 10,
    s: Math.round(s * 100 * 10) / 10,
    l: Math.round(l * 100 * 10) / 10,
  };
}

// HSL to RGB conversion
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Format HSL for shadcn (without hsl() wrapper, just values)
export function formatHslForShadcn(hsl: HSL): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

// Calculate color luminance (for contrast calculations)
export function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if a color is light or dark
export function isLightColor(rgb: RGB): boolean {
  return getLuminance(rgb) > 0.5;
}

// Color distance (Euclidean in RGB space)
export function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// Extract all colors from CSS text
export function extractColorsFromCSS(css: string): string[] {
  const colorPatterns = [
    /#[a-fA-F0-9]{6}\b/g,
    /#[a-fA-F0-9]{3}\b/g,
    /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi,
    /hsla?\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/gi,
  ];

  const colors = new Set<string>();

  for (const pattern of colorPatterns) {
    const matches = css.match(pattern);
    if (matches) {
      matches.forEach(match => colors.add(match.toLowerCase()));
    }
  }

  return Array.from(colors);
}

// Median cut color quantization for image analysis
export interface ColorBucket {
  colors: RGB[];
  count: number;
}

export function medianCutQuantize(pixels: RGB[], maxColors: number = 8): RGB[] {
  if (pixels.length === 0) return [];

  const buckets: ColorBucket[] = [{ colors: pixels, count: pixels.length }];

  while (buckets.length < maxColors) {
    // Sort buckets by count and pick the largest
    buckets.sort((a, b) => b.count - a.count);
    const bucket = buckets[0];

    if (bucket.colors.length < 2) break;

    // Find the channel with the largest range
    let rMin = 255, rMax = 0;
    let gMin = 255, gMax = 0;
    let bMin = 255, bMax = 0;

    for (const color of bucket.colors) {
      rMin = Math.min(rMin, color.r);
      rMax = Math.max(rMax, color.r);
      gMin = Math.min(gMin, color.g);
      gMax = Math.max(gMax, color.g);
      bMin = Math.min(bMin, color.b);
      bMax = Math.max(bMax, color.b);
    }

    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;

    let sortKey: keyof RGB;
    if (rRange >= gRange && rRange >= bRange) {
      sortKey = 'r';
    } else if (gRange >= rRange && gRange >= bRange) {
      sortKey = 'g';
    } else {
      sortKey = 'b';
    }

    // Sort by the selected channel and split
    bucket.colors.sort((a, b) => a[sortKey] - b[sortKey]);
    const mid = Math.floor(bucket.colors.length / 2);

    const bucket1 = bucket.colors.slice(0, mid);
    const bucket2 = bucket.colors.slice(mid);

    buckets[0] = { colors: bucket1, count: bucket1.length };
    buckets.push({ colors: bucket2, count: bucket2.length });
  }

  // Calculate average color for each bucket
  return buckets.map(bucket => {
    const avg = bucket.colors.reduce(
      (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
      { r: 0, g: 0, b: 0 }
    );
    const count = bucket.colors.length;
    return {
      r: Math.round(avg.r / count),
      g: Math.round(avg.g / count),
      b: Math.round(avg.b / count),
    };
  });
}

// Extract colors from image data
export function extractColorsFromImageData(
  imageData: ImageData,
  sampleRate: number = 10
): RGB[] {
  const pixels: RGB[] = [];
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Skip very dark and very light pixels (often backgrounds)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance < 0.05 || luminance > 0.95) continue;

    pixels.push({ r, g, b });
  }

  return medianCutQuantize(pixels, 16);
}
