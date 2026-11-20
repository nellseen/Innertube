import React, { useEffect, useRef, useState } from 'react';
import { Compass, Flame, Play, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HomeSection, NavigationPage, Song, Album, Artist, Playlist } from '../types/music.js';
import { api } from '../services/api.js';
import { CardItem } from '../components/cards/CardItem.js';
import { SongRow } from '../components/cards/SongRow.js';
import { usePlayer } from '../contexts/PlayerContext.js';
import { toSafeText } from '../utils/text.js';

interface HomePageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSong } = usePlayer();
  const artistsScrollRef = useRef<HTMLDivElement>(null);
  const popularSectionRef = useRef<HTMLDivElement>(null);

  const scrollArtistsLeft = () => {
    if (artistsScrollRef.current) {
      artistsScrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollArtistsRight = () => {
    if (artistsScrollRef.current) {
      artistsScrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const loadHome = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [homeRes, artistsRes] = await Promise.allSettled([
        api.getHome(),
        api.getPopularArtists(),
      ]);

      if (homeRes.status === 'fulfilled') {
        setSections(homeRes.value.sections || []);
      } else {
        throw new Error(homeRes.reason?.message || 'Failed to load home feed');
      }

      if (artistsRes.status === 'fulfilled') {
        setPopularArtists(artistsRes.value.artists || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load home feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      {/* Clear entry point: one message, two useful actions */}
      <header className="mb-10 md:mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
            Aetheria <span className="mx-1.5 text-white/25">/</span> Listening room
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-white">
            Find your next repeat.
          </h1>
          <p className="mt-3 max-w-xl text-sm md:text-base leading-6 text-white/55">
            New discoveries, familiar favourites, and music worth keeping close.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate({ name: 'search' })}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-[#171811] transition-colors hover:brightness-110"
          >
            <Compass className="h-4 w-4" />
            Search music
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ name: 'trending' })}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            <Flame className="h-4 w-4" />
            Browse charts
          </button>
        </div>
      </header>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex flex-col gap-4">
              <div className="w-48 h-6 bg-white/5 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-white/[0.03] rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-rose-400 font-medium">{error}</p>
          <button
            onClick={loadHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/15 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Feed
          </button>
        </div>
      )}

      {/* Popular Artists Showcase */}
      {popularArtists.length > 0 && (
        <section ref={popularSectionRef} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Artists</p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white">
                Popular artists
              </h2>
            </div>

            {/* Scroll Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={scrollArtistsLeft}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollArtistsRight}
                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Artists Horizontal Carousel */}
          <div
            ref={artistsScrollRef}
            className="flex items-start gap-5 md:gap-7 overflow-x-auto pb-4 pt-1 -mx-2 px-2 custom-scrollbar scroll-smooth"
          >
            {popularArtists.map((artist) => {
              const handleArtistPlay = async () => {
                try {
                  const data = await api.getArtist(artist.id);
                  if (data?.topSongs?.length) {
                    playSong(data.topSongs[0], data.topSongs, 0);
                  }
                } catch (err) {
                  console.error('Failed to play artist songs:', err);
                }
              };

              return (
                <div key={artist.id} className="group relative w-24 shrink-0 select-none sm:w-28">
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: 'artist', id: artist.id })}
                    aria-label={`Open ${artist.name}`}
                    className="flex w-full flex-col items-center gap-2 rounded-lg text-center focus-visible:outline-offset-4"
                  >
                    <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-white/[0.04] sm:h-24 sm:w-24 md:h-28 md:w-28">
                      <img
                        src={artist.thumbnail}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="w-full truncate text-xs font-medium text-white/85 group-hover:text-white sm:text-sm">
                      {typeof artist.name === 'string' ? artist.name : ''}
                    </span>
                    <span className="w-full truncate text-[11px] text-white/45">
                      {typeof artist.subscribers === 'string' ? artist.subscribers.replace(/^Artist\s*•?\s*/i, '') : 'Artist'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleArtistPlay}
                    aria-label={`Play top songs by ${artist.name}`}
                    className="absolute right-0 top-12 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#171811] opacity-100 transition-transform duration-150 hover:scale-105 sm:top-16 sm:scale-90 sm:opacity-0 sm:group-hover:scale-100 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 md:top-20"
                  >
                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sections */}
      {!isLoading &&
        sections
          .filter((sec) => !toSafeText(sec.title).toLowerCase().includes('popular artist'))
          .map((sec, idx) => {
            if (!sec.items || sec.items.length === 0) return null;

            const hasSongsOnly = sec.items.every((it) => /^[a-zA-Z0-9_-]{11}$/.test(it.id));

            return (
              <section key={idx} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-white tracking-tight">
                    {toSafeText(sec.title, 'Featured')}
                  </h2>
                </div>

                {hasSongsOnly && sec.items.length <= 6 ? (
                  // Render as compact song rows
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sec.items.slice(0, 6).map((item, songIdx) => (
                      <SongRow
                        key={(item as Song).id}
                        song={item as Song}
                        index={songIdx}
                        playlist={sec.items as Song[]}
                        onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                        onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                        onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                      />
                    ))}
                  </div>
                ) : (
                  // Render as card grid
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {sec.items.slice(0, 12).map((item, itemIdx) => {
                      const isSong = ('duration' in item || 'durationFormatted' in item) && /^[a-zA-Z0-9_-]{11}$/.test(item.id);
                      const isArtist = 'subscribers' in item || (!('title' in item) && 'name' in item) || item.id.startsWith('UC');
                      const isAlbum = ('year' in item && 'artists' in item) || item.id.startsWith('MPREb') || item.id.startsWith('MPED');
                      const isPlaylist = !isSong && !isArtist && !isAlbum;

                      const handleItemClick = () => {
                        if (isSong) {
                          playSong(item as Song, sec.items.filter((x) => /^[a-zA-Z0-9_-]{11}$/.test(x.id)) as Song[]);
                        } else if (isArtist) {
                          onNavigate({ name: 'artist', id: item.id });
                        } else if (isAlbum) {
                          onNavigate({ name: 'album', id: item.id });
                        } else if (isPlaylist) {
                          onNavigate({ name: 'playlist', id: item.id });
                        }
                      };

                      const handlePlay = async () => {
                        if (isSong) {
                          playSong(item as Song, sec.items.filter((x) => /^[a-zA-Z0-9_-]{11}$/.test(x.id)) as Song[]);
                        } else if (isPlaylist) {
                          const pl = await api.getPlaylist(item.id).catch(() => null);
                          if (pl?.tracks?.length) {
                            playSong(pl.tracks[0], pl.tracks, 0);
                          }
                        } else if (isAlbum) {
                          const al = await api.getAlbum(item.id).catch(() => null);
                          if (al?.tracks?.length) {
                            playSong(al.tracks[0], al.tracks, 0);
                          }
                        } else if (isArtist) {
                          const art = await api.getArtist(item.id).catch(() => null);
                          if (art?.topSongs?.length) {
                            playSong(art.topSongs[0], art.topSongs, 0);
                          }
                        }
                      };

                      return (
                        <CardItem
                          key={itemIdx}
                          item={item}
                          type={isArtist ? 'artist' : isAlbum ? 'album' : isPlaylist ? 'playlist' : 'song'}
                          onClick={handleItemClick}
                          onPlay={handlePlay}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
    </div>
  );
};
