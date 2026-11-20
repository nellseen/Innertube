import React, { useState } from 'react';
import type { NavigationPage } from './types/music.js';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext.js';
import { LibraryProvider } from './contexts/LibraryContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { SceneProvider, useScene } from './contexts/SceneContext.js';

import { Sidebar } from './components/layout/Sidebar.js';
import { MobileHeader } from './components/layout/MobileHeader.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { BottomPlayer } from './components/player/BottomPlayer.js';
import { MobileMiniPlayer } from './components/player/MobileMiniPlayer.js';
import { FullscreenPlayer } from './components/player/FullscreenPlayer.js';
import { QueueModal } from './components/player/QueueModal.js';
import { LyricsPanel } from './components/player/LyricsPanel.js';
import { CreatePlaylistModal } from './components/modals/CreatePlaylistModal.js';
import { AboutModal } from './components/modals/AboutModal.js';
import { ThemeModal } from './components/modals/ThemeModal.js';
import { SceneCanvas } from './components/scene/SceneCanvas.js';

import { HomePage } from './pages/HomePage.js';
import { TrendingPage } from './pages/TrendingPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { ArtistPage } from './pages/ArtistPage.js';
import { AlbumPage } from './pages/AlbumPage.js';
import { PlaylistPage } from './pages/PlaylistPage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { MediaScenePage } from './pages/MediaScenePage.js';
import { ChordPage } from './pages/ChordPage.js';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>({ name: 'home' });
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { currentTrack } = usePlayer();
  const { isBackgroundActive, activeSceneType, backgroundDim } = useScene();

  const navigateTo = (page: NavigationPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentPage.name) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'trending':
        return <TrendingPage onNavigate={navigateTo} />;
      case 'search':
        return <SearchPage initialQuery={currentPage.initialQuery} onNavigate={navigateTo} />;
      case 'scene':
        return <MediaScenePage onNavigate={navigateTo} />;
      case 'chords':
        return (
          <ChordPage
            initialSong={currentPage.song}
            initialQuery={currentPage.initialQuery}
            onNavigate={navigateTo}
          />
        );
      case 'artist':
        return <ArtistPage artistId={currentPage.id} onNavigate={navigateTo} />;
      case 'album':
        return <AlbumPage albumId={currentPage.id} onNavigate={navigateTo} />;
      case 'playlist':
        return <PlaylistPage playlistId={currentPage.id} onNavigate={navigateTo} />;
      case 'library':
        return (
          <LibraryPage
            initialTab={currentPage.tab}
            onNavigate={navigateTo}
            onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          />
        );
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-white font-sans antialiased selection:bg-white/20 selection:text-white"
    >
      {isBackgroundActive && currentPage.name !== 'scene' && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <SceneCanvas sceneType={activeSceneType} dimOverlay={0.25} />
          </div>
          <div
            className="pointer-events-none fixed inset-0 z-[1]"
            style={{ backgroundColor: `rgba(17, 18, 15, ${Math.max(0.72, backgroundDim)})` }}
          />
        </>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader
          currentPage={currentPage}
          onSearchClick={() => navigateTo({ name: 'search' })}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenTheme={() => setIsThemeOpen(true)}
        />

        {/* Page Router Outlet */}
        {renderCurrentPage()}
      </main>

      {/* Player Interfaces */}
      {/* Desktop Bottom Dock */}
      <BottomPlayer
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        onToggleLyrics={() => setIsLyricsOpen((prev) => !prev)}
        isQueueOpen={isQueueOpen}
        isLyricsOpen={isLyricsOpen}
        onNavigateToArtist={(id) => navigateTo({ name: 'artist', id })}
        onNavigateToScene={() => navigateTo({ name: 'scene' })}
        onNavigateToChords={(song) =>
          navigateTo({ name: 'chords', song: song || currentTrack || undefined })
        }
      />

      {/* Mobile Floating Mini Player */}
      <MobileMiniPlayer
        onOpenFullscreen={() => setIsFullscreenOpen(true)}
        onNavigateToChords={(song) =>
          navigateTo({ name: 'chords', song: song || currentTrack || undefined })
        }
      />

      {/* Mobile Bottom Tab Bar */}
      <MobileNav currentPage={currentPage} onNavigate={navigateTo} />

      {/* Fullscreen Now Playing Modal */}
      <FullscreenPlayer
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />

      {/* Desktop Queue Drawer */}
      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onNavigateToArtist={(id) => navigateTo({ name: 'artist', id })}
        onNavigateToAlbum={(id) => navigateTo({ name: 'album', id })}
      />

      {/* Desktop Lyrics Drawer */}
      <LyricsPanel
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />

      {/* About Nell Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Theme Switching Modal */}
      <ThemeModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <PlayerProvider>
          <SceneProvider>
            <AppContent />
          </SceneProvider>
        </PlayerProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
