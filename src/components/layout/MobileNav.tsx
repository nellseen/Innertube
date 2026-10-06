import React from 'react';
import { Compass, Flame, Search, Library } from 'lucide-react';
import type { NavigationPage } from '../../types/music.js';

interface MobileNavProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  const tabs = [
    { name: 'home', label: 'Discover', icon: Compass },
    { name: 'trending', label: 'Trending', icon: Flame },
    { name: 'search', label: 'Search', icon: Search },
    { name: 'library', label: 'Library', icon: Library },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090A0F]/85 backdrop-blur-2xl border-t border-white/[0.08] px-6 py-2 pb-safe flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage.name === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onNavigate({ name: tab.name as any })}
            className={`flex flex-col items-center gap-1 py-1 transition-all ${
              isActive ? 'text-cyan-400 scale-105' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
