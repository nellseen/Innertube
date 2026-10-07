import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chord } from 'tonal';
import {
  Music,
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  Edit3,
  Check,
  Sparkles,
  Info,
  X,
  Search,
  Loader2,
  Guitar,
  Disc3,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import type { Song, NavigationPage } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { api } from '../../services/api.js';
import { ChordDetailModal } from './ChordDetailModal.js';
import { ChordPopover } from './ChordPopover.js';
import { playSynthesizedChord, getChordTheory } from './ChordTheory.js';

interface ChordToken {
  chord?: string;
  lyrics: string;
}

interface ParsedLine {
  type: 'section' | 'line';
  title?: string;
  tokens: ChordToken[];
}

interface ChordSongPreset {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  content: string;
  thumbnail?: string;
}

const POPULAR_RECOMMENDATIONS = [
  'Komang - Raim Laode',
  'Akad - Payung Teduh',
  'Laskar Pelangi - Nidji',
  'Aku Yang Pernah Meyakini',
  'Hati-Hati di Jalan - Tulus',
  'Perfect - Ed Sheeran',
  'Yellow - Coldplay',
  'Until I Found You - Stephen Sanchez',
  'Someone Like You - Adele',
];

// Helper interval map for semitone transposition (-11 to +11)
const INTERVAL_MAP: Record<number, string> = {
  1: '2m',
  2: '2M',
  3: '3m',
  4: '3M',
  5: '4P',
  6: '4A',
  7: '5P',
  8: '6m',
  9: '6M',
  10: '7m',
  11: '7M',
  '-1': '-2m',
  '-2': '-2M',
  '-3': '-3m',
  '-4': '-3M',
  '-5': '-4P',
  '-6': '-4A',
  '-7': '-5P',
  '-8': '-6m',
  '-9': '-6M',
  '-10': '-7m',
  '-11': '-7M',
};

function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0 || !chord) return chord;
  const interval = INTERVAL_MAP[semitones];
  if (!interval) return chord;
  try {
    const res = Chord.transpose(chord, interval);
    return res || chord;
  } catch {
    return chord;
  }
}

interface ChordLyricsViewerProps {
  initialContent?: string;
  songTitle?: string;
  artistName?: string;
  initialSong?: Song;
  initialQuery?: string;
  onClose?: () => void;
  onNavigate?: (page: NavigationPage) => void;
  isEmbedded?: boolean;
}

