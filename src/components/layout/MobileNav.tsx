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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none">
      <nav
        aria-label="Mobile navigation"
        className="glass-dock pointer-events-auto flex h-16 w-full items-center border-x-0 border-b-0 border-t border-[var(--border-subtle)] rounded-none px-1 shadow-none"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage.name === tab.name;

          return (
            <button
              key={tab.name}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                if (tab.name === 'chords') {
                  onNavigate({ name: 'chords', song: currentTrack || undefined });
                } else {
                  onNavigate({ name: tab.name as any });
                }
              }}
              className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-white' : 'text-white/45 hover:text-white/80'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-7 rounded-full"
                  style={{ backgroundColor: themeConfig.accentPrimary }}
                />
              )}
              <Icon
                className="h-5 w-5"
                style={{ color: isActive ? themeConfig.accentPrimary : undefined }}
              />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
