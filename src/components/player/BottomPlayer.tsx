import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Mic2,
  Maximize2,
  Sparkles,
  Waves,
  ShieldCheck,
  FastForward,
  X,
  Guitar,
} from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useLibrary } from '../../contexts/LibraryContext.js';

interface BottomPlayerProps {
  onOpenFullscreen: () => void;
  onToggleQueue: () => void;
  onToggleLyrics: () => void;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  onNavigateToArtist?: (artistId: string) => void;
  onNavigateToScene?: () => void;
  onNavigateToChords?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  onOpenFullscreen,
  onToggleQueue,
  onToggleLyrics,
  isQueueOpen,
  isLyricsOpen,
  onNavigateToArtist,
  onNavigateToScene,
  onNavigateToChords,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isBuffering,
    sponsorBlockSegments,
    isSponsorBlockEnabled,
    toggleSponsorBlock,
    sponsorBlockNotice,
    dismissSponsorBlockNotice,
    undoSponsorBlockSkip,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  if (!currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverProgress(pos * duration);
  };

  return (
    <div className="hidden md:flex fixed bottom-3 left-4 right-4 z-50 h-22 rounded-3xl bg-[#090A0F]/85 backdrop-blur-3xl border border-white/[0.1] shadow-[0_12px_48px_rgba(0,0,0,0.6)] items-center px-5 gap-4 select-none">
      {/* SponsorBlock Auto-Skip Toast Notification */}
      {sponsorBlockNotice && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <FastForward className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Skipped {sponsorBlockNotice.category}</span>
          <button
            onClick={undoSponsorBlockSkip}
            className="ml-1 text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
          >
            Undo
          </button>
          <button
            onClick={dismissSponsorBlockNotice}
            className="ml-1 p-0.5 rounded text-amber-300/60 hover:text-white cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Track Info (Left) */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        <div
          onClick={onOpenFullscreen}
          className="relative w-13 h-13 rounded-2xl overflow-hidden shrink-0 bg-white/5 border border-white/10 shadow-md cursor-pointer group"
        >
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="min-w-0 pr-2">
          <h4
            onClick={onOpenFullscreen}
            className="text-sm font-semibold text-white/90 hover:text-white truncate cursor-pointer transition-colors"
          >
            {currentTrack.title}
          </h4>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {((Array.isArray(currentTrack.artists)
              ? currentTrack.artists
              : typeof (currentTrack as any).artist === 'string'
              ? [{ name: (currentTrack as any).artist }]
              : [{ name: 'Unknown Artist' }]) as { id?: string; name: string }[]
            ).map((a, i, arr) => (
              <span
                key={i}
                onClick={() => a.id && onNavigateToArtist && onNavigateToArtist(a.id)}
                className={`hover:text-white/80 transition-colors ${
                  a.id ? 'cursor-pointer hover:underline' : ''
                }`}
              >
                {a.name}
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>

        <button
          onClick={() => toggleFavorite(currentTrack)}
          className={`p-2 rounded-full transition-colors shrink-0 ${
            isFav
              ? 'text-rose-500 hover:text-rose-400'
              : 'text-white/30 hover:text-white/80'
          }`}
          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>
      </div>

      {/* Main Controls & Scrubber (Center) */}
      <div className="flex-1 flex flex-col items-center max-w-2xl px-2">
        {/* Control Buttons */}
        <div className="flex items-center gap-4 mb-1">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
            }`}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={previous}
            className="p-2 rounded-full text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all"
            title="Previous"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-11 h-11 rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center transition-all disabled:opacity-70"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2 rounded-full text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all"
            title="Next"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-cyan-400' : 'text-white/40 hover:text-white/80'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar & Time */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-white/40 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={() => setHoverProgress(null)}
            className="relative flex-1 h-2 group/scrub py-1 cursor-pointer flex items-center"
          >
            {/* Background rail */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative group-hover/scrub:h-1.5 transition-all">
              {/* SponsorBlock Segment Markers */}
              {isSponsorBlockEnabled &&
                duration > 0 &&
                sponsorBlockSegments.map((seg, idx) => (
                  <div
                    key={idx}
                    title={`SponsorBlock: ${seg.category} (${formatTime(seg.start)} - ${formatTime(seg.end)})`}
                    className="absolute top-0 bottom-0 bg-amber-400/80 z-10 pointer-events-none rounded-full"
                    style={{
                      left: `${(seg.start / duration) * 100}%`,
                      width: `${Math.max(0.6, ((seg.end - seg.start) / duration) * 100)}%`,
                    }}
                  />
                ))}

              {/* Loaded bar */}
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Hover thumb */}
            <div
              className="absolute w-3 h-3 rounded-full bg-white shadow-md -translate-x-1/2 opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />

            {/* Hover time tooltip */}
            {hoverProgress !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-[10px] font-mono text-white border border-white/10 shadow pointer-events-none"
                style={{
                  left: `${Math.max(0, Math.min(100, (hoverProgress / (duration || 1)) * 100))}%`,
                }}
              >
                {formatTime(hoverProgress)}
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono text-white/40 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Auxiliary Controls (Right) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Quality indicator */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 font-mono">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>High Quality</span>
        </div>

        {/* SponsorBlock toggle */}
        <button
          onClick={toggleSponsorBlock}
          className={`p-2 rounded-full transition-colors flex items-center justify-center ${
            isSponsorBlockEnabled
              ? sponsorBlockSegments.length > 0
                ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10'
                : 'text-cyan-400/80 hover:text-cyan-300'
              : 'text-white/20 hover:text-white/40'
          }`}
          title={
            isSponsorBlockEnabled
              ? sponsorBlockSegments.length > 0
                ? `SponsorBlock Active (${sponsorBlockSegments.length} non-music segments detected)`
                : 'SponsorBlock Active (Auto-skip non-music segments)'
              : 'SponsorBlock Disabled (Click to enable)'
          }
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Media Scene toggle */}
        {onNavigateToScene && (
          <button
            onClick={onNavigateToScene}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Media Scene Visualizer"
          >
            <Waves className="w-4 h-4 text-purple-400" />
          </button>
        )}

        {/* Chord & Tab toggle */}
        {onNavigateToChords && (
          <button
            onClick={onNavigateToChords}
            className="p-2 rounded-full text-white/40 hover:text-amber-300 hover:bg-white/10 transition-colors"
            title="Chord & Tab Lagu Ini"
          >
            <Guitar className="w-4 h-4 text-amber-400" />
          </button>
        )}

        {/* Lyrics toggle */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-full transition-colors ${
            isLyricsOpen ? 'text-cyan-400 bg-white/10' : 'text-white/40 hover:text-white/80'
          }`}
          title="Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue toggle */}
        <button
          onClick={onToggleQueue}
          className={`p-2 rounded-full transition-colors ${
            isQueueOpen ? 'text-cyan-400 bg-white/10' : 'text-white/40 hover:text-white/80'
          }`}
          title="Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 group/vol">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full text-white/40 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="w-20 h-1 bg-white/15 rounded-full relative cursor-pointer overflow-hidden group-hover/vol:h-1.5 transition-all">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
