import React, { useEffect, useState } from 'react';
import { Play, Shuffle, ListMusic, Loader2, RefreshCw } from 'lucide-react';
import type { Playlist, Song, NavigationPage } from '../types/music.js';
import { api } from '../services/api.js';
import { SongRow } from '../components/cards/SongRow.js';
import { usePlayer } from '../contexts/PlayerContext.js';

interface PlaylistPageProps {
  playlistId: string;
  onNavigate: (page: NavigationPage) => void;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({ playlistId, onNavigate }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [continuation, setContinuation] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playSong } = usePlayer();

  const loadPlaylist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getPlaylist(playlistId);
      setPlaylist(data.playlist);
      setTracks(data.tracks);
      setContinuation(data.continuation);
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err?.message || 'Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const handleLoadMore = async () => {
    if (!continuation || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await api.getPlaylist(playlistId, continuation);
      setTracks((prev) => [...prev, ...data.tracks]);
      setContinuation(data.continuation);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more playlist tracks', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playSong(tracks[0], tracks, 0);
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      playSong(tracks[randomIdx], tracks, randomIdx);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white/40">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-mono">Loading playlist tracks...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-rose-400 text-sm mb-4">{error || 'Playlist not found'}</p>
        <button
          onClick={loadPlaylist}
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
      {/* Playlist Header */}
      <div className="relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.08] p-6 md:p-8 mb-8 shadow-2xl flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-8">
        {/* Glow */}
        <div
          className="absolute inset-0 opacity-20 blur-3xl pointer-events-none -z-10"
          style={{
            backgroundImage: `url(${playlist.thumbnail})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        {/* Artwork */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/20">
          <img
            src={playlist.thumbnail}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold mb-2">
            <ListMusic className="w-3 h-3 text-cyan-400" />
            <span>Playlist</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight truncate">
            {typeof playlist.title === 'string' ? playlist.title : ''}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-white/60 mt-2">
            {playlist.author && typeof playlist.author === 'string' && <span className="font-semibold text-white/90">{playlist.author}</span>}
            <span>• {tracks.length} tracks</span>
          </div>

          {playlist.description && typeof playlist.description === 'string' && (
            <p className="text-xs text-white/40 line-clamp-2 mt-2 max-w-xl">
              {playlist.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-6">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              Play All
            </button>
            <button
              onClick={handleShuffleAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs md:text-sm border border-white/15 transition-all disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <section className="max-w-5xl">
        <div className="flex flex-col gap-1">
          {tracks.map((track, i) => (
            <SongRow
              key={`${track.id}-${i}`}
              song={track}
              index={i}
              playlist={tracks}
              onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
              onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
              onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
            />
          ))}
        </div>

        {/* Continuation */}
        {hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading more tracks...</span>
                </>
              ) : (
                <span>Load More Playlist Tracks</span>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
