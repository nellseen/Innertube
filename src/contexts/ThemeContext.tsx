import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'cyber' | 'obsidian' | 'emerald' | 'sunset' | 'titanium';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  badge: string;
  description: string;
  bgBase: string;
  bgSurface: string;
  borderSubtle: string;
  accentPrimary: string;
  accentSecondary: string;
  accentClass: string;
  glowClass: string;
  gradient: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Glass',
    badge: 'Default',
    description: 'Deep midnight space with glowing cyan & indigo iOS glassmorphism.',
    bgBase: '#090A0F',
    bgSurface: 'rgba(13, 15, 24, 0.75)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    accentPrimary: '#06b6d4',
    accentSecondary: '#6366f1',
    accentClass: 'text-cyan-400',
    glowClass: 'from-cyan-500/15 via-indigo-500/10 to-rose-500/5',
    gradient: 'from-cyan-500 to-indigo-600',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian AMOLED',
    badge: 'Pure Black',
    description: 'Pitch black AMOLED with crisp violet & electric neon glow.',
    bgBase: '#000000',
    bgSurface: 'rgba(10, 10, 12, 0.9)',
    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    accentPrimary: '#a855f7',
    accentSecondary: '#3b82f6',
    accentClass: 'text-purple-400',
    glowClass: 'from-purple-600/15 via-blue-600/10 to-transparent',
    gradient: 'from-purple-500 to-blue-600',
  },
  emerald: {
    id: 'emerald',
    name: 'Aurora Emerald',
    badge: 'Forest Glow',
    description: 'Deep obsidian pine with radiant northern emerald aurora lights.',
    bgBase: '#040E0A',
    bgSurface: 'rgba(6, 20, 15, 0.85)',
    borderSubtle: 'rgba(16, 185, 129, 0.14)',
    accentPrimary: '#10b981',
    accentSecondary: '#14b8a6',
    accentClass: 'text-emerald-400',
    glowClass: 'from-emerald-500/15 via-teal-500/10 to-emerald-900/5',
    gradient: 'from-emerald-400 to-teal-600',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Twilight',
    badge: 'Warm Neon',
    description: 'Velvet plum dusk with vibrant magenta, coral and golden accents.',
    bgBase: '#0D0614',
    bgSurface: 'rgba(22, 10, 32, 0.85)',
    borderSubtle: 'rgba(244, 63, 94, 0.14)',
    accentPrimary: '#f43f5e',
    accentSecondary: '#f97316',
    accentClass: 'text-rose-400',
    glowClass: 'from-rose-500/15 via-orange-500/10 to-amber-500/5',
    gradient: 'from-rose-500 to-orange-500',
  },
  titanium: {
    id: 'titanium',
    name: 'Frost Titanium',
    badge: 'Ice Slate',
    description: 'Modern slate crystal with frosty electric teal & ice blue finish.',
    bgBase: '#0B1120',
    bgSurface: 'rgba(15, 23, 42, 0.85)',
    borderSubtle: 'rgba(56, 189, 248, 0.14)',
    accentPrimary: '#38bdf8',
    accentSecondary: '#818cf8',
    accentClass: 'text-sky-400',
    glowClass: 'from-sky-500/15 via-indigo-500/10 to-cyan-500/5',
    gradient: 'from-sky-400 to-indigo-500',
  },
};

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeId) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'aetheria_theme_choice';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved in THEMES) {
        return saved as ThemeId;
      }
    } catch {
      // safe fallback
    }
    return 'cyber';
  });

  const setTheme = (theme: ThemeId) => {
    if (theme in THEMES) {
      setCurrentThemeState(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    }
  };

  const cycleTheme = () => {
    const keys: ThemeId[] = ['cyber', 'obsidian', 'emerald', 'sunset', 'titanium'];
    const nextIdx = (keys.indexOf(currentTheme) + 1) % keys.length;
    setTheme(keys[nextIdx]);
  };

  // Sync to data-theme attribute and CSS custom properties on document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    document.body.style.backgroundColor = THEMES[currentTheme].bgBase;
    root.style.setProperty('--bg-main', THEMES[currentTheme].bgBase);
    root.style.setProperty('--bg-surface', THEMES[currentTheme].bgSurface);
    root.style.setProperty('--border-subtle', THEMES[currentTheme].borderSubtle);
    root.style.setProperty('--accent-primary', THEMES[currentTheme].accentPrimary);
    root.style.setProperty('--accent-secondary', THEMES[currentTheme].accentSecondary);
  }, [currentTheme]);

  const themeConfig = THEMES[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
