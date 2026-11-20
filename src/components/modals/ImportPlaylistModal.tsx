import React, { useState } from 'react';
import { AlertCircle, Download, LoaderCircle, X } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext.js';
import { api } from '../../services/api.js';
import type { Song } from '../../types/music.js';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function extractPlaylistId(input: string): { id: string; url: string } {
  const value = input.trim();
  if (!value) throw new Error('Paste a YouTube or YouTube Music playlist link.');

  let id = value;
  let sourceUrl = '';
  if (/^https?:\/\//i.test(value)) {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error('That link is not valid.');
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)) {
      throw new Error('Use a link from youtube.com or music.youtube.com.');
    }
    id = parsed.searchParams.get('list') || '';
    if (!id && parsed.pathname.startsWith('/playlist/')) {
      id = parsed.pathname.split('/').filter(Boolean).at(-1) || '';
    }
    if (!id) throw new Error('This link does not contain a playlist ID.');
    sourceUrl = value;
  } else {
    if (!/^(?:VL|PL|RD|UU|LL|FL|WL|OLAK5)[A-Za-z0-9_-]{8,}$/.test(value)) {
      throw new Error('Paste a playlist URL or a valid playlist ID.');
    }
    sourceUrl = `https://music.youtube.com/playlist?list=${encodeURIComponent(value.replace(/^VL/, ''))}`;
    id = value;
  }

  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) throw new Error('The playlist ID is invalid.');
  const canonicalId = id.replace(/^VL/, '');
  return { id, url: `https://music.youtube.com/playlist?list=${encodeURIComponent(canonicalId)}` };
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { importPlaylist, playlists } = useLibrary();

  if (!isOpen) return null;

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsImporting(true);
    try {
      const source = extractPlaylistId(url);
      const page = await api.importPlaylist(source.id);
      const playlistInfo = page.playlist;
      const tracks: Song[] = page.tracks;

      if (tracks.length === 0) throw new Error('No playable tracks were found in that playlist.');
      const sourceId = source.id.replace(/^VL/, '');
      const isRefresh = playlists.some((playlist) => playlist.sourceId === sourceId);
      importPlaylist({
        sourceId,
        sourceUrl: source.url,
        name: playlistInfo.title || 'Imported playlist',
        description: playlistInfo.description,
        thumbnail: playlistInfo.thumbnail || tracks.find((track) => track.thumbnail)?.thumbnail,
        tracks,
      });

      setNotice(isRefresh
        ? `Updated the imported playlist with all ${tracks.length} tracks.`
        : `Imported all ${tracks.length} tracks.`);

      setUrl('');
      window.setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import this playlist. Check that it is public and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => { if (!isImporting) onClose(); }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-playlist-title"
        className="glass-modal max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="import-playlist-title" className="text-lg font-semibold text-white">Import a playlist</h2>
            <p className="mt-1 text-sm text-white/50">Copy a public YouTube or YouTube Music playlist into your library.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isImporting} aria-label="Close" className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label htmlFor="youtube-playlist-url" className="mb-2 block text-xs font-medium text-white/70">Playlist link or ID</label>
            <input
              id="youtube-playlist-url"
              type="text"
              inputMode="url"
              autoFocus
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://music.youtube.com/playlist?list=…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--accent-primary)]"
            />
            <p className="mt-2 text-xs text-white/40">Public playlists only. Imports the complete playlist and stores it in this browser.</p>
          </div>

          {error && <p role="alert" className="flex items-start gap-2 text-sm text-rose-300"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          {notice && <p role="status" className="text-sm text-[var(--accent-primary)]">{notice}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={isImporting} className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={isImporting || !url.trim()} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40">
              {isImporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isImporting ? 'Importing…' : 'Import'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
