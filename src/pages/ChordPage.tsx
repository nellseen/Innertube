import React from 'react';
import type { NavigationPage } from '../types/music.js';
import { ChordLyricsViewer } from '../components/chords/ChordLyricsViewer.js';

interface ChordPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const ChordPage: React.FC<ChordPageProps> = () => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090F]">
      <ChordLyricsViewer />
    </div>
  );
};
