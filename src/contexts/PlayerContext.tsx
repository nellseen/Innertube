import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { Song, RepeatMode, LyricsResponse } from '../types/music.js';
import { api } from '../services/api.js';

interface PlayerContextType {
  currentTrack: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isBuffering: boolean;
  error: string | null;
  lyrics: LyricsResponse | null;
  isLoadingLyrics: boolean;
  playSong: (song: Song, newQueue?: Song[], index?: number) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  fetchLyrics: (songId: string, title?: string, artist?: string, duration?: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

// Fisher-Yates shuffle generator preserving currentIndex
function generateShuffleOrder(length: number, currentIndex: number): number[] {
  if (length <= 1) return [0];
  const indices = Array.from({ length }, (_, i) => i);
  // Remove current index
  const remaining = indices.filter((i) => i !== currentIndex);
  // Shuffle remaining
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  return [currentIndex, ...remaining];
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Shuffle order state
  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePointerRef = useRef<number>(0);

  // Single HTMLAudioElement instance (Section 19)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dual engine: YouTube IFrame player fallback instance
  const ytPlayerRef = useRef<any>(null);
  const isUsingYtEngineRef = useRef<boolean>(false);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  // Race condition protection with requestId (Section 23)
  const requestIdRef = useRef<number>(0);
  const currentTrackRef = useRef<Song | null>(null);
  currentTrackRef.current = currentTrack;

  const queueRef = useRef<Song[]>([]);
  queueRef.current = queue;

  const currentIndexRef = useRef<number>(-1);
  currentIndexRef.current = currentIndex;

  const repeatModeRef = useRef<RepeatMode>('off');
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef<boolean>(false);
  isShuffleRef.current = isShuffle;

  // Initialize Audio Element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isUsingYtEngineRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onDurationChange = () => {
      if (!isUsingYtEngineRef.current && audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onWaiting = () => {
      if (!isUsingYtEngineRef.current) setIsBuffering(true);
    };

    const onPlaying = () => {
      if (!isUsingYtEngineRef.current) {
        setIsBuffering(false);
        setIsPlaying(true);
      }
    };

    const onPause = () => {
      if (!isUsingYtEngineRef.current) {
        setIsPlaying(false);
      }
    };

    const onError = () => {
      if (!isUsingYtEngineRef.current) {
        console.warn('[PLAYER] Audio element error, attempting recovery');
        setIsBuffering(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    // Load YouTube IFrame API script dynamically for seamless fallback
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Poll time for YouTube engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (isUsingYtEngineRef.current && ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const time = ytPlayerRef.current.getCurrentTime() || 0;
            setCurrentTime(time);
          }
          if (typeof ytPlayerRef.current.getDuration === 'function') {
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (dur > 0) setDuration(dur);
          }
        } catch {
          // ignore
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // In-memory lyrics cache for instant tab and track switching
  const lyricsCacheRef = useRef<Map<string, any>>(new Map());

  // Fetch lyrics
  const fetchLyrics = useCallback(
    async (songId: string, title?: string, artist?: string, trackDuration?: number) => {
      const cacheKey = `${songId}_${title || ''}`;
      if (lyricsCacheRef.current.has(cacheKey)) {
        setLyrics(lyricsCacheRef.current.get(cacheKey));
        return;
      }

      setIsLoadingLyrics(true);
      try {
        const data = await api.getLyrics(songId, title, artist, trackDuration);
        if (data && data.success) {
          lyricsCacheRef.current.set(cacheKey, data);
        }
        setLyrics(data);
      } catch {
        setLyrics(null);
      } finally {
        setIsLoadingLyrics(false);
      }
    },
    []
  );

  // Update MediaSession (Section 24)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const artistNames = Array.isArray(currentTrack.artists)
        ? currentTrack.artists.map((a) => a.name).join(', ')
        : typeof (currentTrack as any).artist === 'string'
        ? (currentTrack as any).artist
        : 'Unknown Artist';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: artistNames,
        album: currentTrack.album?.name || 'Aetheria Music',
        artwork: [
          { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.warn('MediaSession metadata error', e);
    }
  }, [currentTrack, isPlaying]);

  // Fallback YouTube player initializer
  const ensureYtPlayer = useCallback(
    (videoId: string, onEnd: () => void): Promise<any> => {
      return new Promise((resolve) => {
        // Validate that videoId is a legitimate 11-character YouTube video ID
        if (typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          console.warn('[PLAYER] Cannot initialize YouTube player with invalid videoId:', videoId);
          resolve(null);
          return;
        }

        const createPlayer = () => {
          if (!window.YT || !window.YT.Player) {
            setTimeout(() => createPlayer(), 200);
            return;
          }

          if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
            try {
              ytPlayerRef.current.loadVideoById(videoId);
              ytPlayerRef.current.playVideo();
              resolve(ytPlayerRef.current);
              return;
            } catch {
              // Recreate if instance was lost or in error state
            }
          }

          let wrapper = document.getElementById('aetheria-yt-wrapper');
          if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'aetheria-yt-wrapper';
            wrapper.style.position = 'fixed';
            wrapper.style.top = '-9999px';
            wrapper.style.left = '-9999px';
            wrapper.style.width = '1px';
            wrapper.style.height = '1px';
            wrapper.style.opacity = '0.001';
            wrapper.style.pointerEvents = 'none';
            document.body.appendChild(wrapper);
          }

          // Always recreate a fresh div target so YT.Player never attempts to bind to an existing iframe
          wrapper.innerHTML = '<div id="aetheria-yt-player"></div>';

          try {
            ytPlayerRef.current = new window.YT.Player('aetheria-yt-player', {
              height: '1',
              width: '1',
              videoId,
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
              },
              events: {
                onReady: (event: any) => {
                  try {
                    event.target.setVolume(isMuted ? 0 : volume * 100);
                    event.target.playVideo();
                  } catch {}
                  resolve(event.target);
                },
                onStateChange: (event: any) => {
                  // 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
                  if (event.data === 1) {
                    setIsBuffering(false);
                    setIsPlaying(true);
                  } else if (event.data === 2) {
                    setIsPlaying(false);
                  } else if (event.data === 3) {
                    setIsBuffering(true);
                  } else if (event.data === 0) {
                    onEnd();
                  }
                },
                onError: (err: any) => {
                  console.warn('[PLAYER] YouTube engine event error', err);
                  setIsBuffering(false);
                  resolve(null);
                },
              },
            });
          } catch (ytErr) {
            console.warn('[PLAYER] Error initializing window.YT.Player:', ytErr);
            resolve(null);
          }
        };

        if (window.YT && window.YT.Player) {
          createPlayer();
        } else {
          window.onYouTubeIframeAPIReady = createPlayer;
          setTimeout(() => createPlayer(), 500);
        }
      });
    },
    [volume, isMuted]
  );

  // Play next track handler
  const handleTrackEnded = useCallback(() => {
    const currentRepeat = repeatModeRef.current;
    if (currentRepeat === 'repeat-one' || currentRepeat === 'one') {
      seek(0);
      togglePlay();
      return;
    }

    const currentQueue = queueRef.current;
    const currIdx = currentIndexRef.current;
    const isShuff = isShuffleRef.current;

    if (isShuff && shuffleOrderRef.current.length > 0) {
      const nextPointer = shufflePointerRef.current + 1;
      if (nextPointer < shuffleOrderRef.current.length) {
        shufflePointerRef.current = nextPointer;
        const nextIdx = shuffleOrderRef.current[nextPointer];
        const nextSong = currentQueue[nextIdx];
        if (nextSong) {
          playSong(nextSong, currentQueue, nextIdx);
          return;
        }
      } else if (currentRepeat === 'repeat-all' || currentRepeat === 'all') {
        shufflePointerRef.current = 0;
        const nextIdx = shuffleOrderRef.current[0];
        const nextSong = currentQueue[nextIdx];
        if (nextSong) {
          playSong(nextSong, currentQueue, nextIdx);
          return;
        }
      }
    } else {
      const nextIdx = currIdx + 1;
      if (nextIdx < currentQueue.length) {
        const nextSong = currentQueue[nextIdx];
        if (nextSong) {
          playSong(nextSong, currentQueue, nextIdx);
          return;
        }
      } else if ((currentRepeat === 'repeat-all' || currentRepeat === 'all') && currentQueue.length > 0) {
        const nextSong = currentQueue[0];
        if (nextSong) {
          playSong(nextSong, currentQueue, 0);
          return;
        }
      }
    }

    setIsPlaying(false);
  }, []);

  // Attach audio ended listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onAudioEnded = () => {
      if (!isUsingYtEngineRef.current) {
        handleTrackEnded();
      }
    };

    audio.addEventListener('ended', onAudioEnded);
    return () => audio.removeEventListener('ended', onAudioEnded);
  }, [handleTrackEnded]);

  // Main playback starter
  const playSong = useCallback(
    async (song: Song, newQueue?: Song[], index?: number) => {
      // If a playlist or album was passed to playSong, resolve its tracks first!
      if (
        song.id.startsWith('VL') ||
        song.id.startsWith('PL') ||
        song.id.startsWith('RD')
      ) {
        try {
          const pl = await api.getPlaylist(song.id);
          if (pl.tracks && pl.tracks.length > 0) {
            playSong(pl.tracks[0], pl.tracks, 0);
            return;
          }
        } catch (e) {
          console.warn('[PLAYER] Failed to resolve playlist for playSong', e);
        }
      } else if (song.id.startsWith('MPREb') || song.id.startsWith('MPED')) {
        try {
          const al = await api.getAlbum(song.id);
          if (al.tracks && al.tracks.length > 0) {
            playSong(al.tracks[0], al.tracks, 0);
            return;
          }
        } catch (e) {
          console.warn('[PLAYER] Failed to resolve album for playSong', e);
        }
      }

      // Race condition protection: increment request ID (Section 23)
      const thisRequestId = ++requestIdRef.current;

      setError(null);
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(song.duration || 0);
      setCurrentTrack(song);

      // Handle queue update
      let targetQueue = queueRef.current;
      let targetIndex = 0;

      if (newQueue && newQueue.length > 0) {
        targetQueue = newQueue;
        targetIndex = index ?? targetQueue.findIndex((s) => s.id === song.id);
        if (targetIndex === -1) targetIndex = 0;
        setQueue(targetQueue);
        setCurrentIndex(targetIndex);
      } else if (!targetQueue.some((s) => s.id === song.id)) {
        targetQueue = [song, ...targetQueue];
        targetIndex = 0;
        setQueue(targetQueue);
        setCurrentIndex(targetIndex);
      } else {
        targetIndex = index ?? targetQueue.findIndex((s) => s.id === song.id);
        setCurrentIndex(targetIndex);
      }

      // Re-evaluate shuffle order if shuffle is enabled
      if (isShuffleRef.current) {
        shuffleOrderRef.current = generateShuffleOrder(targetQueue.length, targetIndex);
        shufflePointerRef.current = 0;
      }

      // Automatically fetch lyrics in background
      const artistNames = Array.isArray(song.artists)
        ? song.artists.map((a) => a.name).join(', ')
        : typeof (song as any).artist === 'string'
        ? (song as any).artist
        : '';
      fetchLyrics(song.id, song.title, artistNames, song.duration);

      try {
        // Step 1: Check stream endpoint
        const streamData = await api.getStreamUrl(song.id).catch(() => null);

        // Check race condition: if another song was requested while waiting, discard!
        if (thisRequestId !== requestIdRef.current) {
          return;
        }

        const audio = audioRef.current;

        if (streamData?.success && streamData?.url) {
          // Direct audio playback available
          isUsingYtEngineRef.current = false;
          if (ytPlayerRef.current?.pauseVideo) {
            ytPlayerRef.current.pauseVideo();
          }

          if (audio) {
            audio.src = streamData.url;
            audio.volume = isMuted ? 0 : volume;
            await audio.play().catch((err) => {
              console.warn('[PLAYER] Audio element playback interrupted', err);
            });
            if (thisRequestId === requestIdRef.current) {
              setIsPlaying(true);
              setIsBuffering(false);
            }
          }
        } else {
          // Engage seamless native YouTube playback engine
          console.log('[PLAYER] Engaging native streaming engine for', song.title);
          isUsingYtEngineRef.current = true;
          if (audio) {
            audio.pause();
            audio.src = '';
          }

          const player = await ensureYtPlayer(song.id, handleTrackEnded);
          if (thisRequestId !== requestIdRef.current) return;

          if (player && typeof player.loadVideoById === 'function') {
            try {
              player.loadVideoById(song.id);
              player.setVolume(isMuted ? 0 : volume * 100);
              player.playVideo();
              setIsPlaying(true);
            } catch (pErr) {
              console.warn('[PLAYER] player.loadVideoById error', pErr);
            }
          }
          setIsBuffering(false);
        }
      } catch (err: any) {
        if (thisRequestId === requestIdRef.current) {
          console.error('[PLAYER] Failed to play song:', err);
          setError('Failed to stream audio. Retrying...');
          setIsBuffering(false);
        }
      }
    },
    [volume, isMuted, ensureYtPlayer, handleTrackEnded, fetchLyrics]
  );

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playSong(queue[0], queue, 0);
      }
      return;
    }

    if (isUsingYtEngineRef.current && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    }
  }, [currentTrack, isPlaying, queue, playSong]);

  // Seek
  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (isUsingYtEngineRef.current && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Volume
  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      setVolumeState(clamped);
      setIsMuted(clamped === 0);

      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
      if (ytPlayerRef.current?.setVolume) {
        ytPlayerRef.current.setVolume(clamped * 100);
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      const targetVol = nextMuted ? 0 : volume;
      if (audioRef.current) audioRef.current.volume = targetVol;
      if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(targetVol * 100);
      return nextMuted;
    });
  }, [volume]);

  // Next
  const next = useCallback(() => {
    handleTrackEnded();
  }, [handleTrackEnded]);

  // Previous
  const previous = useCallback(() => {
    // If currentTime > 3 seconds, replay current song first
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const currentQueue = queueRef.current;
    const currIdx = currentIndexRef.current;

    if (isShuffleRef.current && shuffleOrderRef.current.length > 0) {
      const prevPointer = shufflePointerRef.current - 1;
      if (prevPointer >= 0) {
        shufflePointerRef.current = prevPointer;
        const prevIdx = shuffleOrderRef.current[prevPointer];
        const prevSong = currentQueue[prevIdx];
        if (prevSong) {
          playSong(prevSong, currentQueue, prevIdx);
          return;
        }
      }
    }

    const prevIdx = currIdx - 1;
    if (prevIdx >= 0) {
      const prevSong = currentQueue[prevIdx];
      if (prevSong) {
        playSong(prevSong, currentQueue, prevIdx);
        return;
      }
    } else if (currentQueue.length > 0) {
      // Loop to end
      const lastIdx = currentQueue.length - 1;
      playSong(currentQueue[lastIdx], currentQueue, lastIdx);
    }
  }, [currentTime, seek, playSong]);

  // Shuffle toggle (Section 21)
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Construct shuffle array
        shuffleOrderRef.current = generateShuffleOrder(queue.length, currentIndex);
        shufflePointerRef.current = 0;
      }
      return nextState;
    });
  }, [queue.length, currentIndex]);

  // Repeat toggle (Section 22: off -> repeat-all -> repeat-one)
  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'repeat-all';
      if (prev === 'repeat-all' || prev === 'all') return 'repeat-one';
      return 'off';
    });
  }, []);

  // Queue actions
  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      const updated = [...prev, song];
      if (isShuffleRef.current) {
        shuffleOrderRef.current = generateShuffleOrder(updated.length, currentIndexRef.current);
      }
      return updated;
    });
  }, []);

  const playNext = useCallback((song: Song) => {
    setQueue((prev) => {
      const currIdx = currentIndexRef.current;
      const updated = [...prev];
      updated.splice(currIdx + 1, 0, song);
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (index < currentIndexRef.current) {
        setCurrentIndex((c) => c - 1);
      }
      return updated;
    });
  }, []);

  const clearQueue = useCallback(() => {
    if (currentTrack) {
      setQueue([currentTrack]);
      setCurrentIndex(0);
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
  }, [currentTrack]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      // Adjust currentIndex if necessary
      const curr = currentIndexRef.current;
      if (curr === fromIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < curr && toIndex >= curr) {
        setCurrentIndex(curr - 1);
      } else if (fromIndex > curr && toIndex <= curr) {
        setCurrentIndex(curr + 1);
      }

      return updated;
    });
  }, []);

  // Register MediaSession action handlers (Section 24)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        seek(Math.max(0, currentTime - offset));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        seek(Math.min(duration, currentTime + offset));
      });
    } catch (e) {
      console.warn('Failed to bind MediaSession action handler', e);
    }
  }, [togglePlay, previous, next, seek, currentTime, duration]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffle,
        isBuffering,
        error,
        lyrics,
        isLoadingLyrics,
        playSong,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        next,
        previous,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        fetchLyrics,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
