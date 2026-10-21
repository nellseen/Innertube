import React from 'react';
import { Play } from 'lucide-react';
import type { Album, Artist, Playlist, Song } from '../../types/music.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { toSafeText } from '../../utils/text.js';

interface CardItemProps {
  item: Song | Album | Artist | Playlist;
  type?: 'song' | 'album' | 'artist' | 'playlist';
  onClick: () => void;
  onPlay?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({ item, type, onClick, onPlay }) => {
  const { themeConfig } = useTheme();

  const isArtist =
    type === 'artist' ||
    ('name' in item && !('title' in item)) ||
    ('subscribers' in item && typeof item.subscribers === 'string');

  const rawTitle = 'title' in item ? (item as any).title : 'name' in item ? (item as any).name : 'Unknown';
  const title = toSafeText(rawTitle, 'Unknown');
  let subtitle = '';

  if (isArtist) {
    subtitle = 'Artist';
  } else if ('artists' in item && Array.isArray((item as any).artists)) {
    subtitle = (item as any).artists
      .map((a: any) => toSafeText(typeof a === 'string' ? a : a?.name || a?.text || a))
      .filter(Boolean)
      .join(', ');
  } else if ('artist' in item && (item as any).artist) {
    subtitle = toSafeText((item as any).artist);
  } else if ('author' in item && (item as any).author) {
    subtitle = toSafeText((item as any).author);
  } else if ('year' in item && (item as any).year) {
    subtitle = `Album • ${toSafeText((item as any).year)}`;
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col p-3 rounded-2xl glass-card cursor-pointer select-none"
    >
      {/* Artwork container */}
      <div
        className={`relative w-full aspect-square overflow-hidden mb-3 bg-white/5 shadow-md ${
          isArtist ? 'rounded-full' : 'rounded-2xl'
        }`}
      >
        <img
          src={item.thumbnail}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Hover play button with theme gradient */}
        {onPlay && (
          <button
            type="button"
            aria-label={`Play ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full text-black shadow-xl flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#ffffff' }}
            title="Play"
          >
            <Play
              className="w-4 h-4 fill-current ml-0.5"
              style={{ color: '#000000' }}
            />
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
