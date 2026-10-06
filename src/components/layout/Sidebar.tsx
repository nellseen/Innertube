import React from 'react';
import {
  Compass,
  Flame,
  Search,
  Library,
  Heart,
  History,
  PlusCircle,
  Music2,
  ListMusic,
} from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';
import { useLibrary } from '../../contexts/LibraryContext.js';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onCreatePlaylist,
}) => {
  const { favorites, history, playlists } = useLibrary();

  const isCurrent = (name: string, tab?: string) => {
    if (currentPage.name !== name) return false;
    if (name === 'library' && tab) {
      return (currentPage as any).tab === tab;
    }
    return true;
  };

  return (
    <aside className="w-64 h-full hidden md:flex flex-col shrink-0 p-4 select-none">
      {/* Glass container */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0D0F18] rounded-[14px] flex items-center justify-center">
              <Music2 className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
              Aetheria
            </h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
              Lossless Glass
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1 mb-6">
          <button
            onClick={() => onNavigate({ name: 'home' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
              isCurrent('home')
                ? 'bg-white/10 text-white border border-white/15 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Compass className={`w-4 h-4 ${isCurrent('home') ? 'text-cyan-400' : ''}`} />
            Discover
          </button>

          <button
            onClick={() => onNavigate({ name: 'trending' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
              isCurrent('trending')
                ? 'bg-white/10 text-white border border-white/15 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Flame className={`w-4 h-4 ${isCurrent('trending') ? 'text-rose-400' : ''}`} />
            Trending
          </button>

          <button
            onClick={() => onNavigate({ name: 'search' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
              isCurrent('search')
                ? 'bg-white/10 text-white border border-white/15 shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Search className={`w-4 h-4 ${isCurrent('search') ? 'text-cyan-400' : ''}`} />
            Search
          </button>
        </nav>

        {/* Library Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              My Library
            </span>
            <button
              onClick={onCreatePlaylist}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Create Playlist"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <button
              onClick={() => onNavigate({ name: 'library', tab: 'favorites' })}
              className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-medium transition-all ${
                isCurrent('library', 'favorites')
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                Favorites
              </div>
              <span className="text-[10px] text-white/30 font-mono">{favorites.length}</span>
            </button>

            <button
              onClick={() => onNavigate({ name: 'library', tab: 'history' })}
              className={`flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-medium transition-all ${
                isCurrent('library', 'history')
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                History
              </div>
              <span className="text-[10px] text-white/30 font-mono">{history.length}</span>
            </button>
          </div>

          {/* User Playlists */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5 custom-scrollbar">
            {playlists.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-white/30">No playlists yet</p>
                <button
                  onClick={onCreatePlaylist}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  + Create first playlist
                </button>
              </div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => onNavigate({ name: 'library', tab: 'playlists' })}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors truncate text-left"
                >
                  <ListMusic className="w-3.5 h-3.5 shrink-0 text-white/40" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between px-2 text-[10px] text-white/30 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Innertube v18
          </span>
          <span>Dual Audio</span>
        </div>
      </div>
    </aside>
  );
};
