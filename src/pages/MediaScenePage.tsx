import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Sparkles,
  Waves,
  Disc3,
  CloudRain,
  Compass,
  Check,
  Heart,
  Sliders,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext.js';
import { useLibrary } from '../contexts/LibraryContext.js';
import { useScene, SCENES, SceneType } from '../contexts/SceneContext.js';
import { SceneCanvas } from '../components/scene/SceneCanvas.js';
import { api } from '../services/api.js';
import type { Song, NavigationPage } from '../types/music.js';

interface MediaScenePageProps {
  onNavigate: (page: NavigationPage) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const MediaScenePage: React.FC<MediaScenePageProps> = ({ onNavigate }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isBuffering,
    playSong,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const {
    activeSceneType,
    setActiveSceneType,
    isBackgroundActive,
    toggleBackgroundActive,
    backgroundDim,
    setBackgroundDim,
  } = useScene();

  const [starterTracks, setStarterTracks] = useState<Song[]>([]);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  // Fetch some starter songs to pick if nothing is playing
  useEffect(() => {
    let isMounted = true;
    api.getTrending().then((res) => {
      if (isMounted && res.success && res.sections.length > 0) {
        const songs: Song[] = [];
        for (const sec of res.sections) {
          for (const it of sec.items) {
            if ((it as Song).duration) {
              songs.push(it as Song);
              if (songs.length >= 6) break;
            }
          }
          if (songs.length >= 6) break;
        }
        setStarterTracks(songs);
      }
    }).catch(() => {
      // fallback
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seek(pos * duration);
  };

  const handleSeekMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverProgress(pos * duration);
  };

  const getSceneIcon = (type: SceneType) => {
    switch (type) {
      case 'stardust':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'waves':
        return <Waves className="w-4 h-4 text-purple-400" />;
      case 'aurora':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'rain':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'vinyl':
        return <Disc3 className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="flex-1 relative overflow-y-auto custom-scrollbar select-none flex flex-col justify-between p-4 sm:p-6 md:p-8 pb-32 md:pb-36 min-h-full">
      {/* Dynamic Background Scene Canvas */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <SceneCanvas
          sceneType={activeSceneType}
          dimOverlay={backgroundDim * 0.4}
          albumArt={currentTrack?.thumbnail}
        />
        {/* Soft radial overlay for contrast & readability */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090A0F]/50 to-[#090A0F]/85 pointer-events-none" />
      </div>

      {/* Top Bar: Scene Mode Switcher & Background Setting */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Media Scene</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Visualizer
              </span>
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Lingkungan audiovisual interaktif dengan pemutaran lossless stream
          </p>
        </div>

        {/* Global Background Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleBackgroundActive}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium border transition-all duration-200 ${
              isBackgroundActive
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/70 hover:text-white'
            }`}
            title="Gunakan scene animasi ini sebagai background utama aplikasi saat menjelajah"
          >
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                isBackgroundActive ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/30'
              }`}
            >
              {isBackgroundActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Jadikan Background Aplikasi</span>
          </button>
        </div>
      </div>

      {/* Scene Selectors Row */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 mb-6 custom-scrollbar">
        {(Object.keys(SCENES) as SceneType[]).map((type) => {
          const item = SCENES[type];
          const isSelected = activeSceneType === type;

          return (
            <button
              key={type}
              onClick={() => setActiveSceneType(type)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-white/15 text-white border-white/30 shadow-lg scale-[1.02]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border-white/[0.08]'
              }`}
            >
              {getSceneIcon(type)}
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Scene Showcase */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center my-auto">
        {currentTrack ? (
          /* Active Playing Track Card */
          <div className="w-full rounded-3xl bg-[#0D0F18]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Visualizer Artwork Showcase */}
            <div className="relative w-44 h-44 sm:w-56 sm:h-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl group border border-white/15">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              {/* Overlay animated equalizer */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4">
                <div className="flex items-center gap-1 h-6">
                  {[40, 75, 100, 60, 90, 45, 80].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full bg-cyan-400 ${
                        isPlaying ? 'animate-pulse' : 'opacity-40'
                      }`}
                      style={{
                        height: isPlaying ? `${h}%` : '20%',
                        animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  {isPlaying ? 'PLAYING' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Track Info & Interactive Player Controls */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm text-cyan-400 font-medium truncate mt-0.5">
                    {currentTrack.artists.map((a, i, arr) => (
                      <span
                        key={i}
                        onClick={() => a.id && onNavigate({ name: 'artist', id: a.id })}
                        className={a.id ? 'cursor-pointer hover:underline' : ''}
                      >
                        {a.name}
                        {i < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(currentTrack)}
                  className={`p-2.5 rounded-2xl border transition-colors shrink-0 ${
                    isFavorite(currentTrack.id)
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
                  title="Simpan ke Favorit"
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite(currentTrack.id) ? 'fill-rose-500' : ''}`}
                  />
                </button>
              </div>

              {/* Progress Bar & Seek */}
              <div className="my-4">
                <div
                  onClick={handleSeekClick}
                  onMouseMove={handleSeekMove}
                  onMouseLeave={() => setHoverProgress(null)}
                  className="relative w-full h-3 py-1 cursor-pointer flex items-center group/scrub"
                >
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative group-hover/scrub:h-2 transition-all">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div
                    className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md -translate-x-1/2 opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${progressPercent}%` }}
                  />
                  {hoverProgress !== null && (
                    <div
                      className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-[10px] font-mono text-white border border-white/10 shadow pointer-events-none"
                      style={{
                        left: `${Math.max(0, Math.min(100, (hoverProgress / (duration || 1)) * 100))}%`,
                      }}
                    >
                      {formatTime(hoverProgress)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-white/40 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={toggleShuffle}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isShuffle ? 'text-cyan-400 bg-white/10' : 'text-white/40 hover:text-white'
                    }`}
                    title="Acak"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={previous}
                    className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    title="Lagu Sebelumnya"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* Big Center Play/Pause */}
                <button
                  onClick={togglePlay}
                  disabled={isBuffering}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/25 flex items-center justify-center transition-all disabled:opacity-75"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isBuffering ? (
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-current text-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-current text-white ml-0.5" />
                  )}
                </button>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={next}
                    className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    title="Lagu Berikutnya"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    onClick={cycleRepeat}
                    className={`p-2.5 rounded-xl transition-colors ${
                      repeatMode !== 'off' ? 'text-cyan-400 bg-white/10' : 'text-white/40 hover:text-white'
                    }`}
                    title={`Ulangi: ${repeatMode}`}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/[0.08]">
                <button
                  onClick={toggleMute}
                  className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="w-28 h-1.5 bg-white/15 rounded-full relative overflow-hidden cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Pick a Starter Track */
          <div className="w-full max-w-xl text-center p-8 rounded-3xl bg-[#0D0F18]/85 backdrop-blur-2xl border border-white/10 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Music2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Belum Ada Lagu yang Diputar
            </h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 mb-6">
              Pilih salah satu lagu rekomendasi di bawah untuk mengaktifkan pemutaran audio lossless & animasi visualizer secara langsung.
            </p>

            {/* Quick Picks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left mb-4">
              {starterTracks.map((song) => (
                <div
                  key={song.id}
                  onClick={() => playSong(song, starterTracks)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer transition-all group"
                >
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {song.title}
                    </h5>
                    <p className="text-[10px] text-white/40 truncate">
                      {song.artists.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate({ name: 'home' })}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Atau cari lagu lainnya di Discover</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Scene Helper & Active Scene Details */}
      <div className="relative z-10 w-full max-w-4xl mx-auto mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-3">
        <div className="flex items-center gap-2">
          {getSceneIcon(activeSceneType)}
          <span className="font-medium text-white/70">{SCENES[activeSceneType].name}</span>
          <span>·</span>
          <span>{SCENES[activeSceneType].subtitle}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono">
            {isBackgroundActive ? 'Background Aktif' : 'Background Nonaktif'}
          </span>
          <button
            onClick={toggleBackgroundActive}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline transition-colors"
          >
            {isBackgroundActive ? 'Matikan Background' : 'Aktifkan Background'}
          </button>
        </div>
      </div>
    </div>
  );
};
