import React, { useEffect } from 'react';
import { X, ExternalLink, Download, User, ZoomIn } from 'lucide-react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  fallbackUrl?: string;
  name?: string;
  username?: string;
  subtitle?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl = '/logo.webp',
  fallbackUrl = 'https://files.catbox.moe/91lpa1.webp',
  name = 'Nell',
  username = '@nellseen',
  subtitle = 'Creator of Innertube Music Engine & Developer',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between p-4 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl flex items-center justify-between py-2 text-white/80 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{name}</span>
              <span className="text-xs text-cyan-400 font-mono font-normal">{username}</span>
            </h3>
            <p className="text-[11px] text-white/50">Foto Profil</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            download="nell-profile.png"
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            title="Buka gambar penuh"
            aria-label="Buka gambar penuh"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Tutup (ESC)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex items-center justify-center max-w-lg w-full p-2"
      >
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-4 rounded-full bg-cyan-500/20 blur-3xl -z-10 pointer-events-none" />

        <div className="relative group rounded-3xl overflow-hidden border border-white/15 bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[75vh] max-w-[85vw] flex items-center justify-center">
          <img
            src={imageUrl}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackUrl;
            }}
            alt={`${name} Profile`}
            className="w-auto h-auto max-h-[72vh] max-w-full object-contain rounded-2xl transform transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </div>

      {/* Bottom Bar Info */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md text-center py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl z-10"
      >
        <p className="text-xs text-white/80 font-medium">{subtitle}</p>
        <div className="flex items-center justify-center gap-3 mt-1.5 text-[11px] text-cyan-400 font-mono">
          <a
            href="https://github.com/nellseen"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            github.com/nellseen
          </a>
          <span className="text-white/20">·</span>
          <span className="text-white/40">Ketuk di luar untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
