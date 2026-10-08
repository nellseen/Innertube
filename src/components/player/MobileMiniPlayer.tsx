import React from 'react';
import { Play, Pause, SkipForward, Guitar } from 'lucide-react';
import type { Song } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { toSafeText } from '../../utils/text.js';

interface MobileMiniPlayerProps {
  onOpenFullscreen: () => void;
  onNavigateToChords?: (song?: Song) => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  onOpenFullscreen,
  onNavigateToChords,
}) => {
  const { currentTrack, isPlaying, isBuffering, currentTime, duration, togglePlay, next } =
    usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const artistDisplay = Array.isArray(currentTrack.artists)
    ? currentTrack.artists
        .map((a: any) => toSafeText(typeof a === 'string' ? a : a?.name || a?.text || a))
        .filter(Boolean)
        .join(', ')
    : typeof (currentTrack as any).artist === 'string'
    ? toSafeText((currentTrack as any).artist)
    : 'Unknown Artist';

  return (
    <div
      onClick={onOpenFullscreen}
      className="md:hidden fixed bottom-14 left-2 right-2 z-40 h-15 rounded-2xl bg-[#0F111A]/90 backdrop-blur-2xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center px-3 gap-3 overflow-hidden select-none active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* Top progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-rose-400"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 shadow-sm">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold text-white truncate">
          {toSafeText(currentTrack.title, 'Unknown Title')}
        </h4>
        <p className="text-[11px] text-white/40 truncate">
          {artistDisplay}
        </p>
      </div>

      {/* Quick Play/Pause & Next */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform"
        >
          {isBuffering ? (
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {onNavigateToChords && (
          <button
            onClick={() => onNavigateToChords(currentTrack)}
            className="p-1.5 rounded-full text-amber-400 hover:text-amber-300 active:scale-95 transition-all"
            title="Chord & Lirik Lagu Ini"
          >
            <Guitar className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={next}
          className="p-1.5 rounded-full text-white/60 hover:text-white active:scale-95 transition-all"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
