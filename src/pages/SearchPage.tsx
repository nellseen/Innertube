import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, Loader2, Sparkles } from 'lucide-react';
import type { NavigationPage, SearchResults, Song, Album, Artist, Playlist } from '../types/music.js';
import { api } from '../services/api.js';
import { SongRow } from '../components/cards/SongRow.js';
import { CardItem } from '../components/cards/CardItem.js';
import { usePlayer } from '../contexts/PlayerContext.js';

interface SearchPageProps {
  initialQuery?: string;
  onNavigate: (page: NavigationPage) => void;
}

type FilterType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export const SearchPage: React.FC<SearchPageProps> = ({ initialQuery = '', onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [continuation, setContinuation] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { playSong } = usePlayer();

  // Search executor with AbortController (Section 25)
  const performSearch = useCallback(
    async (searchQuery: string, filter: FilterType) => {
      if (!searchQuery.trim()) {
        setResults({ songs: [], artists: [], albums: [], playlists: [] });
        setContinuation(undefined);
        setHasMore(false);
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const filterParam = filter === 'all' ? undefined : filter;
        const data = await api.search(searchQuery.trim(), filterParam, undefined, controller.signal);

        setResults(data.results);
        setContinuation(data.continuation);
        setHasMore(data.hasMore);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Search failed');
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced query effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeFilter, performSearch]);

  // Load more continuation (Section 6)
  const handleLoadMore = async () => {
    if (!continuation || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const filterParam = activeFilter === 'all' ? undefined : activeFilter;
      const data = await api.search(query.trim(), filterParam, continuation);

      setResults((prev) => ({
        songs: [...prev.songs, ...data.results.songs],
        artists: [...prev.artists, ...data.results.artists],
        albums: [...prev.albums, ...data.results.albums],
        playlists: [...prev.playlists, ...data.results.playlists],
      }));
      setContinuation(data.continuation);
      setHasMore(data.hasMore);
    } catch (err: any) {
      console.error('Failed to load more results', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'Top Results' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
    { id: 'playlists', label: 'Playlists' },
  ];

  const hasAnyResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 w-5 h-5 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums, or playlists..."
            autoFocus
            className="w-full h-13 pl-12 pr-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] focus:border-cyan-400/50 focus:bg-white/[0.08] text-white placeholder-white/30 text-sm md:text-base outline-none transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 rounded-full text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 custom-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all shrink-0 ${
                activeFilter === f.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/40">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <p className="text-xs font-mono">Searching YouTube Music catalog...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-white/[0.02] border border-rose-500/20 text-center text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty prompt */}
      {!query && !isLoading && (
        <div className="max-w-md mx-auto text-center py-20 flex flex-col items-center text-white/30">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-base font-semibold text-white/70">Find What Moves You</h3>
          <p className="text-xs text-white/30 max-w-xs mt-1">
            Search for favorite tracks, legendary artists, full albums, or community playlists.
          </p>
        </div>
      )}

      {/* Results view */}
      {!isLoading && query && hasAnyResults && (
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          {/* Songs section */}
          {(activeFilter === 'all' || activeFilter === 'songs') && results.songs.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Songs</h2>
              <div className="flex flex-col gap-1">
                {results.songs.map((song, i) => (
                  <SongRow
                    key={`${song.id}-${i}`}
                    song={song}
                    index={i}
                    playlist={results.songs}
                    onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                    onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                    onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Artists section */}
          {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {results.artists.map((artist) => (
                  <CardItem
                    key={artist.id}
                    item={artist}
                    type="artist"
                    onClick={() => onNavigate({ name: 'artist', id: artist.id })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Albums section */}
          {(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {results.albums.map((album) => (
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

          {/* Playlists section */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && results.playlists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Playlists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {results.playlists.map((playlist) => (
                  <CardItem
                    key={playlist.id}
                    item={playlist}
                    type="playlist"
                    onClick={() => onNavigate({ name: 'playlist', id: playlist.id })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Load More Button (Continuation, Section 6) */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More Results</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {!isLoading && query && !hasAnyResults && (
        <div className="max-w-md mx-auto text-center py-20 text-white/40">
          <p className="text-base font-semibold">No results found for "{query}"</p>
          <p className="text-xs text-white/30 mt-1">Try another search term or remove filters.</p>
        </div>
      )}
    </div>
  );
};
