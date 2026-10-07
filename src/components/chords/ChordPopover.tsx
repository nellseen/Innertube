import React, { useEffect, useRef } from 'react';
import { Volume2, X, Sparkles, Layers, Info, ExternalLink } from 'lucide-react';
import { getChordTheory, playSynthesizedChord } from './ChordTheory.js';

interface ChordPopoverProps {
  chordName: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onOpenModal?: (chordName: string) => void;
}

export const ChordPopover: React.FC<ChordPopoverProps> = ({
  chordName,
  anchorRect,
  onClose,
  onOpenModal,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!chordName || !anchorRect) return null;

  // Retrieve theoretical info using Tonal library
  const info = getChordTheory(chordName);

  // Position calculation
  const popoverWidth = 280;
  const padding = 12;

  // Center horizontally relative to anchor
  let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  left = Math.max(padding, Math.min(window.innerWidth - popoverWidth - padding, left));

  // Determine whether to place above or below
  const spaceAbove = anchorRect.top;
  const placeAbove = spaceAbove > 240;

  const top = placeAbove
    ? anchorRect.top - 8
    : anchorRect.bottom + 8;

  // Color theme based on chord quality
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
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: placeAbove ? undefined : `${top}px`,
        bottom: placeAbove ? `${window.innerHeight - top}px` : undefined,
        width: `${popoverWidth}px`,
      }}
      className="z-50 rounded-2xl bg-[#0D1019]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_36px_rgba(0,0,0,0.7)] p-4 text-white animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black font-mono tracking-tight text-white">
            {chordName}
          </span>
          {/* Tipe / Kualitas Chord */}
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getQualityBadgeColor(
              info.quality
            )}`}
          >
            {info.quality}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => playSynthesizedChord(info.notes)}
            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors cursor-pointer"
            title="Dengarkan bunyi chord"
            aria-label="Putar audio chord"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup popover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Nama Lengkap Chord */}
      <div className="mb-3">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40 block mb-0.5">
          Nama Lengkap:
        </span>
        <p className="text-sm font-bold text-cyan-200">
          {info.fullNameFormatted || info.name || `${chordName} Chord`}
        </p>
      </div>

      {/* 2. Daftar Nada Penyusun Chord */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            Nada Penyusun:
          </span>
          <span className="text-[10px] text-white/40 font-mono">
            {info.notes.length} nada
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {info.notes.length > 0 ? (
            info.notes.map((note, idx) => (
              <span
                key={idx}
                className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 font-mono font-bold text-xs shadow-sm"
              >
                {note}
              </span>
            ))
          ) : (
            <span className="text-xs text-white/40 italic">Tidak ada nada spesifik</span>
          )}
        </div>
      </div>

      {/* 3. Tipe/Kualitas & Tonic Detail */}
      <div className="grid grid-cols-2 gap-2 mb-3 bg-white/[0.03] p-2 rounded-xl border border-white/[0.05]">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-white/40 block">Tipe / Kualitas</span>
          <span className="text-xs font-semibold text-white/90 truncate block">{info.quality}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-white/40 block">Nada Dasar</span>
          <span className="text-xs font-semibold text-cyan-300 font-mono block">
            {info.tonic || chordName[0]}
          </span>
        </div>
      </div>

      {/* Footer Action: Open Full Modal */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[9px] text-white/30 font-mono flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
          Tonal.js
        </span>
        {onOpenModal && (
          <button
            onClick={() => {
              onClose();
              onOpenModal(chordName);
            }}
            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Detail Lengkap & Tab</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
