import React from 'react';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { useTheme, THEMES, ThemeId } from '../../contexts/ThemeContext.js';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { currentTheme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-[#0D0F18]/95 backdrop-blur-2xl border border-white/10 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-cyan-400 shadow-md">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Pilih Tema Tampilan</h3>
            <p className="text-xs text-white/50">Sesuaikan palet warna & glassmorphism Aetheria</p>
          </div>
        </div>

        {/* Theme List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {(Object.keys(THEMES) as ThemeId[]).map((key) => {
            const item = THEMES[key];
            const isSelected = currentTheme === key;

            return (
              <div
                key={key}
                onClick={() => setTheme(key)}
                className={`relative group p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-white/12 border-white/30 shadow-lg scale-[1.01]'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08]'
                }`}
              >
                {/* Left Preview & Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Swatch Circle */}
                  <div
                    className="w-10 h-10 rounded-xl shrink-0 p-0.5 border shadow-inner flex items-center justify-center relative overflow-hidden"
                    style={{
                      borderColor: item.borderSubtle,
                      backgroundColor: item.bgBase,
                    }}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${item.gradient} shadow-md`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-tight">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/45 truncate mt-0.5">{item.description}</p>
                  </div>
                </div>

                {/* Right Selection Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pilihan tema disimpan otomatis</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
