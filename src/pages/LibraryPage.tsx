import React, { useState } from 'react';
import { Heart, History, ListMusic, PlusCircle, Play, Trash2 } from 'lucide-react';
import type { NavigationPage, Song } from '../types/music.js';
import { useLibrary } from '../contexts/LibraryContext.js';
import { usePlayer } from '../contexts/PlayerContext.js';
import { SongRow } from '../components/cards/SongRow.js';

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
  const [tab, setTab] = useState<'favorites' | 'history' | 'playlists'>(initialTab);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const {
    favorites,
    history,
    playlists,
    clearHistory,
    deletePlaylist,
    removeFromPlaylist,
  } = useLibrary();

  const { playSong } = usePlayer();

  const handlePlayCollection = (songs: Song[]) => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32 custom-scrollbar">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Library
          </h1>
          <p className="text-xs md:text-sm text-white/40">
            Personal favorites, listening history, and local collections
          </p>
        </div>

        {tab === 'playlists' && (
          <button
            onClick={onCreatePlaylist}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-black font-semibold text-xs hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            New Playlist
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => {
            setTab('favorites');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'favorites'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
          <span>Favorites</span>
          <span className="text-[11px] font-mono text-white/30">({favorites.length})</span>
        </button>

        <button
          onClick={() => {
            setTab('history');
            setSelectedPlaylistId(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'history'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>History</span>
          <span className="text-[11px] font-mono text-white/30">({history.length})</span>
        </button>

        <button
          onClick={() => setTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
            tab === 'playlists'
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4 text-cyan-400" />
          <span>Playlists</span>
          <span className="text-[11px] font-mono text-white/30">({playlists.length})</span>
        </button>
      </div>

      {/* TAB 1: Favorites */}
      {tab === 'favorites' && (
        <section className="max-w-5xl">
          {favorites.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handlePlayCollection(favorites)}
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
              {favorites.map((song, i) => (
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
                onClick={() => handlePlayCollection(history)}
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
              {history.map((song, i) => (
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
                  {selectedPlaylist.tracks.map((song, i) => (
                    <div key={`${song.id}-${i}`} className="group relative">
                      <SongRow
                        song={song}
                        index={i}
                        playlist={selectedPlaylist.tracks}
                        onNavigateToArtist={(id) => onNavigate({ name: 'artist', id })}
                        onNavigateToAlbum={(id) => onNavigate({ name: 'album', id })}
                        onNavigateToChord={(s) => onNavigate({ name: 'chords', song: s })}
                      />
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
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer select-none flex flex-col justify-between aspect-square"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-2">
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      {pl.tracks.length} tracks
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
    </div>
  );
};
