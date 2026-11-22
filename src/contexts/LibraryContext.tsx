import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Song, CustomPlaylist } from '../types/music.js';
import { toSafeText } from '../utils/text.js';

interface LibraryContextType {
  favorites: Song[];
  history: Song[];
  playlists: CustomPlaylist[];
  toggleFavorite: (song: Song) => void;
  isFavorite: (songId: string) => boolean;
  addToHistory: (song: Song) => void;
  clearHistory: () => void;
  createPlaylist: (name: string, description?: string) => string;
  importPlaylist: (playlist: { sourceId: string; sourceUrl: string; name: string; description?: string; thumbnail?: string; tracks: Song[] }) => string;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const STORAGE_KEYS = {
  FAVORITES: 'aetheria_favorites',
  HISTORY: 'aetheria_history',
  PLAYLISTS: 'aetheria_playlists',
};

function sanitizeSong(s: any): Song {
  if (!s || typeof s !== 'object') {
    return {
      id: '',
      title: 'Unknown Title',
      artists: [{ name: 'Unknown Artist' }],
      duration: 0,
      durationFormatted: '0:00',
      thumbnail: '',
    };
  }

  const artists: { id?: string; name: string }[] = [];
  if (Array.isArray(s.artists)) {
    for (const a of s.artists) {
      const aName = toSafeText(typeof a === 'string' ? a : a?.name || a?.text || a);
      if (aName) {
        artists.push({ id: a?.id, name: aName });
      }
    }
  } else if (s.artist) {
    const aName = toSafeText(s.artist);
    if (aName) artists.push({ name: aName });
  }

  return {
    ...s,
    id: typeof s.id === 'string' ? s.id : '',
    title: toSafeText(s.title, 'Unknown Title'),
    artists: artists.length > 0 ? artists : [{ name: 'Unknown Artist' }],
    thumbnail: typeof s.thumbnail === 'string' ? s.thumbnail : '',
    duration: typeof s.duration === 'number' ? s.duration : 0,
    durationFormatted: typeof s.durationFormatted === 'string' ? s.durationFormatted : '0:00',
  };
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved).map(sanitizeSong) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved).map(sanitizeSong) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<CustomPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        tracks: Array.isArray(p.tracks) ? p.tracks.map(sanitizeSong) : [],
      }));
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (err) {
      console.error('Failed to save favorites to localStorage', err);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 100)));
    } catch (err) {
      console.error('Failed to save history to localStorage', err);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (err) {
      console.error('Failed to save playlists to localStorage', err);
    }
  }, [playlists]);

  const toggleFavorite = (song: Song) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        return prev.filter((s) => s.id !== song.id);
      } else {
        return [song, ...prev];
      }
    });
  };

  const isFavorite = (songId: string): boolean => {
    return favorites.some((s) => s.id === songId);
  };

  const addToHistory = (song: Song) => {
    setHistory((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      return [song, ...filtered.slice(0, 99)];
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const createPlaylist = (name: string, description?: string): string => {
    const id = `custom_${Date.now()}`;
    const newPlaylist: CustomPlaylist = {
      id,
      name,
      description,
      tracks: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    return id;
  };

  const importPlaylist: LibraryContextType['importPlaylist'] = (playlist) => {
    const existing = playlists.find((item) => item.sourceId === playlist.sourceId);
    const id = existing?.id || `import_${Date.now()}`;
    const imported: CustomPlaylist = {
      id,
      name: playlist.name,
      description: playlist.description,
      thumbnail: playlist.thumbnail,
      sourceId: playlist.sourceId,
      sourceUrl: playlist.sourceUrl,
      tracks: playlist.tracks.map(sanitizeSong),
      createdAt: existing?.createdAt || Date.now(),
    };
    const nextPlaylists = existing
      ? playlists.map((item) => item.id === existing.id ? imported : item)
      : [imported, ...playlists];
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(nextPlaylists));
    } catch {
      throw new Error('This browser is out of storage space for the complete playlist. Free some storage and retry.');
    }
    setPlaylists(nextPlaylists);
    return id;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const addToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const existing = p.tracks.some((track) => track.id === song.id);
          if (existing) {
            if (song.practiceKey === undefined && song.capo === undefined) return p;
            return {
              ...p,
              tracks: p.tracks.map((track) => track.id === song.id
                ? { ...track, ...song, practiceKey: song.practiceKey ?? track.practiceKey, capo: song.capo ?? track.capo }
                : track),
            };
          }
          return { ...p, tracks: [...p.tracks, song] };
        }
        return p;
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, tracks: p.tracks.filter((t) => t.id !== songId) };
        }
        return p;
      })
    );
  };

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        history,
        playlists,
        toggleFavorite,
        isFavorite,
        addToHistory,
        clearHistory,
        createPlaylist,
        importPlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
