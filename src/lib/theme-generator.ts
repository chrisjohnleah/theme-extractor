// Theme generation logic

import {
  type RGB,
  type HSL,
  parseColor,
  rgbToHsl,
  formatHslForShadcn,
  isLightColor,
  colorDistance,
  getLuminance,
} from './color-utils';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ExtractedTheme {
  light: ThemeColors;
  dark: ThemeColors;
  sourceColors: string[];
  colorDetails?: { hex: string; frequency: number; hue: number }[];
}

interface ColorWithFrequency {
  color: RGB;
  hsl: HSL;
  frequency: number;
  hex: string;
}

// Sort colors by their role (light to dark for backgrounds, etc.)
function sortColorsByLuminance(colors: ColorWithFrequency[]): ColorWithFrequency[] {
  return [...colors].sort((a, b) => getLuminance(b.color) - getLuminance(a.color));
}

// Find a foreground color that contrasts well with a background
function findForegroundColor(
  background: RGB,
  colors: ColorWithFrequency[]
): ColorWithFrequency | null {
  const bgIsLight = isLightColor(background);

  // Filter colors by contrast
  const candidates = colors.filter(c => {
    const cIsLight = isLightColor(c.color);
    return cIsLight !== bgIsLight;
  });

  if (candidates.length === 0) return null;

  // Sort by how different they are from the background
  candidates.sort((a, b) => {
    const distA = colorDistance(a.color, background);
    const distB = colorDistance(b.color, background);
    return distB - distA;
  });

  return candidates[0];
}

// Group colors by hue into buckets
function groupColorsByHue(colors: ColorWithFrequency[]): Map<number, ColorWithFrequency[]> {
  const hueGroups = new Map<number, ColorWithFrequency[]>();

  for (const color of colors) {
    // Skip very desaturated colors (grays)
    if (color.hsl.s < 15) continue;
    // Skip very dark or very light colors
    if (color.hsl.l < 15 || color.hsl.l > 90) continue;

    // Group hues into 30-degree buckets (12 buckets total)
    const hueBucket = Math.round(color.hsl.h / 30) * 30 % 360;

    if (!hueGroups.has(hueBucket)) {
      hueGroups.set(hueBucket, []);
    }
    hueGroups.get(hueBucket)!.push(color);
  }

  return hueGroups;
}

// Check if a color is likely a UI/warning color (red, orange for errors)
function isLikelyUIColor(hsl: HSL): boolean {
  // Red/orange range (0-30 and 330-360) often used for errors/warnings
  const isRedOrange = (hsl.h >= 0 && hsl.h <= 30) || (hsl.h >= 330 && hsl.h <= 360);
  // Only exclude if it's highly saturated (pure red/orange)
  return isRedOrange && hsl.s > 70;
}

// Find the most saturated color (likely the primary/brand color)
function findPrimaryColor(colors: ColorWithFrequency[]): ColorWithFrequency | null {
  // First, try to find the dominant color by grouping similar hues
  const hueGroups = groupColorsByHue(colors);

  if (hueGroups.size === 0) {
    // Fallback to old method if no good candidates
    const candidates = colors.filter(c => c.hsl.s > 20 && c.hsl.l > 15 && c.hsl.l < 85);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.frequency - a.frequency);
    return candidates[0];
  }

  // Score each hue group by total frequency and average saturation
  let bestGroup: { hue: number; colors: ColorWithFrequency[]; score: number } | null = null;

  for (const [hue, groupColors] of hueGroups) {
    const totalFrequency = groupColors.reduce((sum, c) => sum + c.frequency, 0);
    const avgSaturation = groupColors.reduce((sum, c) => sum + c.hsl.s, 0) / groupColors.length;

    // Check if this hue group is likely a UI color
    const avgHsl: HSL = {
      h: hue,
      s: avgSaturation,
      l: groupColors.reduce((sum, c) => sum + c.hsl.l, 0) / groupColors.length,
    };

    // Penalize likely UI colors (reds/oranges) unless they're very frequent
    let uiPenalty = 1;
    if (isLikelyUIColor(avgHsl)) {
      uiPenalty = 0.3; // Reduce score significantly for red/orange
    }

    // Score: frequency is most important, then saturation
    // Frequency weighted at 70%, saturation at 30%
    const score = (totalFrequency * 0.7 + avgSaturation * 0.3) * uiPenalty;

    if (!bestGroup || score > bestGroup.score) {
      bestGroup = { hue, colors: groupColors, score };
    }
  }

  if (!bestGroup) return null;

  // From the best hue group, pick the most frequent color with good saturation
  const groupColors = bestGroup.colors;
  groupColors.sort((a, b) => {
    // Prioritize frequency, then saturation
    const scoreA = a.frequency * 2 + a.hsl.s;
    const scoreB = b.frequency * 2 + b.hsl.s;
    return scoreB - scoreA;
  });

  return groupColors[0];
}

