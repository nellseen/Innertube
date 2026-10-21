import { describe, it, expect } from 'vitest';
import healthRoute from '../../server/routes/health.js';
import { deepSanitizeResponse } from '../../server/sanitizer.js';

describe('Backend API Integration & Sanitization', () => {
  it('deepSanitizeResponse should clean and strip internal YouTube artifacts into string', () => {
    const raw = {
      title: 'Valid Song Title',
      subtitle: { rtl: false, text: 'Artist Name' },
      nested: {
        rawObj: 'clean nested',
        valid: 'clean value',
      },
    };

    const sanitized = deepSanitizeResponse(raw);
    expect(sanitized.title).toBe('Valid Song Title');
    // Subtitle object with rtl is collapsed to clean string
    expect(sanitized.subtitle).toBe('Artist Name');
    expect(sanitized.nested.valid).toBe('clean value');
  });

  it('health router should export a valid Express router function', () => {
    expect(typeof healthRoute).toBe('function');
  });
});
