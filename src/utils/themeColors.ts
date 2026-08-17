export interface ThemePreset {
  id: string;
  name: string;
  primaryHex: string;
  accentHex: string;
  glowColor: string;
  previewGradient?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    primaryHex: '#f97316',
    accentHex: '#9333ea',
    glowColor: 'rgba(147, 51, 234, 0.5)',
    previewGradient: 'from-purple-600 to-orange-500',
  },
  {
    id: 'azul',
    name: 'Azul',
    primaryHex: '#2196f3',
    accentHex: '#64b5f6',
    glowColor: 'rgba(33, 150, 243, 0.4)',
  },
  {
    id: 'verde',
    name: 'Verde',
    primaryHex: '#4caf50',
    accentHex: '#81c784',
    glowColor: 'rgba(76, 175, 80, 0.4)',
  },
  {
    id: 'laranja',
    name: 'Laranja',
    primaryHex: '#ff9800',
    accentHex: '#ffb74d',
    glowColor: 'rgba(255, 152, 0, 0.4)',
  },
  {
    id: 'vermelho',
    name: 'Vermelho',
    primaryHex: '#f44336',
    accentHex: '#e57373',
    glowColor: 'rgba(244, 67, 54, 0.4)',
  },
  {
    id: 'verde-azulado',
    name: 'Verde-azulado',
    primaryHex: '#009688',
    accentHex: '#4db6ac',
    glowColor: 'rgba(0, 150, 136, 0.4)',
  },
  {
    id: 'rosa',
    name: 'Rosa',
    primaryHex: '#e91e63',
    accentHex: '#f06292',
    glowColor: 'rgba(233, 30, 99, 0.4)',
  },
  {
    id: 'verde-limao',
    name: 'Verde-limão',
    primaryHex: '#cddc39',
    accentHex: '#dce775',
    glowColor: 'rgba(205, 220, 57, 0.4)',
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 249, g: 115, b: 22 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

export function hsvToRgb(h: number, s: number, v: number) {
  h = (h % 360) / 360;
  s = s / 100;
  v = v / 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function generateThemeShades(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, v } = rgbToHsv(r, g, b);

  const rgb400 = hsvToRgb(h, Math.max(0, s - 15), Math.min(100, v + 12));
  const rgb300 = hsvToRgb(h, Math.max(0, s - 30), Math.min(100, v + 25));
  const rgb600 = hsvToRgb(h, Math.min(100, s + 10), Math.max(0, v - 15));
  const rgb700 = hsvToRgb(h, Math.min(100, s + 20), Math.max(0, v - 30));

  return {
    '500': hex,
    '400': rgbToHex(rgb400.r, rgb400.g, rgb400.b),
    '300': rgbToHex(rgb300.r, rgb300.g, rgb300.b),
    '600': rgbToHex(rgb600.r, rgb600.g, rgb600.b),
    '700': rgbToHex(rgb700.r, rgb700.g, rgb700.b),
    glow: `rgba(${r}, ${g}, ${b}, 0.4)`,
    glowSubtle: `rgba(${r}, ${g}, ${b}, 0.15)`,
  };
}

export function applyThemeColor(primaryHex: string) {
  if (typeof document === 'undefined') return;
  const shades = generateThemeShades(primaryHex);
  const root = document.documentElement;

  root.style.setProperty('--color-orange-300', shades['300']);
  root.style.setProperty('--color-orange-400', shades['400']);
  root.style.setProperty('--color-orange-500', shades['500']);
  root.style.setProperty('--color-orange-600', shades['600']);
  root.style.setProperty('--color-orange-700', shades['700']);

  root.style.setProperty('--theme-orange-300', shades['300']);
  root.style.setProperty('--theme-orange-400', shades['400']);
  root.style.setProperty('--theme-orange-500', shades['500']);
  root.style.setProperty('--theme-orange-600', shades['600']);
  root.style.setProperty('--theme-orange-700', shades['700']);

  root.style.setProperty('--accent-color', shades['500']);
  root.style.setProperty('--accent-glow', shades.glow);
  root.style.setProperty('--accent-glow-subtle', shades.glowSubtle);
}

// Auto-apply saved theme on initial script load if in browser
if (typeof window !== 'undefined') {
  try {
    const savedPreset = localStorage.getItem('mbc_theme_preset') || 'default';
    const savedCustomHex = localStorage.getItem('mbc_custom_theme_hex') || '#3396f3';
    if (savedPreset === 'custom' && savedCustomHex) {
      applyThemeColor(savedCustomHex);
    } else {
      const presetObj = THEME_PRESETS.find(p => p.id === savedPreset);
      if (presetObj) {
        applyThemeColor(presetObj.primaryHex);
      }
    }
  } catch {
    // Ignore storage errors
  }
}
