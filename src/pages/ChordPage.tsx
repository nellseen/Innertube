import React from 'react';
import type { NavigationPage, Song } from '../types/music.js';
import { usePlayer } from '../contexts/PlayerContext.js';
import { ChordLyricsViewer } from '../components/chords/ChordLyricsViewer.js';

interface ChordPageProps {
  onNavigate: (page: NavigationPage) => void;
  initialSong?: Song;
  initialQuery?: string;
}

export const ChordPage: React.FC<ChordPageProps> = ({ onNavigate, initialSong, initialQuery }) => {
  const { currentTrack } = usePlayer();
  // Automatically fallback to the currently playing song if none was explicitly requested
  const effectiveSong = initialSong || (!initialQuery ? currentTrack || undefined : undefined);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090F]">
      <ChordLyricsViewer
        initialSong={effectiveSong}
        initialQuery={initialQuery}
        onNavigate={onNavigate}
      />
    </div>
  );
};