export const ChordLyricsViewer: React.FC<ChordLyricsViewerProps> = ({
  initialContent,
  songTitle = 'Aku Yang Pernah Meyakini',
  artistName = 'Contoh Lagu',
  initialSong,
  initialQuery,
  onClose,
  onNavigate,
  isEmbedded = false,
}) => {
  const { currentTrack, isPlaying, playSong, togglePlay } = usePlayer();

  // Active Song Metadata
  const [currentSongTitle, setCurrentSongTitle] = useState<string>(
    initialSong?.title || songTitle
  );
  const [currentArtistName, setCurrentArtistName] = useState<string>(
    initialSong?.artists?.map((a) => a.name).join(', ') || artistName
  );
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>(
    initialSong?.id
  );
  const [currentThumbnail, setCurrentThumbnail] = useState<string | undefined>(
    initialSong?.thumbnail
  );
  const [originalKey, setOriginalKey] = useState<string>('C');

  // Text content & editor
  const [textInput, setTextInput] = useState<string>(
    initialContent ||
      `[Intro] [C] [G] [Am] [F]

[Verse 1]
[C]Aku yang [Am]pernah meyakini [F]dirimu[G]
[C]Setulus hati [Am]mencoba tuk me[F]mahami[G]
[Em]Namun bila [Am]akhirnya harus [F]begini[G]
[C]Kulepaskan se[Am]gala yang pernah [F]terjadi[G]

[Chorus]
[F]Biar waktu yang kan men[G]jawab semua
[Em]Kisah yang pernah ter[Am]ukir di antara kita
[Dm]Takkan kusesali per[G]temuan yang indah ini
[C]Semoga kau bahagia selalu`
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [transpose, setTranspose] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Popover & Modal state
  const [popoverChord, setPopoverChord] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);
  const [activeModalChord, setActiveModalChord] = useState<string | null>(null);

  // Auto-scroll state with configurable speed
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  // Speed multiplier: 0.5 to 4.0 (1.0 default = ~25px/sec)
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const accumulatedScrollRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Speed presets
  const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];

  // Auto scroll loop using requestAnimationFrame for butter-smooth scrolling
  useEffect(() => {
    if (!isAutoScrolling) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const step = (time: number) => {
      if (lastTimeRef.current !== null && scrollContainerRef.current) {
        const delta = (time - lastTimeRef.current) / 1000; // in seconds
        // Base speed: 28 pixels per second at 1.0x
        const pixelsToScroll = 28 * scrollSpeed * delta;
        accumulatedScrollRef.current += pixelsToScroll;

        if (accumulatedScrollRef.current >= 1) {
          const toAdd = Math.floor(accumulatedScrollRef.current);
          scrollContainerRef.current.scrollTop += toAdd;
          accumulatedScrollRef.current -= toAdd;
        }

        // Check if reached bottom
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 2) {
          setIsAutoScrolling(false);
          lastTimeRef.current = null;
          return;
        }
      }

      lastTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Load chord for a song query or videoId
  const loadChordForSong = async (
    query: string,
    songData?: { id?: string; title?: string; artist?: string; thumbnail?: string }
  ) => {
    setIsSearching(true);
    setSearchError(null);
    setShowSearchResults(false);
    setIsAutoScrolling(false);

    try {
      const res = await api.getChord({
        q: query,
        videoId: songData?.id,
        title: songData?.title,
        artist: songData?.artist,
      });

      if (res && res.success && res.content) {
        setTextInput(res.content);
        setCurrentSongTitle(res.song?.title || songData?.title || query);
        setCurrentArtistName(res.song?.artist || songData?.artist || '');
        setCurrentVideoId(res.song?.id || songData?.id);
        setCurrentThumbnail(res.song?.thumbnail || songData?.thumbnail);
        setOriginalKey(res.originalKey || 'C');
        setTranspose(0);
        setIsEditing(false);
        setPopoverChord(null);

        // Scroll back to top
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      } else {
        setSearchError('Tidak dapat menemukan chord untuk lagu ini.');
      }
    } catch (err: any) {
      console.error('Failed to load chord:', err);
      setSearchError(err?.message || 'Gagal memuat chord lagu.');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger initial query or song if provided
  useEffect(() => {
    if (initialSong) {
      loadChordForSong(initialSong.title, {
        id: initialSong.id,
        title: initialSong.title,
        artist: initialSong.artists?.map((a) => a.name).join(', '),
        thumbnail: initialSong.thumbnail,
      });
    } else if (initialQuery) {
      loadChordForSong(initialQuery);
    }
  }, [initialSong?.id, initialQuery]);

  // Handle Search Input Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search songs first to show results dropdown if multiple, or load directly
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await api.search(searchQuery.trim());
      const foundSongs = res.results?.songs || [];
      if (foundSongs.length > 0) {
        setSearchResults(foundSongs.slice(0, 5));
        setShowSearchResults(true);
        // Automatically select the best match
        const topSong = foundSongs[0];
        await loadChordForSong(searchQuery.trim(), {
          id: topSong.id,
          title: topSong.title,
          artist: topSong.artists?.map((a: { name: string }) => a.name).join(', '),
          thumbnail: topSong.thumbnail,
        });
      } else {
        await loadChordForSong(searchQuery.trim());
      }
    } catch {
      await loadChordForSong(searchQuery.trim());
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSongResult = (song: Song) => {
    setShowSearchResults(false);
    loadChordForSong(song.title, {
      id: song.id,
      title: song.title,
      artist: song.artists?.map((a) => a.name).join(', '),
      thumbnail: song.thumbnail,
    });
  };

  // Handle "Gunakan Lagu Sedang Diputar"
  const handleUseCurrentTrack = () => {
    if (!currentTrack) return;
    loadChordForSong(currentTrack.title, {
      id: currentTrack.id,
      title: currentTrack.title,
      artist: currentTrack.artists?.map((a) => a.name).join(', '),
      thumbnail: currentTrack.thumbnail,
    });
  };

  // Parser: converts raw lines into parsed tokens with chords above lyrics
  const parsedLines = useMemo<ParsedLine[]>(() => {
    const rawLines = textInput.split('\n');
    const result: ParsedLine[] = [];

    const sectionRegex = /^\[(intro|verse|chorus|reff|bridge|outro|interlude|solo|hook|ending|pre-chorus|pre chorus)[^\]]*\]$/i;
    const chordRegex = /\[([^\]]+)\]([^\[]*)/g;

    for (const raw of rawLines) {
      const trimmed = raw.trim();

      if (!trimmed) {
        result.push({ type: 'line', tokens: [{ lyrics: '' }] });
        continue;
      }

      const sectionMatch = trimmed.match(sectionRegex);
      if (sectionMatch) {
        result.push({
          type: 'section',
          title: trimmed.replace(/^\[|\]$/g, ''),
          tokens: [],
        });
        continue;
      }

      const firstBracket = raw.indexOf('[');
      if (firstBracket === -1) {
        result.push({
          type: 'line',
          tokens: [{ lyrics: raw }],
        });
        continue;
      }

      const tokens: ChordToken[] = [];
      if (firstBracket > 0) {
        tokens.push({ lyrics: raw.slice(0, firstBracket) });
      }

      let match: RegExpExecArray | null;
      chordRegex.lastIndex = 0;
      while ((match = chordRegex.exec(raw)) !== null) {
        tokens.push({
          chord: match[1].trim(),
          lyrics: match[2],
        });
      }

      result.push({ type: 'line', tokens });
    }

    return result;
  }, [textInput]);

  // List of all unique chords used in this song
  const uniqueChords = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const line of parsedLines) {
      for (const tok of line.tokens) {
        if (tok.chord) {
          const tChord = transposeChord(tok.chord, transpose);
          set.add(tChord);
        }
      }
    }
    return Array.from(set);
  }, [parsedLines, transpose]);

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-sm'
      : fontSize === 'lg'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';

  const handleChordClick = (chord: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor(rect);
    setPopoverChord(chord);
  };

  const handlePlayCurrentChordSong = () => {
    if (currentVideoId) {
      if (currentTrack?.id === currentVideoId) {
        togglePlay();
      } else {
        const dummySong: Song = {
          id: currentVideoId,
          title: currentSongTitle,
          artists: [{ name: currentArtistName }],
          thumbnail:
            currentThumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
          duration: 200,
        };
        playSong(dummySong);
      }
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#080A11] text-white select-none ${
        isEmbedded ? 'rounded-2xl border border-white/10' : ''
      }`}
    >
      {/* 1. TOP HEADER & INTERACTIVE SEARCH BAR */}
      <div className="flex flex-col border-b border-white/[0.08] bg-white/[0.02]">
        {/* Search Bar Row */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/[0.04]">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 max-w-4xl mx-auto w-full relative"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari lagu untuk chord (cth: Komang, Perfect, Akad, Hati-Hati di Jalan)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.1] focus:border-cyan-400/50 text-sm text-white placeholder-white/30 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-600/50 text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <Guitar className="w-3.5 h-3.5" />
                  <span>Cari Chord</span>
                </>
              )}
            </button>

            {/* Quick button to use current playing song */}
            {currentTrack && (
              <button
                type="button"
                onClick={handleUseCurrentTrack}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-white/80 hover:text-white transition-all shrink-0 cursor-pointer"
                title={`Gunakan lagu yang sedang diputar: ${currentTrack.title}`}
              >
                <Disc3 className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="truncate max-w-[120px]">Lagu Sedang Diputar</span>
              </button>
            )}
          </form>

          {/* Search Results Dropdown (if triggered) */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="max-w-4xl mx-auto w-full mt-2 p-2 rounded-2xl bg-[#121522]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-30 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-1 font-semibold">
                Hasil Pencarian YouTube Music:
              </span>
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSelectSongResult(song)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors"
                >
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                    <p className="text-[11px] text-white/40 truncate">
                      {song.artists?.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    Pilih
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Popular Recommendation Chips */}
          <div className="flex items-center gap-1.5 max-w-4xl mx-auto w-full mt-2.5 overflow-x-auto custom-scrollbar pb-1 text-xs text-white/40">
            <span className="text-[10px] uppercase font-semibold text-white/30 shrink-0">
              Rekomendasi:
            </span>
            {POPULAR_RECOMMENDATIONS.map((rec) => {
              const q = rec.split(' - ')[0];
              return (
                <button
                  key={rec}
                  type="button"
                  onClick={() => {
                    setSearchQuery(q);
                    loadChordForSong(q);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-500/30 text-white/60 hover:text-cyan-200 text-[11px] shrink-0 transition-colors cursor-pointer"
                >
                  {rec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Song Info & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
          {/* Song Header */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              {currentThumbnail ? (
                <img
                  src={currentThumbnail}
                  alt={currentSongTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-5 h-5" />
              )}
              {currentVideoId && (
                <button
                  onClick={handlePlayCurrentChordSong}
                  className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-cyan-300 transition-colors"
                  title="Dengarkan lagu ini"
                >
                  {isPlaying && currentTrack?.id === currentVideoId ? (
                    <Pause className="w-4 h-4 fill-cyan-300" />
                  ) : (
                    <Play className="w-4 h-4 fill-cyan-300 ml-0.5" />
                  )}
                </button>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate max-w-[260px] sm:max-w-md">
                  {currentSongTitle}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  Key: {originalKey}
                </span>
              </div>
              <p className="text-xs text-white/40 truncate">
                {currentArtistName || 'Artis Musik'}
              </p>
            </div>
          </div>

          {/* Action Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Transpose Controls */}
            <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded-xl border border-white/[0.08]">
              <span className="text-[11px] text-white/40 font-mono mr-0.5">Nada:</span>
              <button
                onClick={() => {
                  setTranspose((t) => (t > -11 ? t - 1 : 11));
                  setPopoverChord(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Turunkan 1/2 nada (Transpose -1)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-bold w-7 text-center text-cyan-300">
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
              <button
                onClick={() => {
                  setTranspose((t) => (t < 11 ? t + 1 : -11));
                  setPopoverChord(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Naikkan 1/2 nada (Transpose +1)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {transpose !== 0 && (
                <button
                  onClick={() => {
                    setTranspose(0);
                    setPopoverChord(null);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Reset ke nada awal"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 2. AUTO-SCROLL & SPEED SETTINGS (User Requested Upgrade) */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] relative">
              {/* Play/Pause Auto-Scroll */}
              <button
                onClick={() => setIsAutoScrolling((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isAutoScrolling
                    ? 'bg-amber-500 text-black font-semibold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title="Auto-scroll otomatis untuk bermain instrumen tanpa menyentuh layar"
              >
                {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>Auto-Scroll</span>
              </button>

              {/* Speed Controller Badge & Adjuster */}
              <div className="flex items-center border-l border-white/10 pl-1.5 ml-0.5 gap-1">
                {/* Decrement Speed */}
                <button
                  onClick={() => setScrollSpeed((s) => Math.max(0.25, parseFloat((s - 0.25).toFixed(2))))}
                  className="p-0.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Perlambat scroll speed (-0.25x)"
                >
                  <Minus className="w-3 h-3" />
                </button>

                {/* Speed Multiplier Pill (Opens Presets Menu) */}
                <button
                  onClick={() => setShowSpeedMenu((prev) => !prev)}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono font-bold text-[11px] transition-colors flex items-center gap-0.5"
                  title="Klik untuk memilih kecepatan preset scroll"
                >
                  <span>{scrollSpeed.toFixed(1)}x</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>

                {/* Increment Speed */}
                <button
                  onClick={() => setScrollSpeed((s) => Math.min(4.0, parseFloat((s + 0.25).toFixed(2))))}
                  className="p-0.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Percepat scroll speed (+0.25x)"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Speed Presets Dropdown */}
              {showSpeedMenu && (
                <div className="absolute top-full mt-1.5 right-0 w-36 rounded-2xl bg-[#141724]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-40 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-semibold text-white/40 px-2 py-0.5">
                    Kecepatan Scroll:
                  </span>
                  {SPEED_PRESETS.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setScrollSpeed(spd);
                        setShowSpeedMenu(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                        scrollSpeed === spd
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{spd}x</span>
                      <span className="text-[10px] font-sans font-normal opacity-70">
                        {spd <= 0.75 ? 'Lambat' : spd === 1.0 ? 'Normal' : spd >= 2.0 ? 'Cepat' : 'Sedang'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Toggle */}
            <div className="flex items-center gap-0.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    fontSize === sz ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title={`Ukuran font ${sz}`}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Edit/Input Custom Toggle */}
            <button
              onClick={() => {
                setIsEditing((prev) => !prev);
                setPopoverChord(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isEditing
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:text-white'
              }`}
              title="Edit lirik atau tempel format chord custom"
            >
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Selesai' : 'Edit Input'}</span>
            </button>

            {/* Close button if provided */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup Chord Sheet"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. UNIQUE CHORDS QUICK BAR */}
      {uniqueChords.length > 0 && !isEditing && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-white/[0.04] bg-white/[0.01] overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[11px] text-white/40 font-semibold tracking-wider uppercase shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Chord Lagu Ini:
          </span>
          <div className="flex items-center gap-1.5">
            {uniqueChords.map((chord, idx) => {
              const theory = getChordTheory(chord);
              return (
                <button
                  key={idx}
                  onClick={(e) => handleChordClick(chord, e)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 text-xs font-bold font-mono transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  title={`${chord} (${theory.fullNameFormatted}) - Klik untuk popover teori nada & audio`}
                >
                  <span>{chord}</span>
                  <span className="text-[9px] font-normal text-cyan-400/60 font-sans">
                    {theory.quality}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT SCROLL AREA */}
      <div
        ref={scrollContainerRef}
        onClick={() => {
          setPopoverChord(null);
          setShowSpeedMenu(false);
          setShowSearchResults(false);
        }}
        className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative"
      >
        {/* Loading overlay when searching */}
        {isSearching && (
          <div className="absolute inset-0 bg-[#080A11]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
              <Guitar className="w-6 h-6 animate-bounce" />
            </div>
            <p className="text-sm font-medium text-white/80">
              Menganalisis chord & lirik lagu...
            </p>
            <p className="text-xs text-white/40">Menyelaraskan struktur nada dan kunci lagu</p>
          </div>
        )}

        {/* Search Error Notice */}
        {searchError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center justify-between gap-3">
            <span>{searchError}</span>
            <button
              onClick={() => setSearchError(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}

        {isEditing ? (
          /* Editor Mode */
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <div>
                <p className="font-semibold mb-1">Panduan Format Input Tag Chord:</p>
                <p className="text-cyan-200/80 leading-relaxed">
                  Sisipkan tag chord di dalam kurung siku <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-cyan-300">[Chord]</code> tepat di depan lirik.
                  <br />
                  Contoh:
                  <code className="block mt-1 bg-black/60 p-2 rounded-xl font-mono text-cyan-300 border border-cyan-500/20">
                    [C]Aku yang [Am]pernah meyakini [F]dirimu[G]
                  </code>
                </p>
              </div>
            </div>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={16}
              className="w-full font-mono text-sm p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 leading-relaxed custom-scrollbar"
              placeholder="Tempel atau ketik lirik lagu dengan tag chord..."
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs transition-colors cursor-pointer"
              >
                Simpan & Lihat Chord
              </button>
            </div>
          </div>
        ) : (
          /* Rendered Chord & Lyrics Display */
          <div className="max-w-2xl mx-auto space-y-6">
            {parsedLines.map((line, lineIdx) => {
              if (line.type === 'section') {
                return (
                  <div key={lineIdx} className="pt-4 pb-1">
                    <span className="inline-block px-3 py-1 rounded-xl bg-white/[0.06] border border-white/10 text-cyan-300 font-mono font-bold text-xs uppercase tracking-wider shadow-sm">
                      {line.title}
                    </span>
                  </div>
                );
              }

              // Check if line contains any chords
              const hasChords = line.tokens.some((tok) => tok.chord);

              return (
                <div
                  key={lineIdx}
                  className={`flex flex-wrap items-end ${
                    hasChords ? 'leading-loose my-2' : 'leading-relaxed my-1'
                  }`}
                >
                  {line.tokens.map((tok, tokIdx) => {
                    const transposed = tok.chord
                      ? transposeChord(tok.chord, transpose)
                      : null;

                    return (
                      <span
                        key={tokIdx}
                        className="inline-flex flex-col items-start mr-0.5 group/token"
                      >
                        {/* Chord Badge placed directly above lyrics syllable */}
                        {transposed ? (
                          <button
                            onClick={(e) => handleChordClick(transposed, e)}
                            className="font-mono font-bold text-cyan-400 hover:text-cyan-200 text-xs sm:text-sm bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 px-1.5 py-0.5 rounded-md leading-none mb-1 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title={`Klik chord ${transposed} untuk melihat diagram fret & teori`}
                          >
                            {transposed}
                          </button>
                        ) : hasChords ? (
                          <span className="h-5 mb-1" aria-hidden="true" />
                        ) : null}

                        {/* Lyrics Syllable / Word */}
                        <span
                          className={`font-sans tracking-wide text-white/90 whitespace-pre ${fontSizeClass}`}
                        >
                          {tok.lyrics || ' '}
                        </span>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. FLOATING AUTO-SCROLL CONTROL BADGE */}
      {isAutoScrolling && (
        <div className="fixed bottom-24 right-8 z-40 flex items-center gap-2 p-2 rounded-2xl bg-[#090A0F]/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl animate-in fade-in duration-300">
          <button
            onClick={() => setIsAutoScrolling(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow cursor-pointer hover:bg-amber-400 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 fill-black" />
            <span>Jeda Scroll</span>
          </button>

          <div className="flex items-center gap-1 pl-1 border-l border-white/10">
            <button
              onClick={() => setScrollSpeed((s) => Math.max(0.25, parseFloat((s - 0.25).toFixed(2))))}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs"
              title="Perlambat (-0.25x)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-amber-300 px-1">
              {scrollSpeed.toFixed(1)}x
            </span>
            <button
              onClick={() => setScrollSpeed((s) => Math.min(4.0, parseFloat((s + 0.25).toFixed(2))))}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs"
              title="Percepat (+0.25x)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. POPOVER & FULL DETAIL MODALS */}
      {popoverChord && popoverAnchor && (
        <ChordPopover
          chordName={popoverChord}
          anchorRect={popoverAnchor}
          onClose={() => {
            setPopoverChord(null);
            setPopoverAnchor(null);
          }}
          onOpenModal={(chord) => {
            setActiveModalChord(chord);
            setPopoverChord(null);
            setPopoverAnchor(null);
          }}
        />
      )}

      {activeModalChord && (
        <ChordDetailModal
          chordName={activeModalChord}
          onClose={() => setActiveModalChord(null)}
        />
      )}
    </div>
  );
};
