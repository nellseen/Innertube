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
  Type,
  HelpCircle,
  Volume2,
} from 'lucide-react';
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
}

// Curated preset songs including the user's specific example
const PRESET_SONGS: ChordSongPreset[] = [
  {
    id: 'user-example',
    title: 'Aku Yang Pernah Meyakini',
    artist: 'Contoh Lagu (User)',
    originalKey: 'C',
    content: `[Intro] [C] [G] [Am] [F]

[Verse 1]
[C]Aku yang [Am]pernah meyakini [F]dirimu[G]
[C]Setulus hati [Am]mencoba tuk me[F]mahami[G]
[Em]Namun bila [Am]akhirnya harus [F]begini[G]
[C]Kulepaskan se[Am]gala yang pernah [F]terjadi[G]

[Chorus]
[F]Biar waktu yang kan men[G]jawab semua
[Em]Kisah yang pernah ter[Am]ukir di antara kita
[Dm]Takkan kusesali per[G]temuan yang indah ini
[C]Semoga kau bahagia selalu`,
  },
  {
    id: 'laskar-pelangi',
    title: 'Laskar Pelangi',
    artist: 'Nidji',
    originalKey: 'A',
    content: `[Intro] [A] [D] [A] [D]

[Verse 1]
[A]Mimpi adalah kunci
Untuk [D]kita menaklukkan dunia
Ber[C#m]larilah tanpa [F#m]lelah
Sampai [Bm]engkau meraih[E]nya

[Verse 2]
[A]Laskar pelangi
Takkan [D]terikat waktu
Bebas[C#m]kan mimpimu di [F#m]angkasa
Warna[Bm]i bintang di [E]jiwa

[Chorus]
Me[A]narilah dan terus [D]tertawa
Walau [A]dunia tak seindah [D]surga
Bersi[F#m]kurlah pada Yang [D]Kuasa
Cinta [Bm]kita di dunia [E]selamanya`,
  },
  {
    id: 'akad',
    title: 'Akad',
    artist: 'Payung Teduh',
    originalKey: 'E',
    content: `[Intro] [E] [G#m] [A] [B]

[Verse 1]
[E]Betapa bahagianya hatiku saat
Ku[G#m]duduk berdua denganmu
Ber[A]jalan bersamamu
Me[B]narilah denganku

[Chorus]
Bila [A]nanti saatnya t'lah [B]tiba
Kuingin [G#m]kau menjadi istri[C#m]ku
Ber[F#m]jalan bersamamu dalam [B]terik dan hujan
Ber[E]lapiskan rasa cinta [E7]yang tak lekang waktu`,
  },
  {
    id: 'komang',
    title: 'Komang',
    artist: 'Raim Laode',
    originalKey: 'G',
    content: `[Intro] [G] [D] [Em] [C]

[Verse 1]
[G]Dari jutaan [D]bintang di langit
[Em]Hanya kamu yang [C]paling terang
[G]Sebab kau terlalu [D]indah tuk jadi nyata
[Em]Kupikir kau [C]hanya ilusi

[Chorus]
Dan [G]apabila nanti kau [D]milikku
Ku[Em]kan menjagamu seumur [C]hidupku
Sebab [Am]kamu yang kurasa [D]paling sempurna
[G]Komang...`,
  },
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

// Transpose a single chord name using Tonal
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
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const ChordLyricsViewer: React.FC<ChordLyricsViewerProps> = ({
  initialContent,
  songTitle = 'Aku Yang Pernah Meyakini',
  artistName = 'Contoh Lagu',
  onClose,
  isEmbedded = false,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('user-example');
  const [textInput, setTextInput] = useState<string>(
    initialContent || PRESET_SONGS[0].content
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [transpose, setTranspose] = useState<number>(0);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Popover state (anchored next to clicked chord)
  const [popoverChord, setPopoverChord] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  // Modal state (full dialog view)
  const [activeModalChord, setActiveModalChord] = useState<string | null>(null);

  // Auto-scroll state for hands-free playing
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll effect
  useEffect(() => {
    if (!isAutoScrolling) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += scrollSpeed;
      }
    }, 40);
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  // Handle Preset switch
  const handleSelectPreset = (preset: ChordSongPreset) => {
    setSelectedPresetId(preset.id);
    setTextInput(preset.content);
    setTranspose(0);
    setIsEditing(false);
    setPopoverChord(null);
  };

  // Parser: converts raw lines into parsed tokens with chords above lyrics
  const parsedLines = useMemo<ParsedLine[]>(() => {
    const rawLines = textInput.split('\n');
    const result: ParsedLine[] = [];

    const sectionRegex = /^\[(intro|verse|chorus|reff|bridge|outro|interlude|solo|hook|ending|pre-chorus|pre chorus)[^\]]*\]$/i;
    const chordRegex = /\[([^\]]+)\]([^\[]*)/g;

    for (const raw of rawLines) {
      const trimmed = raw.trim();

      // Empty line
      if (!trimmed) {
        result.push({ type: 'line', tokens: [{ lyrics: '' }] });
        continue;
      }

      // Check if it's a standalone section header e.g. [Intro], [Chorus]
      const sectionMatch = trimmed.match(sectionRegex);
      if (sectionMatch) {
        result.push({
          type: 'section',
          title: trimmed.replace(/^\[|\]$/g, ''),
          tokens: [],
        });
        continue;
      }

      // Check bracket presence
      const firstBracket = raw.indexOf('[');
      if (firstBracket === -1) {
        // Plain line without chords
        result.push({
          type: 'line',
          tokens: [{ lyrics: raw }],
        });
        continue;
      }

      const tokens: ChordToken[] = [];

      // Text before first bracket
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

  // Chord badge click handler
  const handleChordClick = (chord: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverAnchor(rect);
    setPopoverChord(chord);
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#080A11] text-white select-none ${
        isEmbedded ? 'rounded-2xl border border-white/10' : ''
      }`}
    >
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {selectedPresetId
                  ? PRESET_SONGS.find((p) => p.id === selectedPresetId)?.title || songTitle
                  : songTitle}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Chord Sheet
              </span>
            </div>
            <p className="text-xs text-white/40 truncate">
              {selectedPresetId
                ? PRESET_SONGS.find((p) => p.id === selectedPresetId)?.artist || artistName
                : artistName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            {PRESET_SONGS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedPresetId === p.id && !isEditing
                    ? 'bg-cyan-500 text-black font-semibold shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          {/* Transpose Controls (with Tonal.js) */}
          <div className="flex items-center gap-1 bg-white/[0.04] px-2 py-1 rounded-xl border border-white/[0.08]">
            <span className="text-[11px] text-white/40 font-mono mr-1">Key:</span>
            <button
              onClick={() => {
                setTranspose((t) => (t > -11 ? t - 1 : 11));
                setPopoverChord(null);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Turunkan 1/2 nada (Transpose -1)"
              aria-label="Turunkan nada transpose"
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
              aria-label="Naikkan nada transpose"
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
                aria-label="Reset nada awal"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
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

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setIsAutoScrolling((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isAutoScrolling
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:text-white'
            }`}
            title="Auto-scroll otomatis untuk bermain gitar tanpa tangan"
          >
            {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>Auto-Scroll</span>
          </button>

          {/* Edit Custom Input toggle */}
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
            title="Ketik atau tempel lirik chord custom kamu"
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

      {/* Unique Chords Quick Bar */}
      {uniqueChords.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/[0.04] bg-white/[0.01] overflow-x-auto custom-scrollbar shrink-0">
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
                  title={`${chord} (${theory.fullNameFormatted}) - Klik untuk popover teori nada`}
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

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        onClick={() => setPopoverChord(null)}
        className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative"
      >
        {isEditing ? (
          /* Editor Mode */
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <div>
                <p className="font-semibold mb-1">Panduan Format Input Tag Chord:</p>
                <p className="text-cyan-200/80 leading-relaxed">
                  Sisipkan tag chord di dalam tanda kurung siku <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-cyan-300">[Chord]</code> tepat di depan kata atau suku kata lirik.
                  <br />
                  Contoh input:
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
              className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all custom-scrollbar"
              placeholder="Ketik atau tempel lirik dengan tag chord di sini..."
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Simpan & Lihat Chord Sheet
              </button>
            </div>
          </div>
        ) : (
          /* Rendered Chord & Lyrics Display */
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {parsedLines.map((line, lineIdx) => {
              if (line.type === 'section') {
                return (
                  <div key={lineIdx} className="pt-3 pb-1">
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
                      {line.title}
                    </span>
                  </div>
                );
              }

              // Empty line spacer
              if (
                line.tokens.length === 1 &&
                !line.tokens[0].chord &&
                line.tokens[0].lyrics === ''
              ) {
                return <div key={lineIdx} className="h-4" />;
              }

              return (
                <div
                  key={lineIdx}
                  className="flex flex-wrap items-end py-1 leading-none group/line hover:bg-white/[0.015] rounded-xl px-2 transition-colors"
                >
                  {line.tokens.map((token, tokIdx) => {
                    const rawChord = token.chord;
                    const finalChord = rawChord
                      ? transposeChord(rawChord, transpose)
                      : undefined;

                    return (
                      <span
                        key={tokIdx}
                        className="inline-flex flex-col items-start justify-end mb-3 align-bottom relative"
                      >
                        {/* Chord Badge Button (Above Lyrics) */}
                        {finalChord ? (
                          <button
                            onClick={(e) => handleChordClick(finalChord, e)}
                            className="text-xs sm:text-sm font-extrabold font-mono px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 leading-none mb-1.5 select-none"
                            title={`Klik untuk melihat detail teori nada chord ${finalChord}`}
                          >
                            {finalChord}
                          </button>
                        ) : (
                          /* Invisible height spacer to keep lines strictly aligned */
                          <span className="h-6 mb-1.5 block" />
                        )}

                        {/* Lyrics Text (Directly below Chord) */}
                        <span
                          className={`${fontSizeClass} font-medium text-white/90 whitespace-pre leading-normal`}
                        >
                          {token.lyrics || (finalChord ? '\u00A0' : '')}
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

      {/* Anchored Chord Popover right next to the clicked chord badge */}
      {popoverChord && popoverAnchor && (
        <ChordPopover
          chordName={popoverChord}
          anchorRect={popoverAnchor}
          onClose={() => setPopoverChord(null)}
          onOpenModal={(chord) => {
            setPopoverChord(null);
            setActiveModalChord(chord);
          }}
        />
      )}

      {/* Comprehensive Chord Detail Modal when requested */}
      <ChordDetailModal
        chordName={activeModalChord}
        onClose={() => setActiveModalChord(null)}
      />
    </div>
  );
};
