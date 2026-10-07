import { Chord } from 'tonal';

export interface ChordTheoryDetails {
  symbol: string;
  name: string;
  fullNameFormatted: string;
  notes: string[];
  quality: string;
  type: string;
  tonic: string;
  intervals: string[];
  aliases: string[];
  empty: boolean;
}

// Frequency map for Web Audio synthesis of notes
export const NOTE_FREQUENCIES: Record<string, number> = {
  C3: 130.81,
  'C#3': 138.59,
  Db3: 138.59,
  D3: 146.83,
  'D#3': 155.56,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  'F#3': 185.0,
  Gb3: 185.0,
  G3: 196.0,
  'G#3': 207.65,
  Ab3: 207.65,
  A3: 220.0,
  'A#3': 233.08,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  'C#4': 277.18,
  Db4: 277.18,
  D4: 293.66,
  'D#4': 311.13,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  'F#4': 369.99,
  Gb4: 369.99,
  G4: 392.0,
  'G#4': 415.3,
  Ab4: 415.3,
  A4: 440.0,
  'A#4': 466.16,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  'C#5': 554.37,
  Db5: 554.37,
  D5: 587.33,
  'D#5': 622.25,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  'F#5': 739.99,
  Gb5: 739.99,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
};

/**
 * Get comprehensive music theory analysis of a chord using Tonal.js
 */
export function getChordTheory(chordName: string): ChordTheoryDetails {
  if (!chordName) {
    return {
      symbol: '',
      name: '',
      fullNameFormatted: '',
      notes: [],
      quality: 'Unknown',
      type: '',
      tonic: '',
      intervals: [],
      aliases: [],
      empty: true,
    };
  }

  const cleanChord = chordName.trim();
  const info = Chord.get(cleanChord);

  let fullName = info.name || '';
  if (!fullName || fullName.trim().length <= 1) {
    const root = info.tonic || cleanChord.replace(/[^A-G#b]/g, '');
    const qual = info.quality && info.quality !== 'Unknown' ? info.quality : (info.type || 'Chord');
    fullName = `${root} ${qual}`.trim();
  }

  // Capitalize nicely e.g. "C major seventh" -> "C Major Seventh"
  const fullNameFormatted = fullName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Quality fallback
  let quality = info.quality;
  if (!quality || quality === 'Unknown') {
    const lowerType = (info.type || '').toLowerCase();
    if (lowerType.includes('sus') || cleanChord.includes('sus')) quality = 'Suspended';
    else if (lowerType.includes('aug') || cleanChord.includes('aug')) quality = 'Augmented';
    else if (lowerType.includes('dim') || cleanChord.includes('dim')) quality = 'Diminished';
    else if (cleanChord.includes('m') && !cleanChord.includes('maj')) quality = 'Minor';
    else if (lowerType.includes('dom') || cleanChord.match(/^[A-G][#b]?7$/)) quality = 'Dominant';
    else quality = 'Major';
  }

  return {
    symbol: cleanChord,
    name: info.name,
    fullNameFormatted,
    notes: info.notes && info.notes.length > 0 ? info.notes : [],
    quality,
    type: info.type || quality,
    tonic: info.tonic || cleanChord.replace(/[^A-G#b]/g, '') || '',
    intervals: info.intervals || [],
    aliases: info.aliases || [],
    empty: info.empty,
  };
}

/**
 * Play synthesized audio of chord notes using Web Audio API
 */
export function playSynthesizedChord(notes: string[] = ['C', 'E', 'G']): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const baseOctave = 4;
    notes.forEach((n, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const noteWithOct = `${n}${baseOctave}`;
      const freq = NOTE_FREQUENCIES[noteWithOct] || NOTE_FREQUENCIES[`${n}3`] || 261.63 * Math.pow(2, idx / 12);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Stagger notes by 45ms to emulate natural guitar string strumming
      const startTime = ctx.currentTime + idx * 0.045;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.35);
    });
  } catch (e) {
    console.warn('Audio synthesis not supported:', e);
  }
}
