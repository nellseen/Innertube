import React, { memo } from 'react';
import { toSafeText } from '../../utils/text.js';

interface OptimizedLyricsLineProps {
  index: number;
  text: string;
  translation?: string;
  romaji?: string;
  showTranslation?: boolean;
  showRomaji?: boolean;
  hasTimestamp: boolean;
  startMs?: number;
  isActive: boolean;
  isLarge?: boolean;
  onSeek?: (startMs: number) => void;
}

export const OptimizedLyricsLine = memo<OptimizedLyricsLineProps>(
  ({
    index,
    text,
    translation,
    romaji,
    showTranslation = true,
    showRomaji = true,
    hasTimestamp,
    startMs,
    isActive,
    isLarge = false,
    onSeek,
  }) => {
    const handleClick = () => {
      if (hasTimestamp && startMs !== undefined && onSeek) {
        onSeek(startMs);
      }
    };

    return (
      <div
        id={`lyrics-line-${index}`}
        data-index={index}
        onClick={handleClick}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: isLarge ? '0 64px' : '0 48px',
        }}
        className={`w-full text-center transition-all duration-150 select-none ${
          hasTimestamp ? 'cursor-pointer' : 'cursor-default'
        } ${
          isLarge
            ? 'py-2.5 px-4 rounded-2xl text-lg sm:text-2xl font-semibold'
            : 'py-2 px-3 rounded-xl text-sm sm:text-base font-medium'
        } ${
          isActive
            ? 'text-white font-bold opacity-100 bg-white/[0.08] scale-[1.01]'
            : 'text-white/35 hover:text-white/65 opacity-60 hover:opacity-90'
        }`}
      >
        {/* Original Lyrics Line */}
        <p className="leading-relaxed tracking-normal">{toSafeText(text)}</p>

        {/* Optional Romaji / Phonetic helper */}
        {showRomaji && romaji && (
          <p
            className={`text-xs sm:text-sm font-mono mt-0.5 tracking-wide transition-opacity ${
              isActive ? 'text-cyan-300 font-medium' : 'text-cyan-300/40'
            }`}
          >
            {toSafeText(romaji)}
          </p>
        )}

        {/* Translation text */}
        {showTranslation && translation && (
          <p
            className={`text-xs sm:text-sm mt-0.5 tracking-wide transition-opacity ${
              isActive ? 'text-indigo-200 font-medium' : 'text-indigo-200/40'
            }`}
          >
            {toSafeText(translation)}
          </p>
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.text === next.text &&
      prev.translation === next.translation &&
      prev.romaji === next.romaji &&
      prev.showTranslation === next.showTranslation &&
      prev.showRomaji === next.showRomaji &&
      prev.isLarge === next.isLarge &&
      prev.hasTimestamp === next.hasTimestamp &&
      prev.startMs === next.startMs
    );
  }
);

OptimizedLyricsLine.displayName = 'OptimizedLyricsLine';
