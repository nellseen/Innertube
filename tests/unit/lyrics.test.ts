import { describe, it, expect } from 'vitest';

// O(log N) binary search for timestamp resolution
function getActiveLineIndex(
  lines: Array<{ startMs?: number; text?: string }>,
  currentMs: number,
  durationSec: number
): number {
  if (!lines || lines.length === 0) return -1;

  const hasTimestamps = lines[0]?.startMs !== undefined || lines[1]?.startMs !== undefined;

  if (hasTimestamps) {
    let low = 0;
    let high = lines.length - 1;
    let result = -1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const start = lines[mid].startMs;
      if (start !== undefined && start <= currentMs) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result >= 0 ? result : 0;
  }

  if (durationSec > 0 && currentMs > 0) {
    const progress = Math.min(1, Math.max(0, currentMs / (durationSec * 1000)));
    return Math.min(lines.length - 1, Math.floor(progress * lines.length));
  }

  return 0;
}

describe('Synced Lyrics Timestamp Resolver', () => {
  const sampleLines = [
    { startMs: 0, text: 'Intro instrumentals' },
    { startMs: 5000, text: 'First verse starts here' },
    { startMs: 12000, text: 'Second line of the verse' },
    { startMs: 25000, text: 'Chorus erupts with energy' },
  ];

  it('should find exact matching line for given current timestamp', () => {
    expect(getActiveLineIndex(sampleLines, 0, 180)).toBe(0);
    expect(getActiveLineIndex(sampleLines, 4999, 180)).toBe(0);
    expect(getActiveLineIndex(sampleLines, 5000, 180)).toBe(1);
    expect(getActiveLineIndex(sampleLines, 8000, 180)).toBe(1);
    expect(getActiveLineIndex(sampleLines, 12500, 180)).toBe(2);
    expect(getActiveLineIndex(sampleLines, 30000, 180)).toBe(3);
  });

  it('should return 0 when time is before first line', () => {
    expect(getActiveLineIndex(sampleLines, -100, 180)).toBe(0);
  });

  it('should handle plain unsynced lines gracefully via duration percentage', () => {
    const plainLines = [{ text: 'Line 1' }, { text: 'Line 2' }, { text: 'Line 3' }, { text: 'Line 4' }];
    expect(getActiveLineIndex(plainLines, 0, 100)).toBe(0);
    expect(getActiveLineIndex(plainLines, 50000, 100)).toBe(2);
    expect(getActiveLineIndex(plainLines, 100000, 100)).toBe(3);
  });
});
