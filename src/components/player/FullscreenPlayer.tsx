import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
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
  Mic2,
  ListMusic,
  Share2,
  RefreshCw,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useLibrary } from '../../contexts/LibraryContext.js';

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isBuffering,
    lyrics,
    isLoadingLyrics,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    playSong,
    removeFromQueue,
    fetchLyrics,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [activeTab, setActiveTab] = useState<'artwork' | 'lyrics' | 'queue'>('artwork');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  const artistName = useMemo(() => {
    if (!currentTrack) return 'Unknown Artist';
    return Array.isArray(currentTrack.artists)
      ? currentTrack.artists.map((a) => a.name).join(', ')
      : typeof (currentTrack as any).artist === 'string'
      ? (currentTrack as any).artist
      : 'Unknown Artist';
  }, [currentTrack]);

  // Determine active lyrics line index
  const activeLineIndex = useMemo(() => {
    if (!lyrics?.lines || lyrics.lines.length === 0) return -1;
    const currentMs = currentTime * 1000;

    const hasTimestamps = lyrics.lines.some((l) => typeof l.startMs === 'number');

    if (hasTimestamps) {
      let index = -1;
      for (let i = 0; i < lyrics.lines.length; i++) {
        const line = lyrics.lines[i];
        if (line.startMs !== undefined && line.startMs <= currentMs) {
          index = i;
        } else if (line.startMs !== undefined && line.startMs > currentMs) {
          break;
        }
      }
      return index >= 0 ? index : 0;
    }

    // Progression estimation for plain lyrics based on duration
    if (duration > 0 && currentTime > 0) {
      const progress = Math.min(1, Math.max(0, currentTime / duration));
      return Math.min(lyrics.lines.length - 1, Math.floor(progress * lyrics.lines.length));
    }

    return 0;
  }, [currentTime, duration, lyrics]);

  // Smooth auto-scroll to active line
  useEffect(() => {
    if (
      activeTab === 'lyrics' &&
      activeLineIndex >= 0 &&
      activeLineRef.current &&
      !isUserScrolling &&
      lyricsContainerRef.current
    ) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, isUserScrolling, activeTab]);

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
  };

  const handleResumeSync = () => {
    setIsUserScrolling(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleRetryLyrics = () => {
    if (currentTrack) {
      fetchLyrics(currentTrack.id, currentTrack.title, artistName, currentTrack.duration);
    }
  };

  if (!isOpen || !currentTrack) return null;

  const isFav = isFavorite(currentTrack.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pos * duration);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07080D]/95 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 select-none overflow-hidden">
      {/* Background ambient glow matching track */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-20 blur-[140px]"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(34, 211, 238, 0.4), rgba(244, 63, 94, 0.2), transparent 70%)`,
          }}
        />
      </div>

      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* View mode pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.06] border border-white/10">
          <button
            onClick={() => setActiveTab('artwork')}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'artwork'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Track
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'lyrics'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mic2 className="w-3 h-3" />
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ListMusic className="w-3 h-3" />
            Queue ({queue.length})
          </button>
        </div>

        <button
          onClick={() => toggleFavorite(currentTrack)}
          className={`p-2 rounded-full transition-colors ${
            isFav ? 'text-rose-500' : 'text-white/60 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>
      </header>

      {/* Center content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full custom-scrollbar">
        {activeTab === 'artwork' && (
          <div className="w-full flex flex-col items-center justify-center gap-6">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center max-w-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-white/50 truncate mt-1">
                {Array.isArray(currentTrack.artists)
                  ? currentTrack.artists.map((a) => a.name).join(', ')
                  : typeof (currentTrack as any).artist === 'string'
                  ? (currentTrack as any).artist
                  : 'Unknown Artist'}
              </p>
              {currentTrack.album && (
                <p className="text-xs text-white/30 truncate mt-0.5">
                  {currentTrack.album.name}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div
            ref={lyricsContainerRef}
            onScroll={handleScroll}
            className="w-full h-full max-h-[500px] overflow-y-auto px-4 py-8 flex flex-col items-center text-center gap-4 custom-scrollbar relative"
          >
            {/* Sync control button when user scrolled away */}
            {isUserScrolling && lyrics?.lines && lyrics.lines.length > 0 && (
              <div className="sticky top-0 z-20 mb-2">
                <button
                  onClick={handleResumeSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                  <span>Resume Sync</span>
                </button>
              </div>
            )}

            {isLoadingLyrics ? (
              <div className="flex flex-col items-center gap-3 text-white/40 my-auto">
                <span className="w-7 h-7 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-sm font-mono">Synchronizing lyrics...</p>
              </div>
            ) : lyrics?.lines && lyrics.lines.length > 0 ? (
              <div className="flex flex-col gap-6 py-10 w-full max-w-2xl">
                {lyrics.lines.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  const hasTimestamp = typeof line.startMs === 'number';

                  return (
                    <div
                      key={idx}
                      ref={isActive ? (activeLineRef as any) : null}
                      onClick={() => {
                        if (hasTimestamp && line.startMs !== undefined) {
                          seek(line.startMs / 1000);
                          setIsUserScrolling(false);
                        }
                      }}
                      className={`transition-all duration-300 px-4 py-2 rounded-2xl ${
                        hasTimestamp ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isActive
                          ? 'text-white font-extrabold text-2xl sm:text-4xl scale-105 bg-white/[0.04] shadow-sm'
                          : 'text-white/40 hover:text-white/70 text-lg sm:text-2xl font-semibold'
                      }`}
                    >
                      <p className="leading-relaxed tracking-normal">{line.text}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Graceful Fallback Card */
              <div className="my-auto py-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 text-cyan-400/60 shadow-xl">
                  <Mic2 className="w-10 h-10 opacity-40" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Lyrics Unavailable</h4>
                <p className="text-xs sm:text-sm text-white/40 max-w-sm mb-6 leading-relaxed">
                  Official lyrics could not be synchronized for this track. You can retry retrieval or search online.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
                  <button
                    onClick={handleRetryLyrics}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Fetching
                  </button>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${currentTrack.title} ${artistName} lyrics`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white text-xs font-medium border border-white/[0.05] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Search Google
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="w-full h-full max-h-[500px] overflow-y-auto flex flex-col gap-2 custom-scrollbar">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-2">
              Playing Next
            </h3>
            {queue.map((song, i) => (
              <div
                key={`${song.id}-${i}`}
                onClick={() => playSong(song, queue, i)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${
                  song.id === currentTrack.id
                    ? 'bg-white/10 border border-white/15'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                  <p className="text-xs text-white/40 truncate">
                    {Array.isArray(song.artists)
                      ? song.artists.map((a) => a.name).join(', ')
                      : typeof (song as any).artist === 'string'
                      ? (song as any).artist
                      : 'Unknown Artist'}
                  </p>
                </div>
                <span className="text-xs font-mono text-white/30">
                  {song.durationFormatted || '0:00'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(i);
                  }}
                  className="p-1 rounded text-white/20 hover:text-rose-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <footer className="w-full max-w-2xl mx-auto px-6 py-6 pb-safe flex flex-col items-center gap-4 border-t border-white/[0.06]">
        {/* Scrubber */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono text-white/40 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressBarClick}
            className="relative flex-1 h-3 cursor-pointer flex items-center group/fullscrub"
          >
            <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden group-hover/fullscrub:h-2 transition-all">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg -translate-x-1/2 opacity-0 group-hover/fullscrub:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-white/40 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? 'text-cyan-400' : 'text-white/40 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={previous}
            className="p-2 text-white/80 hover:text-white active:scale-95 transition-transform"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-16 h-16 rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center transition-all"
          >
            {isBuffering ? (
              <span className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={next}
            className="p-2 text-white/80 hover:text-white active:scale-95 transition-transform"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-cyan-400' : 'text-white/40 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume slider on fullscreen */}
        <div className="w-full max-w-xs flex items-center gap-3 pt-2">
          <button onClick={toggleMute} className="text-white/40 hover:text-white">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
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
      </footer>
    </div>
  );
};
