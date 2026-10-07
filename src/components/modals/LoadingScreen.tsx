import React, { useState, useEffect } from 'react';
import { Sparkles, Music2, ExternalLink, ArrowRight, Disc3, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [statusText, setStatusText] = useState('Menginisialisasi Innertube Engine...');

  useEffect(() => {
    const steps = [
      { p: 25, msg: 'Menghubungkan ke InnerTube Network' },
      { p: 55, msg: 'Menyiapkan Lossless Audio Stream' },
      { p: 85, msg: 'Sinkronisasi Tema & Glass UI' },
      { p: 100, msg: 'Aetheria Music Siap Dimainkan' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusText(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsReady(true);
        // Smoothly auto-dismiss after brief moment
        const timer = setTimeout(() => {
          handleDismiss();
        }, 900);
        return () => clearTimeout(timer);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 400);
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#06070B]/95 backdrop-blur-2xl transition-opacity duration-500 select-none ${
        progress >= 100 && isDismissed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] left-[15%] w-96 h-96 rounded-full bg-cyan-600/15 blur-[130px] animate-pulse" />
        <div className="absolute -bottom-[10%] right-[15%] w-96 h-96 rounded-full bg-indigo-600/15 blur-[130px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-600/10 blur-[140px]" />
      </div>

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-[440px] rounded-3xl bg-[#0D0F18]/90 backdrop-blur-3xl border border-white/10 p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Subtle decorative top highlight line */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        {/* 1. Header Profile & Badge */}
        <div className="relative mb-4 group">
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 opacity-50 blur-md transition-opacity group-hover:opacity-75 animate-pulse" />
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-500 p-[2px] shadow-2xl overflow-hidden">
            <div className="w-full h-full bg-[#0D0F18] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://files.catbox.moe/91lpa1.webp';
                }}
                alt="Nell"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          {/* Audio Engine Pin Badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 text-black border-2 border-[#0D0F18] flex items-center justify-center shadow-lg">
            <Music2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* 2. Mandatory Text & Clean Identity */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono tracking-wider uppercase mb-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Aetheria Music Engine</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Website ini dibuat oleh{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
              Nell
            </span>
          </h2>

          <p className="text-xs text-white/50 mt-1 max-w-xs leading-relaxed">
            Arsitektur streaming lossless bertenaga YouTube Music Innertube oleh{' '}
            <span className="text-cyan-300 font-mono font-medium">@nellseen</span>
          </p>
        </div>

        {/* 3. Social Media & Creator Hub (Clean, Unified Glass Card) */}
        <div className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 mb-4 space-y-2">
          {/* Instagram Button (Official Link requested by user) */}
          <a
            href="https://www.instagram.com/tianshirrr_?stkn=MXF1NjVuOWswdm95Zg=="
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-purple-500/10 to-amber-500/10 hover:from-rose-500/25 hover:via-purple-500/20 hover:to-amber-500/20 border border-rose-500/20 hover:border-rose-400/40 text-white transition-all group"
          >
            <div className="flex items-center gap-2.5">
              {/* Instagram Icon Badge */}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1px] shadow-sm shrink-0">
                <div className="w-full h-full bg-[#0D0F18] rounded-[7px] flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-rose-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
                  Instagram Nell
                </div>
                <div className="text-[10px] text-white/45 font-mono">@tianshirrr_</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-rose-300 font-medium group-hover:translate-x-0.5 transition-transform">
              <span>Buka Profil</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          {/* GitHub Profile Button */}
          <a
            href="https://github.com/nellseen"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 text-white/70 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>
              <span className="text-xs text-white/80 group-hover:text-white font-medium">
                GitHub Repository
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-white/30" />
          </a>
        </div>

        {/* 4. Live Equalizer & Progress Bar */}
        <div className="w-full space-y-2 mb-4">
          {/* Subtle Equalizer Waves */}
          <div className="flex items-center justify-center gap-1 h-4">
            {[30, 60, 90, 50, 80, 40, 95, 65, 85, 45, 75, 35].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-indigo-400 transition-all duration-300"
                style={{
                  height: `${Math.max(20, (h * progress) / 100)}%`,
                  opacity: 0.35 + (progress / 100) * 0.65,
                }}
              />
            ))}
          </div>

          {/* Minimalist Progress Track */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 font-mono px-0.5">
            <span className="truncate max-w-[280px] text-left">{statusText}</span>
            <span className="text-cyan-300 font-semibold">{progress}%</span>
          </div>
        </div>

        {/* 5. Clean Action Button */}
        <div className="w-full">
          <button
            onClick={handleDismiss}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              isReady
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 scale-[1.01]'
                : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white'
            }`}
          >
            <span>{isReady ? 'Masuk ke Aetheria' : 'Lewati & Masuk'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtle Engine Footnote */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Lossless Stream · YouTube Music Innertube v18</span>
        </div>
      </div>
    </div>
  );
};