// Find a secondary/accent color (different hue from primary)
function findAccentColor(colors: ColorWithFrequency[], primaryHue: number): ColorWithFrequency | null {
  // Find colors with a different hue from primary (at least 60 degrees away)
  const candidates = colors.filter(c => {
    if (c.hsl.s < 25) return false; // Need some saturation
    if (c.hsl.l < 20 || c.hsl.l > 80) return false; // Not too dark or light

    // Calculate hue distance (accounting for circular nature of hue)
    const hueDiff = Math.abs(c.hsl.h - primaryHue);
    const hueDistance = Math.min(hueDiff, 360 - hueDiff);

    return hueDistance > 60; // At least 60 degrees away from primary
  });

  if (candidates.length === 0) return null;

  // Sort by frequency
  candidates.sort((a, b) => b.frequency - a.frequency);
  return candidates[0];
}

// Generate a muted version of a color
function muteColor(hsl: HSL, lightMode: boolean): HSL {
  if (lightMode) {
    return {
      h: hsl.h,
      s: Math.min(hsl.s * 0.3, 15),
      l: Math.max(hsl.l, 95),
    };
  } else {
    return {
      h: hsl.h,
      s: Math.min(hsl.s * 0.3, 15),
      l: Math.min(hsl.l, 15),
    };
  }
}

// Generate a border color from background
function generateBorderColor(backgroundHsl: HSL, lightMode: boolean): HSL {
  if (lightMode) {
    return {
      h: backgroundHsl.h,
      s: Math.min(backgroundHsl.s + 10, 40),
      l: Math.max(backgroundHsl.l - 10, 85),
    };
  } else {
    return {
      h: backgroundHsl.h,
      s: Math.min(backgroundHsl.s + 10, 40),
      l: Math.min(backgroundHsl.l + 15, 25),
    };
  }
}

