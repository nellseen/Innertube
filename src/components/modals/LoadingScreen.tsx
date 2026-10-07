import React, { useState, useEffect } from 'react';
import { Sparkles, Music2, ExternalLink, ArrowRight, Disc3 } from 'lucide-react';

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
      { p: 25, msg: 'Menghubungkan ke InnerTube Network...' },
      { p: 55, msg: 'Menyiapkan Lossless Audio Stream...' },
      { p: 85, msg: 'Sinkronisasi Library & Tema...' },
      { p: 100, msg: 'Aetheria Music Siap Dimainkan!' },
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
        // Auto-dismiss smoothly after brief pause
        const timer = setTimeout(() => {
          handleDismiss();
        }, 800);
        return () => clearTimeout(timer);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 500);
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#07080D] transition-opacity duration-500 select-none ${
        progress >= 100 && isDismissed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-600/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-[#0D0F18]/90 backdrop-blur-3xl border border-white/10 p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col items-center text-center overflow-hidden">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Profile Avatar / Logo with glowing ring */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 opacity-60 blur-lg animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-500 p-[2px] shadow-2xl overflow-hidden">
            <div className="w-full h-full bg-[#0D0F18] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://files.catbox.moe/91lpa1.webp';
                }}
                alt="Nell Profile"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
          {/* Animated pulsing music badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 border-2 border-[#0D0F18] flex items-center justify-center text-black shadow-md">
            <Music2 className="w-3 h-3 stroke-[2.5]" />
          </div>
        </div>

        {/* Creator Name & Handle */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Nell</h2>
          <span className="text-xs text-cyan-400 font-mono">@nellseen</span>
        </div>

        {/* Mandatory About Me Text */}
        <p className="text-sm font-medium text-cyan-300/90 mb-2">
          Website ini dibuat oleh Nell
        </p>

        {/* App Title & Mission */}
        <p className="text-xs text-white/50 max-w-xs leading-relaxed mb-6">
          Aetheria Music — Lossless Audio Streaming & Discovery Client bertenaga Innertube & YouTube Music
        </p>

        {/* Social Media Link - Instagram & GitHub */}
        <div className="w-full space-y-2 mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 text-left px-1">
            Media Sosial & Pembuat
          </div>

          {/* Instagram Button (Official user requested link) */}
          <a
            href="https://www.instagram.com/tianshirrr_?stkn=MXF1NjVuOWswdm95Zg=="
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 hover:from-rose-500/20 hover:via-purple-500/20 hover:to-amber-500/20 border border-rose-500/20 hover:border-rose-400/40 text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              {/* Instagram Icon */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shadow-sm shrink-0">
                <div className="w-full h-full bg-[#0D0F18] rounded-[10px] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-rose-400"
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
                <div className="text-[10px] text-white/50 font-mono">@tianshirrr_</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-300 group-hover:translate-x-0.5 transition-transform">
              <span>Buka Profil</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          {/* GitHub Profile */}
          <a
            href="https://github.com/nellseen"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4 text-white/70 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span className="text-xs font-medium">GitHub Repository</span>
            </div>
            <ExternalLink className="w-3 h-3 text-white/30" />
          </a>
        </div>

        {/* Loading Progress Bar & Equalizer */}
        <div className="w-full space-y-2">
          {/* Animated Equalizer Waveform */}
          <div className="flex items-center justify-center gap-1 h-5 mb-1">
            {[40, 70, 100, 60, 85, 45, 95, 30, 75, 55].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full animate-pulse"
                style={{
                  height: `${(height * progress) / 100}%`,
                  animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 font-mono px-0.5">
            <span className="truncate max-w-[240px] text-left">{statusText}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-5 w-full flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              isReady
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white'
            }`}
          >
            <span>{isReady ? 'Masuk ke Aetheria' : 'Lewati & Masuk'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
