import React from 'react';
import { Play, Pause, SkipForward, Guitar } from 'lucide-react';
import type { Song } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
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
  const { themeConfig } = useTheme();

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
      role="region"
      aria-label="Now Playing Mini Player"
      className="md:hidden fixed bottom-20 left-3 right-3 z-40 h-16 rounded-2xl glass-surface shadow-[0_12px_32px_rgba(0,0,0,0.55)] flex items-center px-3 gap-3 overflow-hidden select-none active:scale-[0.99] transition-transform cursor-pointer"
    >
      {/* Top progress indicator with theme gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full transition-all duration-300 rounded-r-full"
          style={{
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${themeConfig.accentPrimary}, ${themeConfig.accentSecondary})`,
          }}
        />
      </div>

      {/* Thumbnail */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 shadow-md">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          className="w-full h-full object-cover"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: themeConfig.accentPrimary }}
            />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-semibold text-white truncate">
          {toSafeText(currentTrack.title, 'Unknown Title')}
        </h4>
        <p className="text-[11px] text-white/50 truncate mt-0.5">
          {artistDisplay}
        </p>
      </div>

      {/* Quick Play/Pause & Actions */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {onNavigateToChords && (
          <button
            onClick={() => onNavigateToChords(currentTrack)}
            type="button"
            className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-amber-400 hover:text-amber-300 active:scale-95 transition-all"
            title="Chord & Lirik Lagu Ini"
            aria-label="Chord & Lirik"
          >
            <Guitar className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={togglePlay}
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          {isBuffering ? (
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={next}
          type="button"
          aria-label="Lagu Berikutnya"
          className="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all"
        >
          <SkipForward className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
