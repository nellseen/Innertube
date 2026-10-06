import React from 'react';
import { X, Mic2 } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ isOpen, onClose }) => {
  const { currentTrack, lyrics, isLoadingLyrics } = usePlayer();

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0B0D15]/95 backdrop-blur-3xl border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">Lyrics</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-center custom-scrollbar">
        {currentTrack && (
          <div className="mb-4 pb-4 border-b border-white/[0.06]">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-white/40 truncate mt-0.5">
              {Array.isArray(currentTrack.artists)
                ? currentTrack.artists.map((a) => a.name).join(', ')
                : typeof (currentTrack as any).artist === 'string'
                ? (currentTrack as any).artist
                : 'Unknown Artist'}
            </p>
          </div>
        )}

        {isLoadingLyrics ? (
          <div className="my-auto flex flex-col items-center gap-3 text-white/40">
            <span className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading lyrics...</p>
          </div>
        ) : lyrics?.lines && lyrics.lines.length > 0 ? (
          lyrics.lines.map((line, idx) => (
            <p
              key={idx}
              className="text-base font-medium text-white/70 hover:text-white transition-colors"
            >
              {line.text}
            </p>
          ))
        ) : (
          <div className="my-auto text-white/40 flex flex-col items-center">
            <Mic2 className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm font-semibold">No lyrics available</p>
            <p className="text-xs text-white/25 mt-1">
              Official lyrics could not be retrieved for this track
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
