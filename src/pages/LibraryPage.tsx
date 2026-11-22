import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Disc3, Heart, History, ListMusic, PlusCircle, Play, Search, Share2, Trash2, Upload, Users } from 'lucide-react';
import type { NavigationPage, Song } from '../types/music.js';
import { useLibrary } from '../contexts/LibraryContext.js';
import { api } from '../services/api.js';
import { usePlayer } from '../contexts/PlayerContext.js';
import { SongRow } from '../components/cards/SongRow.js';
import { ImportPlaylistModal } from '../components/modals/ImportPlaylistModal.js';

interface LibraryPageProps {
  initialTab?: 'favorites' | 'history' | 'playlists';
  onNavigate: (page: NavigationPage) => void;
  onCreatePlaylist: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  initialTab = 'favorites',
  onNavigate,
  onCreatePlaylist,
}) => {
  const [tab, setTab] = useState<'favorites' | 'history' | 'playlists' | 'following'>(initialTab);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'title' | 'duration'>('recent');
  const [backupNotice, setBackupNotice] = useState('');
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [followedUpdates, setFollowedUpdates] = useState<{ artistName: string; songs: Song[]; albums: { id: string; title: string; thumbnail: string }[] }[]>([]);
  const {
    favorites,
    history,
    playlists,
    followedArtists,
    followedAlbums,
    toggleFollowArtist,
    toggleFollowAlbum,
    exportBackup,
    importBackup,
    clearHistory,
    deletePlaylist,
    removeFromPlaylist,
  } = useLibrary();

  const { playSong } = usePlayer();

  useEffect(() => {
    let active = true;
    if (tab !== 'following' || followedArtists.length === 0) { setFollowedUpdates([]); return () => { active = false; }; }
    Promise.all(followedArtists.slice(0, 8).map(async (artist) => {
      try {
        const result = await api.getArtist(artist.id);
        return { artistName: artist.name, songs: result.success ? result.topSongs || [] : [], albums: result.success ? [...(result.albums || []), ...(result.singles || [])].slice(0, 4) : [] };
      } catch { return { artistName: artist.name, songs: [], albums: [] }; }
    })).then((updates) => { if (active) setFollowedUpdates(updates); });
    return () => { active = false; };
  }, [tab, followedArtists]);

  const handlePlayCollection = (songs: Song[]) => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const sortSongs = (songs: Song[]) => {
    const query = filterQuery.trim().toLowerCase();
    return songs.filter((song) => {
      const artistNames = Array.isArray(song.artists) ? song.artists.map((artist) => artist.name).join(' ') : '';
      return !query || (song.title + ' ' + artistNames).toLowerCase().includes(query);
    }).sort((a, b) => {
      if (sortOrder === 'title') return a.title.localeCompare(b.title);
      if (sortOrder === 'duration') return a.duration - b.duration;
      return 0;
    });
  };
  const visibleFavorites = useMemo(() => sortSongs(favorites), [favorites, filterQuery, sortOrder]);
  const visibleHistory = useMemo(() => sortSongs(history), [history, filterQuery, sortOrder]);
  const visiblePlaylistTracks = useMemo(() => sortSongs(selectedPlaylist?.tracks || []), [selectedPlaylist, filterQuery, sortOrder]);
  const visiblePlaylists = useMemo(() => playlists
    .filter((playlist) => !filterQuery || playlist.name.toLowerCase().includes(filterQuery.toLowerCase()))
    .sort((a, b) => sortOrder === 'title' ? a.name.localeCompare(b.name) : sortOrder === 'recent' ? b.createdAt - a.createdAt : a.tracks.length - b.tracks.length),
  [playlists, filterQuery, sortOrder]);

  const handleExportBackup = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aetheria-library-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Library backup downloaded');
    window.setTimeout(() => setBackupNotice(''), 3000);
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const summary = importBackup(await file.text());
      setBackupNotice('Restored ' + summary.favorites + ' favorites and ' + summary.playlists + ' playlists');
    } catch (error) {
      setBackupNotice(error instanceof Error ? error.message : 'Could not restore this backup');
    } finally {
      event.target.value = '';
      window.setTimeout(() => setBackupNotice(''), 5000);
    }
  };

  const handleSharePlaylist = async () => {
    if (!selectedPlaylist) return;
    const text = selectedPlaylist.tracks.map((song, index) => {
      const title = String(song.title || 'Unknown title');
      return (index + 1) + '. ' + title + ' - https://music.youtube.com/watch?v=' + encodeURIComponent(song.id);
    }).join('\n');
    const payload = {
      title: selectedPlaylist.name,
      text: text || selectedPlaylist.name,
      url: selectedPlaylist.sourceUrl,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText([selectedPlaylist.name, text].filter(Boolean).join('\n'));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText([selectedPlaylist.name, text].filter(Boolean).join('\n'));
      } catch {
        console.warn('Sharing is unavailable in this browser');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      {/* Title */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Library
          </h1>
          <p className="text-xs md:text-sm text-white/40">
            Personal favorites, listening history, and local collections
          </p>
        </div>

        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <button type="button" onClick={handleExportBackup} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.06]">
            <Download className="h-4 w-4" /> Backup
          </button>
          <button type="button" onClick={() => backupInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.06]">
            <Upload className="h-4 w-4" /> Restore
          </button>
          <input ref={backupInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImportBackup} />
          {tab === 'playlists' && (
            <>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-xs font-medium sm:flex-none text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Download className="h-4 w-4" />
              Import from YouTube
            </button>
            <button
              type="button"
              onClick={onCreatePlaylist}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-semibold sm:flex-none text-black transition-colors hover:bg-white/90"
            >
              <PlusCircle className="h-4 w-4" />
              New playlist
            </button>
            </>
          )}
        </div>
        {backupNotice && <p role="status" className="w-full text-right text-xs text-[var(--accent-primary)]">{backupNotice}</p>}
      </div>

      {/* Search and sorting apply to the selected Library collection. */}
      {tab !== 'following' && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder="Filter this collection"
              aria-label="Filter Library"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/35"
            />
          </label>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as 'recent' | 'title' | 'duration')}
            aria-label="Sort Library items"
            className="rounded-xl border border-white/10 bg-[#191a17] px-3 py-2 text-xs text-white/75"
          >
            <option value="recent">Recently added</option>
            <option value="title">Title A-Z</option>
            <option value="duration">Duration / track count</option>
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => {
            setTab('favorites');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'favorites'
              ? 'bg-white text-black shadow-lg scale-105'
              : 'glass-pill text-white/60 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${tab === 'favorites' ? 'text-rose-500 fill-rose-500' : 'text-rose-400 fill-rose-400/20'}`} />
          <span>Favorites</span>
          <span className={`text-[11px] font-mono ${tab === 'favorites' ? 'text-black/60' : 'text-white/30'}`}>({favorites.length})</span>
        </button>

        <button
          onClick={() => {
            setTab('history');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'history'
              ? 'bg-white text-black shadow-lg scale-105'
              : 'glass-pill text-white/60 hover:text-white'
          }`}
        >
          <History className={`w-4 h-4 ${tab === 'history' ? 'text-amber-500' : 'text-amber-400'}`} />
          <span>History</span>
          <span className={`text-[11px] font-mono ${tab === 'history' ? 'text-black/60' : 'text-white/30'}`}>({history.length})</span>
        </button>

        <button
          onClick={() => setTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'playlists'
              ? 'bg-white text-black shadow-lg scale-105'
              : 'glass-pill text-white/60 hover:text-white'
          }`}
        >
          <ListMusic className={`w-4 h-4 ${tab === 'playlists' ? 'text-cyan-600' : 'text-cyan-400'}`} />
          <span>Playlists</span>
          <span className={`text-[11px] font-mono ${tab === 'playlists' ? 'text-black/60' : 'text-white/30'}`}>({playlists.length})</span>
        </button>
        <button
          onClick={() => { setTab('following'); setSelectedPlaylistId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold glass-pill text-white/60 hover:text-white"
        >
          <Users className="h-4 w-4 text-[var(--accent-primary)]" />
          <span>Following</span>
          <span className="text-[11px] font-mono text-white/30">({followedArtists.length + followedAlbums.length})</span>
        </button>
      </div>

      {/* TAB 1: Favorites */}
      {tab === 'favorites' && (
        <section className="max-w-5xl">
          {favorites.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handlePlayCollection(visibleFavorites)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Play className="w-4 h-4 fill-black" />
                Play All Favorites
              </button>
            </div>
          )}

          {favorites.length === 0 ? (
            <div className="py-20 text-center text-white/30 flex flex-col items-center">
              <Heart className="w-12 h-12 stroke-[1.5] opacity-20 mb-3" />
              <p className="text-base font-semibold">No favorite tracks yet</p>
              <p className="text-xs text-white/20 mt-1 max-w-xs">
                Click the heart icon on any song while listening to pin it to your favorites.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {visibleFavorites.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={i}
                  playlist={favorites}
                  onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                  onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                  onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: History */}
      {tab === 'history' && (
        <section className="max-w-5xl">
          {history.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handlePlayCollection(visibleHistory)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Play className="w-4 h-4 fill-black" />
                Play History
              </button>
              <button
                onClick={clearHistory}
                className="text-xs text-white/40 hover:text-rose-400 transition-colors"
              >
                Clear History
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="py-20 text-center text-white/30 flex flex-col items-center">
              <History className="w-12 h-12 stroke-[1.5] opacity-20 mb-3" />
              <p className="text-base font-semibold">No recently played songs</p>
              <p className="text-xs text-white/20 mt-1 max-w-xs">
                Songs you play will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {visibleHistory.map((song, i) => (
                <SongRow
                  key={`${song.id}-${i}`}
                  song={song}
                  index={i}
                  playlist={history}
                  onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                  onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                  onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Playlists */}
      {tab === 'playlists' && (
        <section>
          {selectedPlaylist ? (
            <div className="max-w-5xl">
              <button
                onClick={() => setSelectedPlaylistId(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium mb-4 inline-flex items-center gap-1"
              >
                ← Back to all playlists
              </button>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {selectedPlaylist.name}
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    {selectedPlaylist.tracks.length} tracks • Created on{' '}
                    {new Date(selectedPlaylist.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlaylist.tracks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSharePlaylist}
                      aria-label="Share this playlist"
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-white/70 hover:bg-white/[0.06] hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  )}
                  {selectedPlaylist.tracks.length > 0 && (
                    <button
                      onClick={() => handlePlayCollection(selectedPlaylist.tracks)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      Play
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deletePlaylist(selectedPlaylist.id);
                      setSelectedPlaylistId(null);
                    }}
                    className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {selectedPlaylist.tracks.length === 0 ? (
                <div className="py-16 text-center text-white/30">
                  <p className="text-sm">This playlist has no songs yet</p>
                  <p className="text-xs text-white/20 mt-1">
                    Search for songs and choose "Add to Playlist"
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {visiblePlaylistTracks.map((song, i) => (
                    <div key={`${song.id}-${i}`} className="group relative">
                      <SongRow
                        song={song}
                        index={i}
                        playlist={selectedPlaylist.tracks}
                        onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                        onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                        onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                      />
                      {(song.practiceKey || typeof song.capo === 'number') && (
                        <p className="pl-14 pb-2 text-[11px] text-white/45">
                          Practice settings: {song.practiceKey ? 'Key ' + song.practiceKey : 'Key not set'}
                          {typeof song.capo === 'number' ? ' / Capo ' + song.capo : ''}
                          {song.tuning ? ' / Tuning ' + song.tuning : ''}
                          {song.strumming ? ' / Strum ' + song.strumming : ''}
                          {song.practiceNotes ? ' / ' + song.practiceNotes : ''}
                        </p>
                      )}
                      <button
                        onClick={() => removeFromPlaylist(selectedPlaylist.id, song.id)}
                        className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from playlist"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {visiblePlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer select-none flex flex-col justify-between aspect-square"
                >
                  <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-[var(--accent-primary)]">
                    {pl.thumbnail ? (
                      <img src={pl.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <ListMusic className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {pl.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/40">
                      {pl.tracks.length} tracks{pl.sourceId ? ' · Imported' : ''}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add New Playlist Card */}
              <div
                onClick={onCreatePlaylist}
                className="p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-white/25 transition-all cursor-pointer select-none flex flex-col items-center justify-center text-center aspect-square text-white/40 hover:text-white"
              >
                <PlusCircle className="w-8 h-8 mb-2" />
                <span className="text-xs font-semibold">New Playlist</span>
              </div>
            </div>
          )}
        </section>
      )}
      {tab === 'following' && (
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">Artists</h2>
            {followedArtists.length ? followedArtists.map((artist) => (
              <div key={artist.id} className="flex items-center gap-3 border-b border-white/[0.06] py-3">
                <img src={artist.thumbnail} alt="" className="h-11 w-11 rounded-full object-cover" />
                <button onClick={() => onNavigate({ name: 'artist', id: artist.id })} className="min-w-0 flex-1 truncate text-left text-sm text-white">{artist.name}</button>
                <button onClick={() => toggleFollowArtist(artist)} className="text-xs text-white/45 hover:text-white">Unfollow</button>
              </div>
            )) : <p className="text-sm text-white/40">Follow an artist to see them here.</p>}
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">Albums</h2>
            {followedAlbums.length ? followedAlbums.map((album) => (
              <div key={album.id} className="flex items-center gap-3 border-b border-white/[0.06] py-3">
                <img src={album.thumbnail} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <button onClick={() => onNavigate({ name: 'album', id: album.id })} className="min-w-0 flex-1 truncate text-left text-sm text-white">{album.title}</button>
                <button onClick={() => toggleFollowAlbum(album)} className="text-xs text-white/45 hover:text-white">Unfollow</button>
              </div>
            )) : <p className="text-sm text-white/40">Follow an album to see it here.</p>}
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold text-white">From artists you follow</h2>
            {followedUpdates.map((update) => (
              <div key={update.artistName} className="mb-5">
                <h3 className="mb-2 text-sm font-medium text-white/70">{update.artistName}</h3>
                <div className="flex flex-wrap gap-2">
                  {update.albums.map((album) => <button key={album.id} onClick={() => onNavigate({ name: 'album', id: album.id })} className="flex items-center gap-2 rounded-lg border border-white/10 p-2 text-left text-xs text-white/75 hover:bg-white/5"><img src={album.thumbnail} alt="" className="h-9 w-9 rounded object-cover" />{album.title}</button>)}
                  {update.songs.slice(0, 6).map((song, index) => <button key={song.id} onClick={() => playSong(song, update.songs, index)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"><Play className="mr-1 inline h-3 w-3" />{song.title}</button>)}
                </div>
              </div>
            ))}
            {!followedUpdates.length && <p className="text-sm text-white/40">Artist updates appear here when available.</p>}
          </div>
        </section>
      )}

      <ImportPlaylistModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};
