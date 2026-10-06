import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Mic2, RefreshCw, ExternalLink, Radio, Check } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ isOpen, onClose }) => {
  const { currentTrack, lyrics, isLoadingLyrics, currentTime, duration, seek, fetchLyrics } =
    usePlayer();
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Active artist string helper
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
      isOpen &&
      activeLineIndex >= 0 &&
      activeLineRef.current &&
      !isUserScrolling &&
      containerRef.current
    ) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, isUserScrolling, isOpen]);

  // Detect manual user scrolling
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

  if (!isOpen) return null;

  const isSynced = lyrics?.syncAvailable || lyrics?.type === 'synced';

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0B0D15]/95 backdrop-blur-3xl border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">Lyrics</h3>
          {isSynced && (
            <span className="text-[10px] text-cyan-400 font-medium tracking-wide flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Synced
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
          aria-label="Close lyrics"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Track Header Details */}
      {currentTrack && (
        <div className="px-6 pt-4 pb-2 border-b border-white/[0.04] flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-3">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-white/40 truncate mt-0.5">{artistName}</p>
          </div>
          {isUserScrolling && lyrics?.lines && lyrics.lines.length > 0 && (
            <button
              onClick={handleResumeSync}
              className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-full transition-all shrink-0 flex items-center gap-1"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              Sync
            </button>
          )}
        </div>
      )}

      {/* Lyrics body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-center custom-scrollbar relative"
      >
        {isLoadingLyrics ? (
          <div className="my-auto flex flex-col items-center gap-3 text-white/40">
            <span className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-mono">Synchronizing lyrics...</p>
          </div>
        ) : lyrics?.lines && lyrics.lines.length > 0 ? (
          <div className="flex flex-col gap-5 py-8">
            {lyrics.lines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const hasTimestamp = typeof line.startMs === 'number';

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => {
                    if (hasTimestamp && line.startMs !== undefined) {
                      seek(line.startMs / 1000);
                      setIsUserScrolling(false);
                    }
                  }}
                  className={`transition-all duration-300 px-3 py-1.5 rounded-xl ${
                    hasTimestamp ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isActive
                      ? 'text-white font-bold text-lg sm:text-xl scale-105 bg-white/[0.04] shadow-sm'
                      : 'text-white/40 hover:text-white/70 text-sm sm:text-base font-medium'
                  }`}
                >
                  <p className="leading-relaxed tracking-normal">{line.text}</p>
                </div>
              );
            })}
          </div>
        ) : (
          /* Graceful Fallback State */
          <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 text-cyan-400/60 shadow-xl">
              <Mic2 className="w-8 h-8 opacity-40" />
            </div>

            <h4 className="text-base font-bold text-white mb-1">Lyrics Unavailable</h4>
            <p className="text-xs text-white/40 max-w-xs mb-6 leading-relaxed">
              Official lyrics could not be synchronized for this track. You can retry retrieval or search online.
            </p>

            {/* Fallback track info card */}
            {currentTrack && (
              <div className="w-full max-w-xs p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6 text-left">
                <div className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-2">
                  Track Information
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
                    <p className="text-[11px] text-white/40 truncate">{artistName}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={handleRetryLyrics}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Fetching
              </button>

              {currentTrack && (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    `${currentTrack.title} ${artistName} lyrics`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium border border-white/[0.05] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Search Lyrics on Google
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
