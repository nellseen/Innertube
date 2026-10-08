import React from 'react';
import { Play } from 'lucide-react';
import type { Album, Artist, Playlist, Song } from '../../types/music.js';

interface CardItemProps {
  item: Song | Album | Artist | Playlist;
  type?: 'song' | 'album' | 'artist' | 'playlist';
  onClick: () => void;
  onPlay?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({ item, type, onClick, onPlay }) => {
  const isArtist =
    type === 'artist' ||
    ('name' in item && !('title' in item)) ||
    ('subscribers' in item && typeof item.subscribers === 'string');

  const rawTitle = 'title' in item ? item.title : 'name' in item ? item.name : 'Unknown';
  const title = typeof rawTitle === 'string' ? rawTitle : typeof (rawTitle as any)?.text === 'string' ? (rawTitle as any).text : '';
  let subtitle = '';

  if (isArtist) {
    subtitle = 'Artist';
  } else if ('artists' in item && Array.isArray(item.artists)) {
    subtitle = item.artists.map((a: any) => (typeof a === 'string' ? a : typeof a?.name === 'string' ? a.name : '')).filter(Boolean).join(', ');
  } else if ('artist' in item && typeof (item as any).artist === 'string') {
    subtitle = (item as any).artist;
  } else if ('author' in item && typeof item.author === 'string') {
    subtitle = item.author;
  } else if ('year' in item && typeof item.year === 'string') {
    subtitle = `Album • ${item.year}`;
  }

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-pointer select-none"
    >
      {/* Artwork container */}
      <div
        className={`relative w-full aspect-square overflow-hidden mb-3 bg-white/5 shadow-md ${
          isArtist ? 'rounded-full' : 'rounded-xl'
        }`}
      >
        <img
          src={item.thumbnail}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Hover play button */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
            title="Play"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h4
          className={`text-sm font-semibold truncate text-white/90 group-hover:text-white transition-colors ${
            isArtist ? 'text-center' : ''
          }`}
        >
          {title}
        </h4>
        {subtitle && (
          <p
            className={`text-xs text-white/40 truncate mt-0.5 ${
              isArtist ? 'text-center' : ''
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
