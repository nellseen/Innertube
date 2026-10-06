import React, { useEffect, useRef, useState } from 'react';
import { Compass, Flame, Play, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { HomeSection, NavigationPage, Song, Album, Artist, Playlist } from '../types/music.js';
import { api } from '../services/api.js';
import { CardItem } from '../components/cards/CardItem.js';
import { SongRow } from '../components/cards/SongRow.js';
import { usePlayer } from '../contexts/PlayerContext.js';

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
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-purple-950/40 border border-white/[0.08] p-6 md:p-8 mb-8 shadow-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover YouTube Music with Innertube</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            Immersive Sound.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
              Glassmorphism Aesthetic.
            </span>
          </h1>
          <p className="text-xs md:text-sm text-white/50 mb-6">
            Explore popular artists, curated albums, trending releases, and synchronized lyrics directly from the music engine.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate({ name: 'trending' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Flame className="w-4 h-4 fill-black" />
              Explore Trending
            </button>
            <button
              onClick={() => {
                popularSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs md:text-sm border border-white/15 transition-all"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Popular Artists
            </button>
            <button
              onClick={() => onNavigate({ name: 'search' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-medium text-xs md:text-sm border border-white/10 transition-all"
            >
              <Compass className="w-4 h-4" />
              Search Library
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
      </div>

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
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-3">
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
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Trending Icons</span>
                <span aria-hidden="true" className="text-white/20">·</span>
                <span className="text-white/40">Top Charting Worldwide</span>
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                Popular Artists
              </h2>
            </div>

            {/* Scroll Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={scrollArtistsLeft}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollArtistsRight}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Artists Horizontal Carousel */}
          <div
            ref={artistsScrollRef}
            className="flex items-stretch gap-3 md:gap-4 overflow-x-auto pb-4 pt-1 -mx-2 px-2 custom-scrollbar scroll-smooth"
          >
            {popularArtists.map((artist) => {
              const handleArtistPlay = async (e: React.MouseEvent) => {
                e.stopPropagation();
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
                <div
                  key={artist.id}
                  onClick={() => onNavigate({ name: 'artist', id: artist.id })}
                  className="group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-3xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-cyan-500/30 transition-all duration-300 cursor-pointer shrink-0 w-32 sm:w-36 md:w-40 select-none hover:-translate-y-1 shadow-lg"
                >
                  {/* Circular Avatar */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 bg-white/5 border border-white/10 group-hover:border-cyan-400/50 shadow-md transition-colors duration-300">
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    {/* Hover play button */}
                    <button
                      onClick={handleArtistPlay}
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 active:scale-95"
                      title={`Play top songs by ${artist.name}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </button>
                  </div>

                  {/* Name */}
                  <h3 className="w-full text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white truncate transition-colors">
                    {artist.name}
                  </h3>

                  {/* Unboxed audience metadata */}
                  <p className="w-full text-[10px] sm:text-[11px] text-white/40 truncate mt-0.5">
                    {artist.subscribers ? artist.subscribers.replace(/^Artist\s*•?\s*/i, '') : 'Artist'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sections */}
      {!isLoading &&
        sections
          .filter((sec) => !sec.title?.toLowerCase().includes('popular artist'))
          .map((sec, idx) => {
            if (!sec.items || sec.items.length === 0) return null;

            const hasSongsOnly = sec.items.every((it) => /^[a-zA-Z0-9_-]{11}$/.test(it.id));

            return (
              <section key={idx} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    {sec.title}
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
