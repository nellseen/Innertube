import React, { useState } from 'react';
import { Play, Pause, Heart, MoreVertical, ListPlus, Radio, Guitar } from 'lucide-react';
import type { Song } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useLibrary } from '../../contexts/LibraryContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { toSafeText } from '../../utils/text.js';

interface SongRowProps {
  song: Song;
  index?: number;
  playlist?: Song[];
  showAlbum?: boolean;
  onNavigateToArtist?: (artistId: string) => void;
  onNavigateToAlbum?: (albumId: string) => void;
  onNavigateToChord?: (song: Song) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  playlist,
  showAlbum = true,
  onNavigateToArtist,
  onNavigateToAlbum,
  onNavigateToChord,
}) => {
  const { currentTrack, isPlaying, playSong, togglePlay, addToQueue, playNext } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const { themeConfig } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === song.id;
  const isFav = isFavorite(song.id);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlist, index);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlayClick(e as any);
        }
      }}
      className={`group relative flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
        isCurrent
          ? 'bg-white/[0.1] border border-white/[0.18] shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md'
          : 'hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08]'
      }`}
    >
      {/* Index or Animated Sound Waves */}
      <div className="w-6 md:w-8 flex items-center justify-center shrink-0">
        {isCurrent ? (
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="transition-colors"
            style={{ color: themeConfig.accentPrimary }}
          >
            {isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                <span
                  className="w-1 rounded-full animate-[bounce_0.8s_infinite_200ms] h-full"
                  style={{ backgroundColor: themeConfig.accentPrimary }}
                />
                <span
                  className="w-1 rounded-full animate-[bounce_0.8s_infinite_400ms] h-2/3"
                  style={{ backgroundColor: themeConfig.accentPrimary }}
                />
                <span
                  className="w-1 rounded-full animate-[bounce_0.8s_infinite_100ms] h-4/5"
                  style={{ backgroundColor: themeConfig.accentPrimary }}
                />
              </div>
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
          </button>
        ) : (
          <>
            <span className="text-xs font-mono text-white/30 group-hover:hidden">
              {typeof index === 'number' ? String(index + 1).padStart(2, '0') : '•'}
            </span>
            <button
              type="button"
              onClick={handlePlayClick}
              aria-label={`Play ${toSafeText(song.title)}`}
              className="hidden group-hover:flex items-center justify-center text-white/90 hover:text-white"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 shadow-sm">
        <img
          src={song.thumbnail}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isCurrent && isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: themeConfig.accentPrimary }}
            />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-2">
        <h4
          className={`text-sm font-semibold truncate transition-colors ${
            isCurrent ? 'text-white font-bold' : 'text-white/90 group-hover:text-white'
          }`}
          style={{
            color: isCurrent ? themeConfig.accentPrimary : undefined,
          }}
        >
          {toSafeText(song.title, 'Unknown Title')}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-white/45 truncate mt-0.5">
          {((Array.isArray(song.artists)
            ? song.artists
            : typeof (song as any).artist === 'string'
            ? [{ name: (song as any).artist }]
            : [{ name: 'Unknown Artist' }]) as { id?: string; name: string }[]
          ).map((a, i, arr) => (
            <span
              key={i}
              onClick={(e) => {
                if (a.id && onNavigateToArtist) {
                  e.stopPropagation();
                  onNavigateToArtist(a.id);
                }
              }}
              className={`hover:text-white/80 transition-colors ${
                a.id ? 'cursor-pointer hover:underline' : ''
              }`}
            >
              {toSafeText(a?.name, 'Unknown Artist')}
              {i < arr.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Album (Desktop) */}
      {showAlbum && song.album && (
        <div className="hidden lg:block w-1/4 truncate text-xs text-white/40 hover:text-white/70 transition-colors">
          <span
            onClick={(e) => {
              if (song.album?.id && onNavigateToAlbum) {
                e.stopPropagation();
                onNavigateToAlbum(song.album.id);
              }
            }}
            className={song.album?.id ? 'cursor-pointer hover:underline' : ''}
          >
            {toSafeText(song.album.name || (song.album as any).title)}
          </span>
        </div>
      )}

      {/* Duration */}
      <div className="text-xs font-mono text-white/40 group-hover:text-white/60 transition-colors shrink-0">
        {song.duration || '--:--'}
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chord Shortcut */}
        {onNavigateToChord && (
          <button
            type="button"
            onClick={() => onNavigateToChord(song)}
            className="p-2 rounded-xl text-white/30 hover:text-amber-400 hover:bg-white/[0.08] transition-all opacity-0 group-hover:opacity-100"
            title="Lihat Chord & Lirik"
            aria-label="Chord & Lirik"
          >
            <Guitar className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Favorite */}
        <button
          type="button"
          onClick={() => toggleFavorite(song)}
          className={`p-2 rounded-xl transition-all ${
            isFav
              ? 'text-rose-500 hover:text-rose-400'
              : 'text-white/25 hover:text-white/80 opacity-0 group-hover:opacity-100'
          }`}
          title={isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
          aria-label={isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Menu Opsi"
            aria-label="Menu Opsi Lagu"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-2xl glass-surface p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    addToQueue(song);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors w-full text-left"
                >
                  <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                  Tambah ke Antrean
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playNext(song);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors w-full text-left"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Putar Berikutnya
                </button>

                {onNavigateToChord && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToChord(song);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-amber-300 hover:bg-white/[0.08] transition-colors w-full text-left"
                  >
                    <Guitar className="w-3.5 h-3.5 text-amber-400" />
                    Buka Chord & Lirik
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
