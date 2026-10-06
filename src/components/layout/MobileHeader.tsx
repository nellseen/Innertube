import React from 'react';
import { Music2, Search, Sparkles } from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';

interface MobileHeaderProps {
  onSearchClick: () => void;
  currentPage: NavigationPage;
  onOpenAbout?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onSearchClick,
  currentPage,
  onOpenAbout,
}) => {
  const getTitle = () => {
    switch (currentPage.name) {
      case 'home':
        return 'Discover';
      case 'trending':
        return 'Trending';
      case 'search':
        return 'Search';
      case 'library':
        return 'Library';
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
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#090A0F]/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 p-[1px]">
          <div className="w-full h-full bg-[#0D0F18] rounded-[11px] flex items-center justify-center">
            <Music2 className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <h2 className="text-base font-bold text-white tracking-tight">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-cyan-400 hover:text-white transition-colors"
            title="About Nell"
            aria-label="About Nell"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onSearchClick}
          className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          title="Search"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
