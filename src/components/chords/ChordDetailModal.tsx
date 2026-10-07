import React, { useEffect } from 'react';
import { X, Volume2, Music, Sparkles, Hash, Layers } from 'lucide-react';
import { getChordTheory, playSynthesizedChord } from './ChordTheory.js';

interface ChordDetailModalProps {
  chordName: string | null;
  onClose: () => void;
}

// Common guitar fingerings dictionary (fret positions E A D G B e, -1 = mute)
const guitarChords: Record<string, { frets: number[]; fingers?: number[] }> = {
  C: { frets: [-1, 3, 2, 0, 1, 0] },
  Cm: { frets: [-1, 3, 5, 5, 4, 3] },
  C7: { frets: [-1, 3, 2, 3, 1, 0] },
  Cmaj7: { frets: [-1, 3, 2, 0, 0, 0] },
  D: { frets: [-1, -1, 0, 2, 3, 2] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1] },
  D7: { frets: [-1, -1, 0, 2, 1, 2] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  Em: { frets: [0, 2, 2, 0, 0, 0] },
  E7: { frets: [0, 2, 0, 1, 0, 0] },
  Em7: { frets: [0, 2, 0, 0, 0, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1] },
  Fm: { frets: [1, 3, 3, 1, 1, 1] },
  Fmaj7: { frets: [-1, -1, 3, 2, 1, 0] },
  G: { frets: [3, 2, 0, 0, 0, 3] },
  Gm: { frets: [3, 5, 5, 3, 3, 3] },
  G7: { frets: [3, 2, 0, 0, 0, 1] },
  Gdim: { frets: [-1, -1, 2, 3, 2, 3] },
  A: { frets: [-1, 0, 2, 2, 2, 0] },
  Am: { frets: [-1, 0, 2, 2, 1, 0] },
  A7: { frets: [-1, 0, 2, 0, 2, 0] },
  Am7: { frets: [-1, 0, 2, 0, 1, 0] },
  B: { frets: [-1, 2, 4, 4, 4, 2] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2] },
  B7: { frets: [-1, 2, 1, 2, 0, 2] },
  Bb: { frets: [-1, 1, 3, 3, 3, 1] },
  'F#m': { frets: [2, 4, 4, 2, 2, 2] },
  'F#m7': { frets: [2, 4, 2, 2, 2, 2] },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4] },
  'G#m': { frets: [4, 6, 6, 4, 4, 4] },
};

export const ChordDetailModal: React.FC<ChordDetailModalProps> = ({ chordName, onClose }) => {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!chordName) return null;

  // Retrieve music theory analysis from Tonal library
  const info = getChordTheory(chordName);
  const fingering = guitarChords[chordName] || guitarChords[info.symbol] || null;

  const getQualityBadgeColor = (q: string) => {
    switch (q.toLowerCase()) {
      case 'major':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'minor':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'diminished':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'dominant':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'suspended':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0D1019]/95 border border-white/10 shadow-2xl p-6 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Gradient Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black font-mono tracking-tight text-white">
                  {chordName}
                </h3>
                {info.quality && (
                  <span
                    className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getQualityBadgeColor(
                      info.quality
                    )}`}
                  >
                    {info.quality}
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-300/80 font-medium mt-0.5">
                {info.fullNameFormatted || info.name || 'Chord Analysis'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playSynthesizedChord(info.notes)}
              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors cursor-pointer"
              title="Dengarkan bunyi nada chord"
              aria-label="Putar audio chord"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Theory Details */}
        <div className="mt-5 flex flex-col gap-4">
          {/* 1. Nama Lengkap Chord */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider block mb-0.5">
                Nama Lengkap
              </span>
              <span className="text-sm font-bold text-white">
                {info.fullNameFormatted || info.name || `${chordName} Chord`}
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              {info.symbol}
            </span>
          </div>

          {/* 2. Daftar Nada Penyusun (Notes) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Daftar Nada Penyusun (Notes)
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                {info.notes.length} nada
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {info.notes.length > 0 ? (
                info.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 shadow-sm"
                  >
                    <span className="text-base font-bold font-mono text-cyan-200">{note}</span>
                    <span className="text-[9px] text-cyan-300/60 font-mono mt-0.5">
                      {info.intervals?.[idx] || ''}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-white/40 italic">Data nada tidak tersedia</span>
              )}
            </div>
          </div>

          {/* 3. Tipe / Kualitas & Nada Dasar (Tonic) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider block mb-1">
                Tipe / Kualitas
              </span>
              <span className="text-sm font-semibold text-white">
                {info.quality}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider block mb-1">
                Nada Dasar (Tonic)
              </span>
              <span className="text-sm font-semibold text-cyan-300 font-mono">
                {info.tonic || chordName[0]}
              </span>
            </div>
          </div>

          {/* Intervals & Formula */}
          {info.intervals.length > 0 && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider block mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-400" />
                Interval Formula
              </span>
              <div className="flex flex-wrap gap-1.5">
                {info.intervals.map((int, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-indigo-200"
                  >
                    {int}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Guitar Fingering Chart if available */}
          {fingering && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider block mb-0.5">
                  Posisi Fret Gitar
                </span>
                <span className="text-xs text-white/60 font-mono">E A D G B e</span>
              </div>
              <div className="flex items-center gap-1.5">
                {fingering.frets.map((f, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center border ${
                      f === -1
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        : f === 0
                        ? 'bg-white/5 border-white/15 text-white/60'
                        : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    {f === -1 ? 'X' : f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-white/30 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Powered by Tonal.js
          </span>
          <button
            onClick={() => playSynthesizedChord(info.notes)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Mainkan Nada
          </button>
        </div>
      </div>
    </div>
  );
};
