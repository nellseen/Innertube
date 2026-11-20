import React from 'react';
import {
  Compass,
  Flame,
  Search,
  Library,
  Heart,
  History,
  PlusCircle,
  ListMusic,
  Sparkles,
  Waves,
  Palette,
  Guitar,
} from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';
import { useLibrary } from '../../contexts/LibraryContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { usePlayer } from '../../contexts/PlayerContext.js';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onCreatePlaylist: () => void;
  onOpenAbout?: () => void;
  onOpenTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onCreatePlaylist,
  onOpenAbout,
  onOpenTheme,
}) => {
  const { favorites, history, playlists } = useLibrary();
  const { themeConfig } = useTheme();
  const { currentTrack } = usePlayer();

  const isCurrent = (name: string, tab?: string) => {
    if (currentPage.name !== name) return false;
    if (name === 'library' && tab) {
      return (currentPage as any).tab === tab;
    }
    return true;
  };

  return (
    <aside className="relative z-10 w-60 h-full hidden md:flex flex-col shrink-0 select-none">
      {/* Appearance container */}
      <div className="flex-1 flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] overflow-hidden px-4 py-5">
        {/* Brand Header */}
        <button
          type="button"
          onClick={onOpenAbout}
          aria-label="About Aetheria"
          className="w-full text-left flex items-center gap-3 px-2 py-3 mb-2 cursor-pointer group rounded-xl hover:bg-white/[0.04] transition-colors"
          title="About Aetheria"
        >
          <div className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden">
            <div className="w-full h-full bg-[var(--bg-surface)] rounded-[11px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://files.catbox.moe/91lpa1.webp';
                }}
                alt="Aetheria"
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white">
              Aetheria
            </h1>
            <p className="text-[10px] text-white/45 uppercase tracking-widest font-mono">
              Music player
            </p>
          </div>
        </button>

        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1 mb-5" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'home' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isCurrent('home')
                ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Compass
              className="w-4 h-4"
              style={{ color: isCurrent('home') ? themeConfig.accentPrimary : undefined }}
            />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'trending' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isCurrent('trending')
                ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Flame
              className="w-4 h-4"
              style={{ color: isCurrent('trending') ? '#f43f5e' : undefined }}
            />
            <span>Trending</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'search' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isCurrent('search')
                ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Search
              className="w-4 h-4"
              style={{ color: isCurrent('search') ? themeConfig.accentPrimary : undefined }}
            />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'scene' })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isCurrent('scene')
                ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Waves
              className="w-4 h-4"
              style={{ color: isCurrent('scene') ? themeConfig.accentSecondary : undefined }}
            />
            <span>Media Scene</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ name: 'chords', song: currentTrack || undefined })}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isCurrent('chords')
                ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Guitar
              className="w-4 h-4"
              style={{ color: isCurrent('chords') ? '#fbbf24' : undefined }}
            />
            <span>Chord & Lirik</span>
          </button>
        </nav>

        {/* Library Section */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/[0.08] pt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              My Library
            </span>
            <button
              onClick={onCreatePlaylist}
              type="button"
              className="p-1.5 rounded-xl glass-pill text-white/50 hover:text-white transition-colors"
              title="Buat Playlist Baru"
              aria-label="Buat Playlist Baru"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'library', tab: 'favorites' })}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isCurrent('library', 'favorites')
                  ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                <span>Favorites</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">{favorites.length}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ name: 'library', tab: 'history' })}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isCurrent('library', 'history')
                  ? 'bg-white/[0.06] text-white border-l-2 border-[var(--accent-primary)]'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>History</span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">{history.length}</span>
            </button>
          </div>

          {/* User Playlists List */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5 custom-scrollbar">
            {playlists.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[11px] text-white/35">Belum ada playlist</p>
                <button
                  type="button"
                  onClick={onCreatePlaylist}
                  className="mt-2 text-xs font-semibold text-[var(--accent-primary)] hover:text-white transition-colors"
                >
                  + Create playlist
                </button>
              </div>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => onNavigate({ name: 'library', tab: 'playlists' })}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors truncate text-left"
                >
                  <ListMusic className="w-3.5 h-3.5 shrink-0 text-white/40" />
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Preferences and information */}
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2">
          {onOpenTheme && (
            <button
              type="button"
              onClick={onOpenTheme}
              className="flex items-center justify-between px-3 py-2 rounded-lg glass-pill text-white/70 hover:text-white text-xs font-medium transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Palette
                  className="w-3.5 h-3.5 transition-transform group-hover:rotate-12"
                  style={{ color: themeConfig.accentPrimary }}
                />
                <span>Theme</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-white/50">
                <span
                  className="w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: themeConfig.accentPrimary }}
                />
                <span className="truncate max-w-[80px]">{themeConfig.name}</span>
              </span>
            </button>
          )}

          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="flex items-center justify-between px-3 py-2 rounded-lg glass-pill text-white/60 hover:text-white text-xs font-medium transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] transition-transform" />
                <span>About Aetheria</span>
              </div>
              <span className="text-[10px] text-white/40">@nellseen</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