// Generate theme from extracted colors
export function generateTheme(colorStrings: string[]): ExtractedTheme {
  // Parse and deduplicate colors
  const colorMap = new Map<string, ColorWithFrequency>();

  for (const colorStr of colorStrings) {
    const rgb = parseColor(colorStr);
    if (!rgb) continue;

    const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    const hsl = rgbToHsl(rgb);

    if (colorMap.has(hex)) {
      const existing = colorMap.get(hex)!;
      existing.frequency += 1;
    } else {
      colorMap.set(hex, {
        color: rgb,
        hsl,
        frequency: 1,
        hex,
      });
    }
  }

  const colors = Array.from(colorMap.values());
  const sortedByLuminance = sortColorsByLuminance(colors);

  // Find key colors
  const lightestColors = sortedByLuminance.slice(0, Math.ceil(sortedByLuminance.length / 3));
  const darkestColors = sortedByLuminance.slice(-Math.ceil(sortedByLuminance.length / 3));
  const primaryCandidate = findPrimaryColor(colors);

  // Default colors if extraction fails
  const defaultLight: RGB = { r: 255, g: 255, b: 255 };
  const defaultDark: RGB = { r: 9, g: 9, b: 11 };
  const defaultPrimary: RGB = { r: 24, g: 24, b: 27 };

  // Select background colors
  const lightBackground = lightestColors[0]?.color || defaultLight;
  const darkBackground = darkestColors[darkestColors.length - 1]?.color || defaultDark;

  // Select foreground colors
  const lightForeground = findForegroundColor(lightBackground, colors)?.color || defaultDark;
  const darkForeground = findForegroundColor(darkBackground, colors)?.color || defaultLight;

  // Select primary color
  const primary = primaryCandidate?.color || defaultPrimary;
  const primaryHsl = rgbToHsl(primary);

  // Generate secondary color (desaturated primary)
  const secondaryHsl: HSL = {
    h: primaryHsl.h,
    s: Math.max(primaryHsl.s * 0.3, 10),
    l: 96,
  };
  const secondaryDarkHsl: HSL = {
    h: primaryHsl.h,
    s: Math.max(primaryHsl.s * 0.3, 10),
    l: 17,
  };

  // Find an accent color (different hue from primary) or generate one
  const accentCandidate = findAccentColor(colors, primaryHsl.h);
  const accentHsl: HSL = accentCandidate
    ? accentCandidate.hsl
    : {
        h: (primaryHsl.h + 180) % 360, // Complementary color if no accent found
        s: Math.min(primaryHsl.s, 60),
        l: primaryHsl.l,
      };

  // Muted colors
  const mutedLightHsl = muteColor(rgbToHsl(lightBackground), true);
  const mutedDarkHsl = muteColor(rgbToHsl(darkBackground), false);

  // Border colors
  const borderLightHsl = generateBorderColor(rgbToHsl(lightBackground), true);
  const borderDarkHsl = generateBorderColor(rgbToHsl(darkBackground), false);

  // Muted foreground
  const mutedForegroundLightHsl: HSL = { h: primaryHsl.h, s: 16, l: 47 };
  const mutedForegroundDarkHsl: HSL = { h: primaryHsl.h, s: 20, l: 65 };

  // Primary foreground (contrasting with primary)
  const primaryForegroundHsl: HSL = isLightColor(primary)
    ? { h: primaryHsl.h, s: Math.min(primaryHsl.s, 50), l: 10 }
    : { h: primaryHsl.h, s: Math.min(primaryHsl.s, 50), l: 98 };

  const light: ThemeColors = {
    background: formatHslForShadcn(rgbToHsl(lightBackground)),
    foreground: formatHslForShadcn(rgbToHsl(lightForeground)),
    card: formatHslForShadcn(rgbToHsl(lightBackground)),
    cardForeground: formatHslForShadcn(rgbToHsl(lightForeground)),
    popover: formatHslForShadcn(rgbToHsl(lightBackground)),
    popoverForeground: formatHslForShadcn(rgbToHsl(lightForeground)),
    primary: formatHslForShadcn(primaryHsl),
    primaryForeground: formatHslForShadcn(primaryForegroundHsl),
    secondary: formatHslForShadcn(secondaryHsl),
    secondaryForeground: formatHslForShadcn(primaryHsl),
    muted: formatHslForShadcn(mutedLightHsl),
    mutedForeground: formatHslForShadcn(mutedForegroundLightHsl),
    accent: formatHslForShadcn(accentHsl),
    accentForeground: formatHslForShadcn(primaryHsl),
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: formatHslForShadcn(borderLightHsl),
    input: formatHslForShadcn(borderLightHsl),
    ring: formatHslForShadcn(primaryHsl),
  };

  // Dark theme - invert relationships
  const darkPrimaryHsl: HSL = {
    h: primaryHsl.h,
    s: primaryHsl.s,
    l: Math.min(primaryHsl.l + 20, 90),
  };

  const dark: ThemeColors = {
    background: formatHslForShadcn(rgbToHsl(darkBackground)),
    foreground: formatHslForShadcn(rgbToHsl(darkForeground)),
    card: formatHslForShadcn(rgbToHsl(darkBackground)),
    cardForeground: formatHslForShadcn(rgbToHsl(darkForeground)),
    popover: formatHslForShadcn(rgbToHsl(darkBackground)),
    popoverForeground: formatHslForShadcn(rgbToHsl(darkForeground)),
    primary: formatHslForShadcn(darkPrimaryHsl),
    primaryForeground: formatHslForShadcn({ h: primaryHsl.h, s: 50, l: 10 }),
    secondary: formatHslForShadcn(secondaryDarkHsl),
    secondaryForeground: formatHslForShadcn(darkPrimaryHsl),
    muted: formatHslForShadcn(mutedDarkHsl),
    mutedForeground: formatHslForShadcn(mutedForegroundDarkHsl),
    accent: formatHslForShadcn({ ...accentHsl, l: Math.min(accentHsl.l + 10, 80) }),
    accentForeground: formatHslForShadcn(darkPrimaryHsl),
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: formatHslForShadcn(borderDarkHsl),
    input: formatHslForShadcn(borderDarkHsl),
    ring: formatHslForShadcn({ h: primaryHsl.h, s: 27, l: 84 }),
  };

  // Sort colors by frequency for display, filter out pure blacks/whites/grays
  const sortedColors = colors
    .filter(c => c.hsl.s > 10 || (c.hsl.l > 5 && c.hsl.l < 95))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 12);

  return {
    light,
    dark,
    sourceColors: sortedColors.map(c => c.hex),
    colorDetails: sortedColors.map(c => ({
      hex: c.hex,
      frequency: c.frequency,
      hue: Math.round(c.hsl.h),
    })),
  };
}

// Generate CSS output for shadcn
export function generateCSSOutput(theme: ExtractedTheme): string {
  const formatThemeVars = (colors: ThemeColors, prefix: string = '') => {
    const indent = prefix ? '    ' : '  ';
    return `${indent}--background: ${colors.background};
${indent}--foreground: ${colors.foreground};
${indent}--card: ${colors.card};
${indent}--card-foreground: ${colors.cardForeground};
${indent}--popover: ${colors.popover};
${indent}--popover-foreground: ${colors.popoverForeground};
${indent}--primary: ${colors.primary};
${indent}--primary-foreground: ${colors.primaryForeground};
${indent}--secondary: ${colors.secondary};
${indent}--secondary-foreground: ${colors.secondaryForeground};
${indent}--muted: ${colors.muted};
${indent}--muted-foreground: ${colors.mutedForeground};
${indent}--accent: ${colors.accent};
${indent}--accent-foreground: ${colors.accentForeground};
${indent}--destructive: ${colors.destructive};
${indent}--destructive-foreground: ${colors.destructiveForeground};
${indent}--border: ${colors.border};
${indent}--input: ${colors.input};
${indent}--ring: ${colors.ring};`;
  };

  return `@layer base {
  :root {
${formatThemeVars(theme.light)}
    --radius: 0.5rem;
  }

  .dark {
${formatThemeVars(theme.dark, '  ')}
  }
}`;
}

// Generate theme from RGB colors (for image extraction)
export function generateThemeFromRGB(colors: RGB[]): ExtractedTheme {
  const colorStrings = colors.map(
    c => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
  );
  return generateTheme(colorStrings);
}
