import { describe, it, expect } from 'vitest';
import { getChordTheory } from '../../src/components/chords/ChordTheory.js';

describe('Chord Theory & Transposition Engine', () => {
  it('should parse standard major chords correctly', () => {
    const theory = getChordTheory('C');
    expect(theory).toBeDefined();
    expect(theory.tonic).toBe('C');
    expect(theory.type).toBe('major');
    expect(theory.notes).toContain('C');
    expect(theory.notes).toContain('E');
    expect(theory.notes).toContain('G');
  });

  it('should parse minor and 7th chords correctly', () => {
    const am = getChordTheory('Am');
    expect(am).toBeDefined();
    expect(am.tonic).toBe('A');
    expect(am.type).toBe('minor');
    expect(am.notes).toContain('A');
    expect(am.notes).toContain('C');
    expect(am.notes).toContain('E');

    const g7 = getChordTheory('G7');
    expect(g7).toBeDefined();
    expect(g7.tonic).toBe('G');
    expect(g7.notes).toContain('G');
    expect(g7.notes).toContain('B');
    expect(g7.notes).toContain('D');
    expect(g7.notes).toContain('F');
  });

  it('should provide default fallback for complex or unknown chords', () => {
    const unknown = getChordTheory('XyzDiminished7');
    expect(unknown).toBeDefined();
    expect(Array.isArray(unknown.notes)).toBe(true);
  });
});
