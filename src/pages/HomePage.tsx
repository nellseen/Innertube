import React, { useEffect, useState } from 'react';
import { Compass, Flame, Play, Sparkles, RefreshCw } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSong } = usePlayer();

  const loadHome = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHome();
      setSections(data.sections || []);
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
            Explore curated albums, top trending releases, and synchronized lyrics directly from the music engine.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate({ name: 'trending' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Flame className="w-4 h-4 fill-black" />
              Explore Trending
            </button>
            <button
              onClick={() => onNavigate({ name: 'search' })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs md:text-sm border border-white/15 transition-all"
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

      {/* Sections */}
      {!isLoading &&
        sections.map((sec, idx) => {
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
