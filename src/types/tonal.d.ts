declare module 'tonal' {
  export interface ChordType {
    empty: boolean;
    name: string;
    setNum?: number;
    chroma?: string;
    normalized?: string;
    intervals: string[];
    quality: string;
    aliases: string[];
    symbol: string;
    tonic: string;
    type: string;
    root?: string;
    bass?: string;
    rootDegree?: number;
    notes: string[];
  }

  export namespace Chord {
    export function get(chordName: string): ChordType;
    export function transpose(chordName: string, interval: string): string;
    export function chord(chordName: string): ChordType;
  }

  export namespace Note {
    export function get(noteName: string): any;
    export function transpose(noteName: string, interval: string): string;
  }
}
