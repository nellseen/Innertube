import React from 'react';
import { Music2, Play } from 'lucide-react';
import type { Album, Artist, Playlist, Song } from '../../types/music.js';
import { toSafeText } from '../../utils/text.js';

interface CardItemProps {
  item: Song | Album | Artist | Playlist;
  type?: 'song' | 'album' | 'artist' | 'playlist';
  onClick: () => void;
  onPlay?: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({ item, type, onClick, onPlay }) => {
  const isMoodCategory = item.id.startsWith('mood:');
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
  } else if (isMoodCategory) {
    subtitle = 'Explore music';
  } else if ('author' in item && (item as any).author) {
    subtitle = toSafeText((item as any).author);
  } else if ('year' in item && (item as any).year) {
    subtitle = `Album • ${toSafeText((item as any).year)}`;
  }

  return (
    <div className="group relative rounded-xl p-2 transition-colors hover:bg-white/[0.04]">
      <button
        type="button"
        onClick={onClick}
        aria-label={isMoodCategory ? `Explore ${title} music` : `Open ${title}`}
        className="w-full rounded-lg text-left focus-visible:outline-offset-2"
      >
        {isMoodCategory ? (
          <div className="mb-1 flex min-h-[68px] items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 transition-colors group-hover:bg-white/[0.05]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--accent-primary)]">
              <Music2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white/90 group-hover:text-white">{title}</span>
              <span className="mt-0.5 block truncate text-xs text-white/45">Explore music</span>
            </span>
          </div>
        ) : (
          <>
            <div className={`relative mb-3 aspect-square w-full overflow-hidden bg-white/[0.04] ${isArtist ? 'rounded-full' : 'rounded-lg'}`}>
              <img
                src={item.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="min-w-0">
              <h3 className={`truncate text-sm font-medium text-white/90 group-hover:text-white ${isArtist ? 'text-center' : ''}`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`mt-0.5 truncate text-xs text-white/50 ${isArtist ? 'text-center' : ''}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </>
        )}
      </button>
      {onPlay && !isMoodCategory && (
        <button
          type="button"
          aria-label={`Play ${title}`}
          onClick={onPlay}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black opacity-100 transition-transform hover:scale-105 active:scale-95 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          title="Play"
        >
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </button>
      )}
    </div>
  );
};
