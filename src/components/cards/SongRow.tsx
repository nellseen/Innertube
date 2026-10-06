import React, { useState } from 'react';
import { Play, Pause, Heart, MoreVertical, ListPlus, Radio } from 'lucide-react';
import type { Song } from '../../types/music.js';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useLibrary } from '../../contexts/LibraryContext.js';

interface SongRowProps {
  song: Song;
  index?: number;
  playlist?: Song[];
  showAlbum?: boolean;
  onNavigateToArtist?: (artistId: string) => void;
  onNavigateToAlbum?: (albumId: string) => void;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  playlist,
  showAlbum = true,
  onNavigateToArtist,
  onNavigateToAlbum,
}) => {
  const { currentTrack, isPlaying, playSong, togglePlay, addToQueue, playNext } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
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
      className={`group relative flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none ${
        isCurrent
          ? 'bg-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-white/[0.12]'
          : 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05]'
      }`}
    >
      {/* Index or Play icon */}
      <div className="w-6 md:w-8 flex items-center justify-center shrink-0">
        {isCurrent ? (
          <button
            onClick={handlePlayClick}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isPlaying ? (
              <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_200ms] h-full" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_400ms] h-2/3" />
                <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-4/5" />
              </div>
            ) : (
              <Play className="w-4 h-4 fill-cyan-400" />
            )}
          </button>
        ) : (
          <>
            <span className="text-xs font-medium text-white/30 group-hover:hidden">
              {typeof index === 'number' ? index + 1 : '•'}
            </span>
            <button
              onClick={handlePlayClick}
              className="hidden group-hover:flex items-center justify-center text-white/80 hover:text-white"
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
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm md:text-base font-medium truncate ${
              isCurrent ? 'text-cyan-400' : 'text-white/90 group-hover:text-white'
            }`}
          >
            {song.title}
          </p>
          {song.isExplicit && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-white/60 rounded uppercase shrink-0">
              E
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-white/40 truncate">
          {(
            (Array.isArray(song.artists)
              ? song.artists
              : typeof (song as any).artist === 'string'
              ? [{ id: undefined, name: (song as any).artist }]
              : [{ id: undefined, name: 'Unknown Artist' }]) as { id?: string; name: string }[]
          ).map((a, i, arr) => (
            <React.Fragment key={i}>
              <span
                onClick={(e) => {
                  if (a.id && onNavigateToArtist) {
                    e.stopPropagation();
                    onNavigateToArtist(a.id);
                  }
                }}
                className={`hover:text-white/80 transition-colors ${
                  a.id ? 'hover:underline cursor-pointer' : ''
                }`}
              >
                {a.name}
              </span>
              {i < arr.length - 1 && ', '}
            </React.Fragment>
          ))}
        </p>
      </div>

      {/* Album (desktop only) */}
      {showAlbum && song.album && (
        <div className="hidden lg:block w-1/4 truncate text-xs text-white/40 pr-4">
          <span
            onClick={(e) => {
              if (song.album?.id && onNavigateToAlbum) {
                e.stopPropagation();
                onNavigateToAlbum(song.album.id);
              }
            }}
            className={`hover:text-white/80 transition-colors ${
              song.album?.id ? 'hover:underline cursor-pointer' : ''
            }`}
          >
            {song.album.name}
          </span>
        </div>
      )}

      {/* Duration */}
      <div className="text-xs font-mono text-white/30 shrink-0 hidden sm:block">
        {song.durationFormatted || '0:00'}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isFav
              ? 'text-rose-500 hover:text-rose-400'
              : 'text-white/20 hover:text-white/70 opacity-0 group-hover:opacity-100'
          }`}
          title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full text-white/20 hover:text-white/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[#161824]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5 z-40 text-xs flex flex-col gap-1"
            >
              <button
                onClick={() => {
                  playNext(song);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Play Next
              </button>
              <button
                onClick={() => {
                  addToQueue(song);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                Add to Queue
              </button>
              <button
                onClick={() => {
                  toggleFavorite(song);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                {isFav ? 'Favorited' : 'Favorite'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
