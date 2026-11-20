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
  accentGlow?: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyber: {
    id: 'cyber',
    name: 'Studio',
    badge: 'Default',
    description: 'Charcoal surfaces with a restrained chartreuse accent.',
    bgBase: '#11120F',
    bgSurface: '#191A17',
    borderSubtle: '#2D2F29',
    accentPrimary: '#C2D274',
    accentSecondary: '#D8DFBD',
    accentClass: 'text-lime-300',
    glowClass: '',
    gradient: 'from-lime-300 to-lime-300',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian AMOLED',
    badge: 'Pure Black',
    description: 'A darker monochrome palette with soft lavender controls.',
    bgBase: '#101011',
    bgSurface: '#19191B',
    borderSubtle: '#303034',
    accentPrimary: '#B9B8E8',
    accentSecondary: '#D7D6EC',
    accentClass: 'text-violet-300',
    glowClass: '',
    gradient: 'from-violet-300 to-violet-300',
  },
  emerald: {
    id: 'emerald',
    name: 'Moss',
    badge: 'Green',
    description: 'A quiet green accent over deep neutral surfaces.',
    bgBase: '#101310',
    bgSurface: '#181C18',
    borderSubtle: '#2B332B',
    accentPrimary: '#9BC49B',
    accentSecondary: '#CFDFCA',
    accentClass: 'text-emerald-300',
    glowClass: '',
    gradient: 'from-emerald-300 to-emerald-300',
  },
  sunset: {
    id: 'sunset',
    name: 'Clay',
    badge: 'Warm',
    description: 'Warm muted tones for a softer listening room.',
    bgBase: '#15110F',
    bgSurface: '#201A17',
    borderSubtle: '#392D28',
    accentPrimary: '#E1A18A',
    accentSecondary: '#E9C8A8',
    accentClass: 'text-rose-300',
    glowClass: '',
    gradient: 'from-rose-300 to-rose-300',
  },
  titanium: {
    id: 'titanium',
    name: 'Slate',
    badge: 'Cool',
    description: 'Cool slate surfaces with a subtle blue accent.',
    bgBase: '#111315',
    bgSurface: '#191C1F',
    borderSubtle: '#2E3438',
    accentPrimary: '#9DBDC7',
    accentSecondary: '#D0DCE0',
    accentClass: 'text-sky-300',
    glowClass: '',
    gradient: 'from-sky-300 to-sky-300',
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
