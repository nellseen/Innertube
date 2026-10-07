import React, { useState } from 'react';
import type { NavigationPage } from './types/music.js';
import { PlayerProvider } from './contexts/PlayerContext.js';
import { LibraryProvider } from './contexts/LibraryContext.js';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.js';
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
import { LoadingScreen } from './components/modals/LoadingScreen.js';
import { SceneCanvas } from './components/scene/SceneCanvas.js';

import { HomePage } from './pages/HomePage.js';
import { TrendingPage } from './pages/TrendingPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { ArtistPage } from './pages/ArtistPage.js';
import { AlbumPage } from './pages/AlbumPage.js';
import { PlaylistPage } from './pages/PlaylistPage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { MediaScenePage } from './pages/MediaScenePage.js';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>({ name: 'home' });
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  const { themeConfig } = useTheme();
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
      style={{ backgroundColor: themeConfig.bgBase }}
      className="flex h-screen w-screen overflow-hidden text-white font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-500 relative"
    >
      {/* 1. Global Animated Media Scene as Background (when activated) */}
      {isBackgroundActive && currentPage.name !== 'scene' && (
        <>
          <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
            <SceneCanvas sceneType={activeSceneType} dimOverlay={0.25} />
          </div>
          {/* Calibrated dark overlay guaranteeing 100% text readability */}
          <div
            className="fixed inset-0 pointer-events-none -z-10 backdrop-blur-[3px] transition-colors duration-500"
            style={{ backgroundColor: `rgba(9, 10, 15, ${Math.max(0.6, backgroundDim)})` }}
          />
        </>
      )}

      {/* 2. Theme Ambient Background Glows */}
      {!isBackgroundActive && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] opacity-40 transition-all duration-700"
            style={{ backgroundColor: themeConfig.accentPrimary }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] opacity-30 transition-all duration-700"
            style={{ backgroundColor: themeConfig.accentSecondary }}
          />
          <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] rounded-full bg-rose-600/5 blur-[140px]" />
        </div>
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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
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
      />

      {/* Mobile Floating Mini Player */}
      <MobileMiniPlayer onOpenFullscreen={() => setIsFullscreenOpen(true)} />

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

      {/* First-load Loading Screen */}
      {showLoadingScreen && (
        <LoadingScreen onFinish={() => setShowLoadingScreen(false)} />
      )}
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
