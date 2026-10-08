import React, { useEffect, useState } from 'react';
import { Flame, RefreshCw } from 'lucide-react';
import type { HomeSection, NavigationPage, Song, Album, Playlist, Artist } from '../types/music.js';
import { api } from '../services/api.js';
import { CardItem } from '../components/cards/CardItem.js';
import { SongRow } from '../components/cards/SongRow.js';
import { usePlayer } from '../contexts/PlayerContext.js';
import { toSafeText } from '../utils/text.js';

interface TrendingPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const TrendingPage: React.FC<TrendingPageProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSong } = usePlayer();

  const loadTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTrending();
      setSections(data.sections || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load trending music');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
            Trending & Charts
          </h1>
          <p className="text-xs md:text-sm text-white/40">
            Real-time top trending songs, viral hits, and global music rankings
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex flex-col gap-4">
              <div className="w-48 h-6 bg-white/5 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-white/[0.03] rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-3">
          <p className="text-sm text-rose-400 font-medium">{error}</p>
          <button
            onClick={loadTrending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/15 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {!isLoading &&
        sections.map((sec, idx) => {
          if (!sec.items || sec.items.length === 0) return null;

          const hasSongsOnly = sec.items.every((it) => /^[a-zA-Z0-9_-]{11}$/.test(it.id));

          return (
            <section key={idx} className="mb-10">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-4">
                {toSafeText(sec.title, 'Trending')}
              </h2>

              {hasSongsOnly ? (
                <div className="flex flex-col gap-1 max-w-4xl">
                  {sec.items.map((item, songIdx) => (
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {sec.items.map((item, itemIdx) => {
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
