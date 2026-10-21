import { describe, it, expect } from 'vitest';
import { toSafeText } from '../../src/utils/text.js';

describe('Text Sanitizer & Utility Functions', () => {
  it('toSafeText should return fallback when value is null or undefined', () => {
    expect(toSafeText(null, 'Fallback')).toBe('Fallback');
    expect(toSafeText(undefined, 'Default Title')).toBe('Default Title');
    expect(toSafeText('  Bohemian Rhapsody  ')).toBe('Bohemian Rhapsody');
  });

  it('toSafeText should sanitize objects and extract nested text correctly', () => {
    expect(toSafeText({ text: 'Coldplay' })).toBe('Coldplay');
    expect(toSafeText({ name: 'Adele' })).toBe('Adele');
    expect(toSafeText({ title: 'Viva La Vida' })).toBe('Viva La Vida');
    expect(toSafeText({ runs: [{ text: 'Taylor ' }, { text: 'Swift' }] })).toBe('Taylor Swift');
  });

  it('toSafeText should handle empty or fallback cases', () => {
    expect(toSafeText(null)).toBe('');
    expect(toSafeText(undefined)).toBe('');
    expect(toSafeText({}, 'Default Fallback')).toBe('Default Fallback');
  });
});
