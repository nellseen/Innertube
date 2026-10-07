import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X, Mic2, RefreshCw, ExternalLink, Radio, Languages, Guitar } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { OptimizedLyricsLine } from './OptimizedLyricsLine.js';
import { ChordLyricsViewer } from '../chords/ChordLyricsViewer.js';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// O(log N) binary search for instant timestamp resolution
function getActiveLineIndex(
  lines: Array<{ startMs?: number }>,
  currentMs: number,
  durationSec: number
): number {
  if (!lines || lines.length === 0) return -1;

  const hasTimestamps = lines[0]?.startMs !== undefined || lines[1]?.startMs !== undefined;

  if (hasTimestamps) {
    let low = 0;
    let high = lines.length - 1;
    let result = -1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const start = lines[mid].startMs;
      if (start !== undefined && start <= currentMs) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result >= 0 ? result : 0;
  }

  // Fallback for plain lyrics without timestamps based on song progress
  if (durationSec > 0 && currentMs > 0) {
    const progress = Math.min(1, Math.max(0, currentMs / (durationSec * 1000)));
    return Math.min(lines.length - 1, Math.floor(progress * lines.length));
  }

  return 0;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ isOpen, onClose }) => {
  const { currentTrack, lyrics, isLoadingLyrics, currentTime, duration, seek, fetchLyrics } =
    usePlayer();
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);
  const [showChordSheet, setShowChordSheet] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrolledIndexRef = useRef<number>(-1);
  const isAutoScrollingRef = useRef<boolean>(false);

  // Active artist string helper
  const artistName = useMemo(() => {
    if (!currentTrack) return 'Unknown Artist';
    return Array.isArray(currentTrack.artists)
      ? currentTrack.artists.map((a) => a.name).join(', ')
      : typeof (currentTrack as any).artist === 'string'
      ? (currentTrack as any).artist
      : 'Unknown Artist';
  }, [currentTrack]);

  // Determine active line using binary search
  const activeLineIndex = useMemo(() => {
    if (!lyrics?.lines || lyrics.lines.length === 0) return -1;
    return getActiveLineIndex(lyrics.lines, currentTime * 1000, duration);
  }, [lyrics?.lines, currentTime, duration]);

  // High-performance smooth scroll container directly (No full DOM tree reflows)
  useEffect(() => {
    if (!isOpen || activeLineIndex < 0 || isUserScrolling || !containerRef.current) return;

    // Only scroll if the active line actually changed
    if (activeLineIndex === lastScrolledIndexRef.current) return;
    lastScrolledIndexRef.current = activeLineIndex;

    const container = containerRef.current;
    const activeEl = container.querySelector(`[data-index="${activeLineIndex}"]`) as HTMLElement;

    if (activeEl) {
      isAutoScrollingRef.current = true;
      const targetTop =
        activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });

      // Release auto-scrolling flag after animation completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 350);
    }
  }, [activeLineIndex, isUserScrolling, isOpen]);

  // Detect manual user scrolling from mouse wheel or touch
  const handleUserInteraction = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    setIsUserScrolling(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3500);
  }, []);

  const handleResumeSync = useCallback(() => {
    setIsUserScrolling(false);
    lastScrolledIndexRef.current = -1; // Force immediate re-center
    if (containerRef.current && activeLineIndex >= 0) {
      const activeEl = containerRef.current.querySelector(
        `[data-index="${activeLineIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        const targetTop =
          activeEl.offsetTop - containerRef.current.clientHeight / 2 + activeEl.clientHeight / 2;
        containerRef.current.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth',
        });
      }
    }
  }, [activeLineIndex]);

  const handleSeek = useCallback(
    (startMs: number) => {
      seek(startMs / 1000);
      setIsUserScrolling(false);
      lastScrolledIndexRef.current = -1;
    },
    [seek]
  );

  const handleRetryLyrics = useCallback(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack.id, currentTrack.title, artistName, currentTrack.duration);
    }
  }, [currentTrack, fetchLyrics, artistName]);

  if (!isOpen) return null;

  const isSynced = lyrics?.syncAvailable || lyrics?.type === 'synced';
  const hasTranslation = lyrics?.hasTranslation || lyrics?.lines?.some((l) => !!l.translation);
  const hasRomaji = lyrics?.hasRomaji || lyrics?.lines?.some((l) => !!l.romaji);
  const sourceLabel =
    lyrics?.sourceName ||
    (lyrics?.source === 'netease'
      ? 'NetEase'
      : lyrics?.source === 'lrcget' || lyrics?.source === 'lrclib'
      ? 'LrcGet / LRCLIB'
      : lyrics?.source === 'innertube'
      ? 'YouTube Music'
      : '');

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0B0D15]/95 backdrop-blur-3xl border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">Lyrics</h3>
          {isSynced && (
            <span className="text-[10px] text-cyan-400 font-medium tracking-wide flex items-center gap-1 ml-1 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Synced
            </span>
          )}
          {sourceLabel && (
            <span className="text-[10px] text-white/40 font-mono tracking-tight bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
              {sourceLabel}
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

      {/* Track Header Details & Controls */}
      {currentTrack && (
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0 gap-2 bg-white/[0.01]">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-white/40 truncate mt-0.5">{artistName}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Translation toggle button */}
            {hasTranslation && (
              <button
                onClick={() => setShowTranslation((prev) => !prev)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                  showTranslation
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-white/40 border-white/[0.08] hover:text-white/70'
                }`}
                title="Tampilkan / sembunyikan terjemahan"
              >
                <Languages className="w-3 h-3" />
                <span>Terjemahan</span>
              </button>
            )}

            {/* Romaji toggle button */}
            {hasRomaji && (
              <button
                onClick={() => setShowRomaji((prev) => !prev)}
                className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                  showRomaji
                    ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-white/40 border-white/[0.08] hover:text-white/70'
                }`}
                title="Tampilkan / sembunyikan romaji"
              >
                <span>Romaji</span>
              </button>
            )}

            {/* Chord Sheet toggle button */}
            <button
              onClick={() => setShowChordSheet(true)}
              className="text-[11px] font-medium px-2 py-1 rounded-lg border bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Buka Lembar Chord & Teori Nada"
            >
              <Guitar className="w-3 h-3" />
              <span>Chord</span>
            </button>

            {/* Sync button */}
            {isUserScrolling && lyrics?.lines && lyrics.lines.length > 0 && (
              <button
                onClick={handleResumeSync}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                Sync
              </button>
            )}
          </div>
        </div>
      )}

      {/* Optimized Lyrics Scroll Container */}
      <div
        ref={containerRef}
        onWheel={handleUserInteraction}
        onTouchMove={handleUserInteraction}
        className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3 text-center custom-scrollbar relative"
        style={{
          contain: 'layout style',
          overscrollBehavior: 'contain',
        }}
      >
        {isLoadingLyrics ? (
          <div className="my-auto flex flex-col items-center gap-3 text-white/40">
            <span className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-mono">Synchronizing lyrics...</p>
          </div>
        ) : lyrics?.lines && lyrics.lines.length > 0 ? (
          <div className="flex flex-col gap-2.5 py-8 w-full">
            {lyrics.lines.map((line, idx) => (
              <OptimizedLyricsLine
                key={idx}
                index={idx}
                text={line.text}
                translation={line.translation}
                romaji={line.romaji}
                showTranslation={showTranslation}
                showRomaji={showRomaji}
                hasTimestamp={typeof line.startMs === 'number'}
                startMs={line.startMs}
                isActive={idx === activeLineIndex}
                isLarge={false}
                onSeek={handleSeek}
              />
            ))}
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

      {/* Modal Chord Sheet */}
      {showChordSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[88vh] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#080A11]">
            <ChordLyricsViewer
              songTitle={currentTrack?.title}
              artistName={artistName}
              onClose={() => setShowChordSheet(false)}
            />
          </div>
        </div>
      )}
    </aside>
  );
};
