import React from 'react';
import { Compass, Flame, Search, Library, Guitar } from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';

interface MobileNavProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  const { currentTrack } = usePlayer();
  const { themeConfig } = useTheme();

  const tabs = [
    { name: 'home', label: 'Discover', icon: Compass },
    { name: 'trending', label: 'Trending', icon: Flame },
    { name: 'search', label: 'Search', icon: Search },
    { name: 'chords', label: 'Chords', icon: Guitar },
    { name: 'library', label: 'Library', icon: Library },
  ];

  return (
    <div className="md:hidden fixed bottom-2 left-3 right-3 z-40 pb-safe pointer-events-none flex justify-center">
      <nav
        aria-label="Mobile Navigation Dock"
        className="glass-dock pointer-events-auto w-full max-w-md h-16 rounded-3xl px-2 flex items-center justify-around select-none shadow-[0_12px_36px_rgba(0,0,0,0.65)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage.name === tab.name;

          return (
            <button
              key={tab.name}
              type="button"
              aria-label={tab.label}
              onClick={() => {
                if (tab.name === 'chords') {
                  onNavigate({ name: 'chords', song: currentTrack || undefined });
                } else {
                  onNavigate({ name: tab.name as any });
                }
              }}
              className={`relative flex flex-col items-center justify-center min-w-[56px] h-12 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {/* Active Liquid Glass Pill Indicator */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-2xl bg-white/[0.1] border border-white/[0.18] shadow-inner transition-all duration-300"
                  style={{
                    boxShadow: `0 0 16px ${themeConfig.accentGlow || 'rgba(6, 182, 212, 0.2)'}`,
                  }}
                />
              )}

              <Icon
                className={`w-5 h-5 relative z-10 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
                style={{
                  color: isActive ? themeConfig.accentPrimary : undefined,
                }}
              />
              <span
                className={`text-[10px] font-medium tracking-tight mt-0.5 relative z-10 transition-colors ${
                  isActive ? 'font-semibold text-white' : 'text-white/50'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
