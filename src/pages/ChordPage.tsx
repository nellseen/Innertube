import React from 'react';
import type { NavigationPage, Song } from '../types/music.js';
import { ChordLyricsViewer } from '../components/chords/ChordLyricsViewer.js';

interface ChordPageProps {
  onNavigate: (page: NavigationPage) => void;
  initialSong?: Song;
  initialQuery?: string;
}

export const ChordPage: React.FC<ChordPageProps> = ({ onNavigate, initialSong, initialQuery }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090F]">
      <ChordLyricsViewer
        initialSong={initialSong}
        initialQuery={initialQuery}
        onNavigate={onNavigate}
      />
    </div>
  );
};
