import React, { createContext, useContext, useState, useEffect } from 'react';

export type SceneType = 'stardust' | 'waves' | 'aurora' | 'rain' | 'vinyl';

export interface SceneMeta {
  id: SceneType;
  name: string;
  subtitle: string;
  badge: string;
}

export const SCENES: Record<SceneType, SceneMeta> = {
  stardust: {
    id: 'stardust',
    name: 'Cosmic Stardust',
    subtitle: 'Partikel nebula kosmik reaktif terhadap ritme audio',
    badge: 'Ambient Space',
  },
  waves: {
    id: 'waves',
    name: 'Cyber Neon Waves',
    subtitle: 'Spektrum gelombang sinus harmonik neon cyan & violet',
    badge: 'Synthesizer',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    subtitle: 'Aliran cahaya atmosfer kutub utara yang menenangkan',
    badge: 'Ethereal',
  },
  rain: {
    id: 'rain',
    name: 'Lo-Fi Rain Night',
    subtitle: 'Tetesan hujan pada kaca dengan pantulan lampu kota malam',
    badge: 'Cozy Chill',
  },
  vinyl: {
    id: 'vinyl',
    name: 'Vinyl Turntable',
    subtitle: 'Piringan hitam klasik berputar dengan visual groove piringan',
    badge: 'Retro Lossless',
  },
};

interface SceneContextType {
  activeSceneType: SceneType;
  setActiveSceneType: (type: SceneType) => void;
  isBackgroundActive: boolean;
  setIsBackgroundActive: (active: boolean) => void;
  toggleBackgroundActive: () => void;
  backgroundDim: number;
  setBackgroundDim: (dim: number) => void;
}

const SceneContext = createContext<SceneContextType | null>(null);

const STORAGE_BG_KEY = 'aetheria_scene_bg_active';
const STORAGE_TYPE_KEY = 'aetheria_scene_type';

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSceneType, setActiveSceneTypeState] = useState<SceneType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TYPE_KEY);
      if (saved && saved in SCENES) return saved as SceneType;
    } catch {
      // fallback
    }
    return 'stardust';
  });

  const [isBackgroundActive, setIsBackgroundActiveState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BG_KEY);
      if (saved !== null) return saved === 'true';
    } catch {
      // fallback
    }
    return false;
  });

  const [backgroundDim, setBackgroundDim] = useState<number>(0.7);

  const setActiveSceneType = (type: SceneType) => {
    setActiveSceneTypeState(type);
    try {
      localStorage.setItem(STORAGE_TYPE_KEY, type);
    } catch {
      // ignore
    }
  };

  const setIsBackgroundActive = (active: boolean) => {
    setIsBackgroundActiveState(active);
    try {
      localStorage.setItem(STORAGE_BG_KEY, String(active));
    } catch {
      // ignore
    }
  };

  const toggleBackgroundActive = () => {
    setIsBackgroundActive(!isBackgroundActive);
  };

  return (
    <SceneContext.Provider
      value={{
        activeSceneType,
        setActiveSceneType,
        isBackgroundActive,
        setIsBackgroundActive,
        toggleBackgroundActive,
        backgroundDim,
        setBackgroundDim,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
};

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within SceneProvider');
  }
  return context;
};
