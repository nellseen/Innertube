import React, { useEffect, useState } from 'react';
import { Play, Shuffle, Users, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import type { Artist, Song, Album, NavigationPage } from '../types/music.js';
import { api } from '../services/api.js';
import { SongRow } from '../components/cards/SongRow.js';
import { CardItem } from '../components/cards/CardItem.js';
import { usePlayer } from '../contexts/PlayerContext.js';

interface ArtistPageProps {
  artistId: string;
  onNavigate: (page: NavigationPage) => void;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({ artistId, onNavigate }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [singles, setSingles] = useState<Album[]>([]);
  const [related, setRelated] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreSongs, setIsLoadingMoreSongs] = useState(false);
  const [songsContinuation, setSongsContinuation] = useState<string | undefined>();
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playSong } = usePlayer();

  const loadArtist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getArtist(artistId);
      setArtist(data.artist);
      setSongs(data.topSongs);
      setAlbums(data.albums);
      setSingles(data.singles);
      setRelated(data.relatedArtists);

      // Check for artist songs continuation (Section 11)
      const songsData = await api.getArtistSongs(artistId).catch(() => null);
      if (songsData && songsData.items.length > 0) {
        setSongs(songsData.items);
        setSongsContinuation(songsData.continuation);
        setHasMoreSongs(songsData.hasMore);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load artist details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArtist();
  }, [artistId]);

  // Load more songs without artificial limit (Section 11)
  const handleLoadMoreSongs = async () => {
    if (!songsContinuation || isLoadingMoreSongs) return;
    setIsLoadingMoreSongs(true);
    try {
      const more = await api.getArtistSongs(artistId, songsContinuation);
      setSongs((prev) => [...prev, ...more.items]);
      setSongsContinuation(more.continuation);
      setHasMoreSongs(more.hasMore);
    } catch (err) {
      console.error('Failed to load more songs for artist', err);
    } finally {
      setIsLoadingMoreSongs(false);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const handleShuffleAll = () => {
    if (songs.length > 0) {
      const randomIdx = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIdx], songs, randomIdx);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white/40">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-mono">Loading artist catalog...</p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-rose-400 text-sm mb-4">{error || 'Artist not found'}</p>
        <button
          onClick={loadArtist}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/15"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      {/* Artist Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.08] p-6 md:p-10 mb-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-20 blur-3xl pointer-events-none -z-10"
          style={{
            backgroundImage: `url(${artist.thumbnail})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        {/* Artist Avatar */}
        <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full overflow-hidden shrink-0 shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-white/20">
          <img
            src={artist.thumbnail}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Artist Details */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            Verified Artist
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight truncate">
            {artist.name}
          </h1>

          {artist.subscribers && (
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-white/50 mt-1.5 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{artist.subscribers}</span>
            </div>
          )}

          {artist.description && (
            <p className="text-xs text-white/40 line-clamp-2 mt-2 max-w-2xl">
              {artist.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
            <button
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              Play All
            </button>
            <button
              onClick={handleShuffleAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs md:text-sm border border-white/15 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Songs Section */}
      {songs.length > 0 && (
        <section className="mb-10 max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Songs</h2>
            <span className="text-xs font-mono text-white/40">{songs.length} tracks loaded</span>
          </div>

          <div className="flex flex-col gap-1">
            {songs.map((song, i) => (
              <SongRow
                key={`${song.id}-${i}`}
                song={song}
                index={i}
                playlist={songs}
                onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
              />
            ))}
          </div>

          {/* Continuation (Section 11: no limit) */}
          {hasMoreSongs && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMoreSongs}
                disabled={isLoadingMoreSongs}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoadingMoreSongs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Loading more songs...</span>
                  </>
                ) : (
                  <span>Load More Artist Songs</span>
                )}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Albums Section */}
      {albums.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {albums.map((album) => (
              <CardItem
                key={album.id}
                item={album}
                type="album"
                onClick={() => onNavigate({ name: 'album', id: album.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Singles / EPs Section */}
      {singles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-4">Singles & EPs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {singles.map((single) => (
              <CardItem
                key={single.id}
                item={single}
                type="album"
                onClick={() => onNavigate({ name: 'album', id: single.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Artists Section */}
      {related.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-4">Fans Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {related.map((rel) => (
              <CardItem
                key={rel.id}
                item={rel}
                type="artist"
                onClick={() => onNavigate({ name: 'artist', id: rel.id })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
