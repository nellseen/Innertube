import React, { useState } from 'react';
import { X, Github, Sparkles, Music2, Code2, Heart, ExternalLink, Disc3, ShieldCheck, ZoomIn } from 'lucide-react';
import { PhotoViewerModal } from './PhotoViewerModal.js';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl bg-[#0D0F18]/95 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-200 select-none overflow-hidden"
        >
          {/* Ambient Top Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Profile */}
          <div className="flex items-center gap-4 mb-6">
            {/* Interactive Avatar button */}
            <div
              onClick={() => setIsPhotoViewerOpen(true)}
              className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-[2px] shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer group transition-transform duration-200 hover:scale-105 active:scale-95"
              title="Ketuk untuk melihat foto profil penuh"
            >
              <div className="w-full h-full bg-[#0D0F18] rounded-[14px] flex items-center justify-center overflow-hidden relative">
                <img
                  src="/logo.webp"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://files.catbox.moe/91lpa1.webp';
                  }}
                  alt="Nell Profile"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Hover inspect overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Nell</h3>
                <span className="text-xs text-cyan-400 font-mono">@nellseen</span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Creator of the Innertube Music Engine & Developer
              </p>
              <button
                onClick={() => setIsPhotoViewerOpen(true)}
                className="mt-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors group"
              >
                <ZoomIn className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Lihat foto profil</span>
              </button>
            </div>
          </div>

        {/* Bio / Story */}
        <div className="space-y-3 mb-6 text-xs sm:text-sm text-white/70 leading-relaxed">
          <p>
            Hi! I am <span className="font-semibold text-white">Nell</span> (<span className="text-cyan-300 font-mono">nellseen</span>), the developer behind this open music streaming and discovery architecture.
          </p>
          <p>
            <span className="font-semibold text-white">Aetheria Music</span> was built out of a desire for a clean, zero-bloat, lossless audio client with modern iOS Glassmorphism aesthetics. By directly harnessing YouTube Music&apos;s internal InnerTube network endpoints, it bypasses rigid API quotas, giving you instant streaming, full discographies, and real-time synchronized lyrics.
          </p>
        </div>

        {/* Architecture Highlights */}
        <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
            Engine & Technical Highlights
          </div>

          <div className="flex items-start gap-2.5 text-xs text-white/80">
            <Disc3 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Innertube Engine:</strong> Direct, uncapped access to YouTube Music catalog via <code className="text-cyan-300">youtubei.js</code>.
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-white/80">
            <Music2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Auto-Scroll Lyrics:</strong> Synchronized LRC timeline parser with intelligent fallback mechanism.
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-white/80">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Ad-Free & Lossless:</strong> Direct audio extraction without third-party advertisements or trackers.
            </span>
          </div>
        </div>

        {/* External Links & Footer */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <a
            href="https://github.com/nellseen"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 text-white/40" />
          </a>

          <a
            href="https://github.com/nellseen/Innertube"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-medium border border-white/[0.06] transition-colors"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Innertube Repo</span>
            <ExternalLink className="w-3 h-3 text-white/40" />
          </a>
        </div>

        {/* Credit footnote */}
        <div className="text-center mt-5 text-[11px] text-white/30 flex items-center justify-center gap-1.5">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
          <span>by Nell (nellseen)</span>
        </div>
      </div>
    </div>

    {/* Fullscreen Profile Photo Viewer */}
    <PhotoViewerModal
      isOpen={isPhotoViewerOpen}
      onClose={() => setIsPhotoViewerOpen(false)}
      name="Nell"
      username="@nellseen"
      subtitle="Creator of Innertube Music Engine & Developer"
    />
  </>
  );
};
