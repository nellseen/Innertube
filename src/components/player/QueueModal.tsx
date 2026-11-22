import React, { useState } from 'react';
import { X, Trash2, Music } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext.js';
import { useLibrary } from '../../contexts/LibraryContext.js';
import { SongRow } from '../cards/SongRow.js';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArtist?: (artistId: string) => void;
  onNavigateToAlbum?: (albumId: string) => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  onNavigateToArtist,
  onNavigateToAlbum,
}) => {
  const { queue, currentTrack, currentIndex, clearQueue } = usePlayer();
  const { createPlaylist, addToPlaylist } = useLibrary();
  const [setlistName, setSetlistName] = useState('');
  const [savedSetlist, setSavedSetlist] = useState(false);

  const saveQueueAsSetlist = () => {
    const songs = queue.length ? queue : currentTrack ? [currentTrack] : [];
    if (!songs.length) return;
    const name = setlistName.trim() || ('Practice setlist ' + new Date().toLocaleDateString());
    const playlistId = createPlaylist(name, 'Practice setlist saved from the playback queue.');
    songs.forEach((song) => addToPlaylist(playlistId, song));
    setSavedSetlist(true);
    setSetlistName('');
    window.setTimeout(() => setSavedSetlist(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-surface border-l border-white/[0.1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-tight">Queue</h3>
          <span className="text-xs font-mono text-white/30">({queue.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-white/[0.05] transition-colors"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Save a listening queue as a reusable practice setlist. */}
      <form
        className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]"
        onSubmit={(event) => { event.preventDefault(); saveQueueAsSetlist(); }}
      >
        <input
          aria-label="Practice setlist name"
          value={setlistName}
          onChange={(event) => setSetlistName(event.target.value)}
          placeholder="Name this practice setlist"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-black/20 px-3 py-2 text-xs text-white placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={!queue.length && !currentTrack}
          className="shrink-0 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savedSetlist ? <span role="status">Saved</span> : 'Save setlist'}
        </button>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        {/* Now Playing section */}
        {currentTrack && (
          <div>
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
              Now Playing
            </h4>
            <SongRow
              song={currentTrack}
              showAlbum={false}
              onNavigateToArtist={onNavigateToArtist}
              onNavigateToAlbum={onNavigateToAlbum}
            />
          </div>
        )}

        {/* Next in queue section */}
        <div className="flex-1 flex flex-col">
          <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
            Next Up
          </h4>
          {queue.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/30">
              <p className="text-sm font-medium">Your queue is empty</p>
              <p className="text-xs text-white/20 mt-1">
                Add songs or albums to keep the music playing
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {queue.map((song, i) => {
                if (i === currentIndex) return null;
                return (
                  <SongRow
                    key={`${song.id}-${i}`}
                    song={song}
                    index={i}
                    playlist={queue}
                    showAlbum={false}
                    onNavigateToArtist={onNavigateToArtist}
                    onNavigateToAlbum={onNavigateToAlbum}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
