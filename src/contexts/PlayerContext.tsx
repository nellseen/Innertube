import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { Song, RepeatMode, LyricsResponse, SponsorBlockSegment, AudioQuality } from '../types/music.js';
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
  sponsorBlockSegments: SponsorBlockSegment[];
  sleepTimerEndsAt: number | null;
  setSleepTimer: (minutes: number) => void;
  sleepAtTrackEnd: boolean;
  setSleepAtTrackEnd: (enabled: boolean) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  crossfadeSeconds: number;
  setCrossfadeSeconds: (seconds: number) => void;
  isSponsorBlockEnabled: boolean;
  toggleSponsorBlock: () => void;
  sponsorBlockNotice: { show: boolean; category: string; from: number; to: number; uuid: string } | null;
  dismissSponsorBlockNotice: () => void;
  undoSponsorBlockSkip: () => void;
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

function readSavedPlayerSession(): { track: Song | null; queue: Song[]; index: number; time: number } {
  try {
    if (typeof window === 'undefined') return { track: null, queue: [], index: -1, time: 0 };
    const raw = localStorage.getItem('aetheria_playback_session');
    if (!raw) return { track: null, queue: [], index: -1, time: 0 };
    const saved = JSON.parse(raw);
    const queue = Array.isArray(saved.queue)
      ? saved.queue.filter((song: any) => song && typeof song.id === 'string').slice(0, 300)
      : [];
    const track = saved.track && typeof saved.track.id === 'string' ? saved.track as Song : null;
    const index = queue.length
      ? Math.max(0, Math.min(queue.length - 1, Number(saved.index) || 0))
      : track ? 0 : -1;
    const time = Number.isFinite(Number(saved.time)) ? Math.max(0, Number(saved.time)) : 0;
    return { track, queue: track && !queue.some((song: Song) => song.id === track.id) ? [track, ...queue] : queue, index, time };
  } catch {
    return { track: null, queue: [], index: -1, time: 0 };
  }
}

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
  const [savedSession] = useState(readSavedPlayerSession);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(savedSession.track);
  const [queue, setQueue] = useState<Song[]>(savedSession.queue);
  const [currentIndex, setCurrentIndex] = useState<number>(savedSession.index);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(savedSession.time);
  const [duration, setDuration] = useState<number>(savedSession.track?.duration || 0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    try {
      const saved = localStorage.getItem('aetheria_repeat_mode') as RepeatMode | null;
      return saved && ['off', 'all', 'one', 'repeat-all', 'repeat-one'].includes(saved) ? saved : 'off';
    } catch { return 'off'; }
  });
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    try { return localStorage.getItem('aetheria_shuffle') === 'true'; }
    catch { return false; }
  });
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);
  const [audioQuality, setAudioQuality] = useState<AudioQuality>(() => {
    try {
      const saved = localStorage.getItem('aetheria_audio_quality');
      return saved === 'standard' || saved === 'data-saver' ? saved : 'best';
    } catch { return 'best'; }
  });
  const [crossfadeSeconds, setCrossfadeSeconds] = useState<number>(() => {
    try {
      const value = Number(localStorage.getItem('aetheria_crossfade_seconds'));
      return Number.isFinite(value) && value >= 0 && value <= 10 ? value : 0;
    } catch { return 0; }
  });
  const [sleepAtTrackEnd, setSleepAtTrackEnd] = useState<boolean>(() => {
    try { return localStorage.getItem('aetheria_sleep_at_track_end') === 'true'; }
    catch { return false; }
  });
  const sleepAtTrackEndRef = useRef(sleepAtTrackEnd);
  sleepAtTrackEndRef.current = sleepAtTrackEnd;
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(() => {
    try {
      const value = Number(localStorage.getItem('aetheria_sleep_timer'));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  });

  const setSleepTimer = useCallback((minutes: number) => {
    setSleepTimerEndsAt(minutes > 0 ? Date.now() + minutes * 60_000 : null);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_audio_quality', audioQuality);
      localStorage.setItem('aetheria_crossfade_seconds', String(crossfadeSeconds));
      localStorage.setItem('aetheria_sleep_at_track_end', String(sleepAtTrackEnd));
    } catch {
      // Preferences remain active for the current session.
    }
  }, [audioQuality, crossfadeSeconds, sleepAtTrackEnd]);

  useEffect(() => {
    try {
      if (sleepTimerEndsAt) localStorage.setItem('aetheria_sleep_timer', String(sleepTimerEndsAt));
      else localStorage.removeItem('aetheria_sleep_timer');
    } catch {
      // Timer still works for the current session if storage is unavailable.
    }
    if (!sleepTimerEndsAt) return;

    const stopAt = sleepTimerEndsAt;
    const stopPlayback = () => {
      audioRef.current?.pause();
      ytPlayerRef.current?.pauseVideo?.();
      setIsPlaying(false);
      setSleepTimerEndsAt(null);
    };
    const delay = stopAt - Date.now();
    if (delay <= 0) {
      stopPlayback();
      return;
    }
    const timeout = window.setTimeout(stopPlayback, delay);
    return () => window.clearTimeout(timeout);
  }, [sleepTimerEndsAt]);

  // SponsorBlock state
  const [sponsorBlockSegments, setSponsorBlockSegments] = useState<SponsorBlockSegment[]>([]);
  const [isSponsorBlockEnabled, setIsSponsorBlockEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aetheria_sponsorblock') !== 'false';
    } catch {
      return true;
    }
  });
  const [sponsorBlockNotice, setSponsorBlockNotice] = useState<{
    show: boolean;
    category: string;
    from: number;
    to: number;
    uuid: string;
  } | null>(null);

  const sponsorSegmentsRef = useRef<SponsorBlockSegment[]>([]);
  const ignoredSegmentsRef = useRef<Set<string>>(new Set());
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shuffle order state
  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePointerRef = useRef<number>(0);

  // Single HTMLAudioElement instance (Section 19)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeAudioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadePrefetchRef = useRef<{ trackId: string; index: number; url?: string } | null>(null);
  const crossfadeStartedRef = useRef(false);
  const crossfadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumePositionRef = useRef<number>(savedSession.time);
  const resumeTrackIdRef = useRef<string | null>(savedSession.track?.id || null);

  // Dual engine: YouTube IFrame player fallback instance
  const ytPlayerRef = useRef<any>(null);
  const isUsingYtEngineRef = useRef<boolean>(false);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  // Race condition protection with requestId (Section 23)
  const requestIdRef = useRef<number>(0);
  const currentTrackRef = useRef<Song | null>(null);
  currentTrackRef.current = currentTrack;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const mediaSessionActionsRef = useRef<{
    togglePlay?: () => void;
    previous?: () => void;
    next?: () => void;
    seek?: (time: number) => void;
  }>({});

  const queueRef = useRef<Song[]>([]);
  queueRef.current = queue;

  const currentIndexRef = useRef<number>(-1);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_repeat_mode', repeatMode);
      localStorage.setItem('aetheria_shuffle', String(isShuffle));
    } catch {
      // Playback preferences remain active for the current session.
    }
  }, [repeatMode, isShuffle]);

  useEffect(() => {
    try {
      if (!currentTrack && queue.length === 0) {
        localStorage.removeItem('aetheria_playback_session');
        return;
      }
      localStorage.setItem('aetheria_playback_session', JSON.stringify({
        track: currentTrack,
        queue: queue.slice(0, 300),
        index: currentIndex,
        time: currentTime,
      }));
    } catch {
      // Ignore storage quota and private-mode errors; playback remains available.
    }
  }, [currentTrack, queue, currentIndex, currentTime]);

  const repeatModeRef = useRef<RepeatMode>('off');
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef<boolean>(false);
  isShuffleRef.current = isShuffle;

  // Keep a second silent deck ready for direct-stream crossfades.
  useEffect(() => {
    const audio = new Audio();
    const secondary = new Audio();
    audio.preload = 'auto';
    secondary.preload = 'auto';
    audioRef.current = audio;
    crossfadeAudioRef.current = secondary;

    const onTimeUpdate = (event: Event) => {
      const target = event.currentTarget as HTMLAudioElement;
      if (target === audioRef.current && !isUsingYtEngineRef.current) setCurrentTime(target.currentTime);
    };
    const onDurationChange = (event: Event) => {
      const target = event.currentTarget as HTMLAudioElement;
      if (target === audioRef.current && !isUsingYtEngineRef.current && target.duration && !isNaN(target.duration)) {
        setDuration(target.duration);
      }
    };
    const onWaiting = (event: Event) => {
      if (event.currentTarget === audioRef.current && !isUsingYtEngineRef.current) setIsBuffering(true);
    };
    const onPlaying = (event: Event) => {
      if (event.currentTarget === audioRef.current && !isUsingYtEngineRef.current) {
        setIsBuffering(false);
        setIsPlaying(true);
      }
    };
    const onPause = (event: Event) => {
      if (event.currentTarget === audioRef.current && !isUsingYtEngineRef.current && !crossfadeStartedRef.current) {
        setIsPlaying(false);
      }
    };
    const onError = (event: Event) => {
      if (event.currentTarget === audioRef.current && !isUsingYtEngineRef.current) {
        console.warn('[PLAYER] Audio element error, attempting recovery');
        setIsBuffering(false);
      }
    };
    const elements = [audio, secondary];
    for (const element of elements) {
      element.addEventListener('timeupdate', onTimeUpdate);
      element.addEventListener('durationchange', onDurationChange);
      element.addEventListener('waiting', onWaiting);
      element.addEventListener('playing', onPlaying);
      element.addEventListener('pause', onPause);
      element.addEventListener('error', onError);
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    return () => {
      if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
      for (const element of elements) {
        element.pause();
        element.src = '';
        element.removeEventListener('timeupdate', onTimeUpdate);
        element.removeEventListener('durationchange', onDurationChange);
        element.removeEventListener('waiting', onWaiting);
        element.removeEventListener('playing', onPlaying);
        element.removeEventListener('pause', onPause);
        element.removeEventListener('error', onError);
      }
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

  // Fetch SponsorBlock segments for current track
  const fetchSponsorBlock = useCallback(async (songId: string) => {
    try {
      const res = await api.getSponsorBlockSegments(songId);
      if (res && res.success && Array.isArray(res.segments)) {
        setSponsorBlockSegments(res.segments);
        sponsorSegmentsRef.current = res.segments;
      } else {
        setSponsorBlockSegments([]);
        sponsorSegmentsRef.current = [];
      }
    } catch {
      setSponsorBlockSegments([]);
      sponsorSegmentsRef.current = [];
    }
  }, []);

  // Keep lock-screen and notification metadata in sync with the active track.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;
    if (!currentTrack) {
      try {
        mediaSession.metadata = null;
        mediaSession.playbackState = 'none';
        mediaSession.setPositionState?.();
      } catch {
        // Media Session support varies by browser and playback state.
      }
      return;
    }

    try {
      const artistNames = Array.isArray(currentTrack.artists)
        ? currentTrack.artists.map((artist) => artist.name).filter(Boolean).join(', ')
        : typeof (currentTrack as any).artist === 'string'
          ? (currentTrack as any).artist
          : 'Unknown Artist';
      const artwork = currentTrack.thumbnail
        ? [96, 128, 256, 512].map((size) => ({ src: currentTrack.thumbnail, sizes: `${size}x${size}` }))
        : [];

      if (typeof MediaMetadata !== 'undefined') {
        mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || 'Unknown title',
          artist: artistNames || 'Unknown Artist',
          album: currentTrack.album?.name || 'Aetheria Music',
          artwork,
        });
      }
      mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (error) {
      console.warn('[PLAYER] Failed to update Media Session metadata', error);
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
    if (sleepAtTrackEndRef.current) {
      setSleepAtTrackEnd(false);
      audioRef.current?.pause();
      ytPlayerRef.current?.pauseVideo?.();
      setIsPlaying(false);
      return;
    }
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

  // Attach the ended listener to both decks while allowing only the active one to advance.
  useEffect(() => {
    const onAudioEnded = (event: Event) => {
      if (event.currentTarget === audioRef.current && !isUsingYtEngineRef.current && !crossfadeStartedRef.current) {
        handleTrackEnded();
      }
    };
    const elements = [audioRef.current, crossfadeAudioRef.current].filter(Boolean) as HTMLAudioElement[];
    elements.forEach((audio) => audio.addEventListener('ended', onAudioEnded));
    return () => elements.forEach((audio) => audio.removeEventListener('ended', onAudioEnded));
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
      if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
      crossfadeStartedRef.current = false;
      crossfadePrefetchRef.current = null;
      const spareAudio = crossfadeAudioRef.current;
      if (spareAudio) {
        spareAudio.pause();
        spareAudio.removeAttribute('src');
        spareAudio.load();
      }

      setError(null);
      setIsBuffering(true);
      setCurrentTime(0);
      setDuration(song.duration || 0);
      if (song.id !== resumeTrackIdRef.current) {
        resumePositionRef.current = 0;
        resumeTrackIdRef.current = null;
      }
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

      // Automatically fetch lyrics & sponsorblock in background
      const artistNames = Array.isArray(song.artists)
        ? song.artists.map((a) => a.name).join(', ')
        : typeof (song as any).artist === 'string'
        ? (song as any).artist
        : '';
      fetchLyrics(song.id, song.title, artistNames, song.duration);
      ignoredSegmentsRef.current.clear();
      setSponsorBlockNotice(null);
      fetchSponsorBlock(song.id);

      try {
        // Step 1: Check stream endpoint
        const streamData = await api.getStreamUrl(song.id, false, audioQuality).catch(() => null);

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
            const resumeAt = song.id === resumeTrackIdRef.current ? resumePositionRef.current : 0;
            if (resumeAt > 0) {
              audio.addEventListener('loadedmetadata', () => {
                if (thisRequestId === requestIdRef.current && audio.duration > resumeAt) {
                  audio.currentTime = resumeAt;
                }
                resumePositionRef.current = 0;
                resumeTrackIdRef.current = null;
              }, { once: true });
            }
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
              if (song.id === resumeTrackIdRef.current && resumePositionRef.current > 0) {
                player.seekTo(resumePositionRef.current, true);
                resumePositionRef.current = 0;
                resumeTrackIdRef.current = null;
              }
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
    [volume, isMuted, audioQuality, ensureYtPlayer, handleTrackEnded, fetchLyrics]
  );

  // Direct audio streams can overlap on two HTMLAudioElements; the YouTube iframe fallback advances normally.
  useEffect(() => {
    const currentAudio = audioRef.current;
    const nextAudio = crossfadeAudioRef.current;
    if (!crossfadeSeconds || !isPlaying || isUsingYtEngineRef.current || !currentAudio || !nextAudio || !currentTrack) return;
    const currentQueue = queueRef.current;
    let nextIndex = currentIndexRef.current + 1;
    if (isShuffleRef.current && shuffleOrderRef.current.length > 0) {
      const pointer = shufflePointerRef.current + 1;
      if (pointer < shuffleOrderRef.current.length) nextIndex = shuffleOrderRef.current[pointer];
      else if (repeatModeRef.current === 'repeat-all' || repeatModeRef.current === 'all') {
        nextIndex = shuffleOrderRef.current[0];
      } else return;
    } else if (nextIndex >= currentQueue.length) {
      if (repeatModeRef.current === 'repeat-all' || repeatModeRef.current === 'all') nextIndex = 0;
      else return;
    }
    const nextSong = currentQueue[nextIndex];
    if (!nextSong || nextSong.id === currentTrack.id) return;

    const trackDuration = currentAudio.duration || duration;
    const remaining = trackDuration - currentAudio.currentTime;
    if (remaining > crossfadeSeconds + 8) return;

    let prepared = crossfadePrefetchRef.current;
    if (!prepared || prepared.trackId !== nextSong.id || prepared.index !== nextIndex) {
      crossfadePrefetchRef.current = { trackId: nextSong.id, index: nextIndex };
      api.getStreamUrl(nextSong.id, false, audioQuality).then((stream) => {
        const latest = crossfadePrefetchRef.current;
        if (!stream.success || !stream.url || !latest || latest.trackId !== nextSong.id) return;
        nextAudio.src = stream.url;
        nextAudio.preload = 'auto';
        nextAudio.load();
        crossfadePrefetchRef.current = { trackId: nextSong.id, index: nextIndex, url: stream.url };
      }).catch(() => {
        crossfadePrefetchRef.current = null;
      });
      return;
    }

    if (remaining > crossfadeSeconds || !prepared.url || nextAudio.readyState < 2 || crossfadeStartedRef.current) return;
    if (currentQueue[nextIndex]?.id !== prepared.trackId) {
      crossfadePrefetchRef.current = null;
      return;
    }

    crossfadeStartedRef.current = true;
    nextAudio.currentTime = 0;
    nextAudio.volume = 0;
    nextAudio.play().catch(() => {
      crossfadeStartedRef.current = false;
    });
    const fadeStartedAt = Date.now();
    const fadeDuration = Math.max(500, Math.min(crossfadeSeconds * 1000, remaining * 1000));
    if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
    crossfadeIntervalRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - fadeStartedAt) / fadeDuration);
      const targetVolume = isMuted ? 0 : volume;
      currentAudio.volume = targetVolume * (1 - progress);
      nextAudio.volume = targetVolume * progress;

      if (progress < 1) return;
      if (crossfadeIntervalRef.current) clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
      audioRef.current = nextAudio;
      crossfadeAudioRef.current = currentAudio;
      nextAudio.volume = targetVolume;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setCurrentTrack(nextSong);
      setCurrentTime(nextAudio.currentTime);
      setDuration(nextAudio.duration || nextSong.duration || 0);
      setIsPlaying(true);
      setIsBuffering(false);
      const artists = Array.isArray(nextSong.artists) ? nextSong.artists.map((artist) => artist.name).join(', ') : '';
      fetchLyrics(nextSong.id, nextSong.title, artists, nextSong.duration);
      fetchSponsorBlock(nextSong.id);
      crossfadeStartedRef.current = false;
      crossfadePrefetchRef.current = null;
    }, 40);
  }, [audioQuality, crossfadeSeconds, currentTrack, currentTime, duration, fetchLyrics, fetchSponsorBlock, isMuted, isPlaying, volume]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playSong(queue[0], queue, 0);
      }
      return;
    }

    if (
      !isUsingYtEngineRef.current &&
      audioRef.current &&
      !audioRef.current.getAttribute('src')
    ) {
      playSong(currentTrack, queue.length ? queue : [currentTrack], Math.max(0, currentIndex));
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
  }, [currentTrack, currentIndex, isPlaying, queue, playSong]);

  // Seek
  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (isUsingYtEngineRef.current && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // SponsorBlock auto-skipping effect (Section: SponsorBlock API integration)
  useEffect(() => {
    if (!isSponsorBlockEnabled || sponsorBlockSegments.length === 0 || !isPlaying) return;

    for (const seg of sponsorBlockSegments) {
      const segId = seg.uuid || `${seg.start}-${seg.end}`;
      if (ignoredSegmentsRef.current.has(segId)) continue;

      // When playback reaches segment window
      if (currentTime >= seg.start - 0.15 && currentTime < seg.end - 0.5) {
        console.log(`[SPONSORBLOCK] Auto-skipping ${seg.category} from ${seg.start}s to ${seg.end}s`);
        seek(seg.end);

        const categoryLabels: Record<string, string> = {
          music_offtopic: 'Non-music skit / intro',
          sponsor: 'Sponsor segment',
          intro: 'Intro / silence',
          outro: 'Outro / credits',
          filler: 'Filler segment',
          preview: 'Preview snippet',
        };
        const label = categoryLabels[seg.category] || 'Non-music segment';

        setSponsorBlockNotice({
          show: true,
          category: label,
          from: seg.start,
          to: seg.end,
          uuid: segId,
        });

        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => {
          setSponsorBlockNotice(null);
        }, 5500);
        break;
      }
    }
  }, [currentTime, isPlaying, isSponsorBlockEnabled, sponsorBlockSegments, seek]);

  const toggleSponsorBlock = useCallback(() => {
    setIsSponsorBlockEnabled((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem('aetheria_sponsorblock', String(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  }, []);

  const undoSponsorBlockSkip = useCallback(() => {
    if (sponsorBlockNotice) {
      ignoredSegmentsRef.current.add(sponsorBlockNotice.uuid);
      seek(sponsorBlockNotice.from);
      setSponsorBlockNotice(null);
    }
  }, [sponsorBlockNotice, seek]);

  const dismissSponsorBlockNotice = useCallback(() => {
    setSponsorBlockNotice(null);
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

  // Keep current controls available to stable OS action handlers.
  mediaSessionActionsRef.current = { togglePlay, previous, next, seek };

  // Register supported Media Session actions once. Unsupported actions are
  // isolated so one browser limitation does not disable the rest of the controls.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const mediaSession = navigator.mediaSession;
    if (typeof mediaSession.setActionHandler !== 'function') return;

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ['play', () => {
        if (!isPlayingRef.current) mediaSessionActionsRef.current.togglePlay?.();
      }],
      ['pause', () => {
        if (isPlayingRef.current) mediaSessionActionsRef.current.togglePlay?.();
      }],
      ['previoustrack', () => mediaSessionActionsRef.current.previous?.()],
      ['nexttrack', () => mediaSessionActionsRef.current.next?.()],
      ['stop', () => {
        if (isPlayingRef.current) mediaSessionActionsRef.current.togglePlay?.();
        mediaSessionActionsRef.current.seek?.(0);
      }],
      ['seekto', (details) => {
        if (typeof details.seekTime === 'number' && Number.isFinite(details.seekTime)) {
          mediaSessionActionsRef.current.seek?.(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const offset = typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        mediaSessionActionsRef.current.seek?.(Math.max(0, currentTimeRef.current - offset));
      }],
      ['seekforward', (details) => {
        const offset = typeof details.seekOffset === 'number' ? details.seekOffset : 10;
        const end = durationRef.current > 0 ? durationRef.current : Number.POSITIVE_INFINITY;
        mediaSessionActionsRef.current.seek?.(Math.min(end, currentTimeRef.current + offset));
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // This action is not supported by this browser.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported actions while cleaning up.
        }
      }
      try {
        mediaSession.metadata = null;
        mediaSession.playbackState = 'none';
        mediaSession.setPositionState?.();
      } catch {
        // Ignore browser-specific cleanup errors.
      }
    };
  }, []);

  // Keep the OS scrubber synchronized with the active playback position.
  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !('mediaSession' in navigator) ||
      typeof navigator.mediaSession.setPositionState !== 'function'
    ) return;

    try {
      if (!currentTrack || !Number.isFinite(duration) || duration <= 0) {
        navigator.mediaSession.setPositionState();
        return;
      }

      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), duration),
      });
    } catch {
      // Browsers can reject position state during track transitions.
    }
  }, [currentTrack, currentTime, duration]);

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
        sponsorBlockSegments,
        sleepTimerEndsAt,
        setSleepTimer,
        sleepAtTrackEnd,
        setSleepAtTrackEnd,
        audioQuality,
        setAudioQuality,
        crossfadeSeconds,
        setCrossfadeSeconds,
        isSponsorBlockEnabled,
        toggleSponsorBlock,
        sponsorBlockNotice,
        dismissSponsorBlockNotice,
        undoSponsorBlockSkip,
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
