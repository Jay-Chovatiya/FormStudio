/**
 * Utility to calculate contrast colors and CSS theme variables dynamically based on any background theme color.
 * Replaces hardcoded light/dark classes with dynamic WCAG-compliant contrast styling.
 */

export interface ThemeContrastStyles {
  'background-color'?: string;
  'color'?: string;
  '--fs-text-main'?: string;
  '--fs-text-muted'?: string;
  '--fs-text-subtle'?: string;
  '--fs-border'?: string;
  '--fs-border-hover'?: string;
  '--fs-border-focus'?: string;
  '--fs-surface'?: string;
  '--fs-surface-alt'?: string;
  '--fs-surface-hover'?: string;
  '--fs-bg'?: string;
  '--fs-bg-subtle'?: string;
  [key: string]: string | undefined;
}

/**
 * Returns dynamic contrast styles and CSS custom properties based on any input color.
 * Works seamlessly for light, dark, pastel, or vibrant color hex/rgb inputs.
 */
export function getContrastStyles(color?: string | null): ThemeContrastStyles {
  if (!color) return {};
  const trimmed = color.trim().toLowerCase();

  let r = 0, g = 0, b = 0;
  let parsed = false;

  if (trimmed.startsWith('rgb')) {
    const match = trimmed.match(/\(([^)]+)\)/);
    if (match) {
      const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 3) {
        [r, g, b] = parts;
        parsed = true;
      }
    }
  } else {
    const hex = trimmed.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      parsed = true;
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      parsed = true;
    }
  }

  // Calculate relative luminance (ITU-R standard)
  const isLight = parsed ? (r * 299 + g * 587 + b * 114) / 1000 > 140 : true;

  if (isLight) {
    return {
      'background-color': color,
      'color': '#0f172a',
      '--fs-text-main': '#0f172a',
      '--fs-text-muted': '#475569',
      '--fs-text-subtle': '#64748b',
      '--fs-border': '#cbd5e1',
      '--fs-border-hover': '#94a3b8',
      '--fs-border-focus': '#4f46e5',
      '--fs-surface': '#ffffff',
      '--fs-surface-alt': '#f8fafc',
      '--fs-surface-hover': '#f1f5f9',
      '--fs-bg': '#f8fafc',
      '--fs-bg-subtle': '#f1f5f9',
    };
  }

  return {
    'background-color': color,
    'color': '#f8fafc',
    '--fs-text-main': '#f8fafc',
    '--fs-text-muted': '#94a3b8',
    '--fs-text-subtle': '#64748b',
    '--fs-border': 'rgba(255, 255, 255, 0.15)',
    '--fs-border-hover': 'rgba(129, 140, 248, 0.45)',
    '--fs-border-focus': '#818cf8',
    '--fs-surface': 'rgba(15, 23, 42, 0.78)',
    '--fs-surface-alt': 'rgba(30, 41, 59, 0.7)',
    '--fs-surface-hover': 'rgba(51, 65, 85, 0.65)',
    '--fs-bg': '#090d16',
    '--fs-bg-subtle': 'rgba(30, 41, 59, 0.5)',
  };
}
