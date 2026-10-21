import React from 'react';
import { Search, Sparkles, Palette } from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';
import { useTheme } from '../../contexts/ThemeContext.js';

interface MobileHeaderProps {
  onSearchClick: () => void;
  currentPage: NavigationPage;
  onOpenAbout?: () => void;
  onOpenTheme?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onSearchClick,
  currentPage,
  onOpenAbout,
  onOpenTheme,
}) => {
  const { themeConfig } = useTheme();

  const getTitle = () => {
    switch (currentPage.name) {
      case 'home':
        return 'Discover';
      case 'trending':
        return 'Trending';
      case 'search':
        return 'Search';
      case 'scene':
        return 'Media Scene';
      case 'chords':
        return 'Chords & Lyrics';
      case 'library':
        return 'Your Library';
      case 'artist':
        return 'Artist';
      case 'album':
        return 'Album';
      case 'playlist':
        return 'Playlist';
      default:
        return 'Aetheria';
    }
  };

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--bg-main)]/75 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.35)] pt-safe">
      <div
        onClick={onOpenAbout}
        className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        title="Lihat Profil Aetheria"
        role="button"
        aria-label="App info"
      >
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-500 p-[1.5px] shrink-0 overflow-hidden shadow-md">
          <div className="w-full h-full bg-[#0D0F18] rounded-[10px] flex items-center justify-center overflow-hidden">
            <img
              src="/logo.webp"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://files.catbox.moe/91lpa1.webp';
              }}
              alt="Aetheria"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight leading-tight">{getTitle()}</h2>
          <p className="text-[10px] text-white/40 font-mono tracking-wider">AETHERIA</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {onOpenTheme && (
          <button
            onClick={onOpenTheme}
            type="button"
            className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
            title="Ganti Tema"
            aria-label="Ganti Tema Tampilan"
          >
            <Palette
              className="w-4 h-4"
              style={{ color: themeConfig.accentPrimary }}
            />
          </button>
        )}
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            type="button"
            className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
            title="About Nell"
            aria-label="Informasi Pengembang Nell"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </button>
        )}
        <button
          onClick={onSearchClick}
          type="button"
          className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
          title="Search"
          aria-label="Cari Lagu atau Artis"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
