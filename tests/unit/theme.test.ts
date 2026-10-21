import { describe, it, expect } from 'vitest';
import { THEMES } from '../../src/contexts/ThemeContext.js';

describe('Theme Design System & Presets', () => {
  it('should define all 5 required liquid glass themes', () => {
    expect(THEMES.cyber).toBeDefined();
    expect(THEMES.obsidian).toBeDefined();
    expect(THEMES.emerald).toBeDefined();
    expect(THEMES.sunset).toBeDefined();
    expect(THEMES.titanium).toBeDefined();
  });

  it('each theme should specify valid hex background and primary accent colors', () => {
    for (const [id, theme] of Object.entries(THEMES)) {
      expect(theme.id).toBe(id);
      expect(theme.bgBase).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.accentPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.name.length).toBeGreaterThan(0);
    }
  });
});
