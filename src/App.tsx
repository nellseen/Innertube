import React, { useState } from 'react';
import type { NavigationPage } from './types/music.js';
import { PlayerProvider } from './contexts/PlayerContext.js';
import { LibraryProvider } from './contexts/LibraryContext.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { MobileHeader } from './components/layout/MobileHeader.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { BottomPlayer } from './components/player/BottomPlayer.js';
import { MobileMiniPlayer } from './components/player/MobileMiniPlayer.js';
import { FullscreenPlayer } from './components/player/FullscreenPlayer.js';
import { QueueModal } from './components/player/QueueModal.js';
import { LyricsPanel } from './components/player/LyricsPanel.js';
import { CreatePlaylistModal } from './components/modals/CreatePlaylistModal.js';

import { HomePage } from './pages/HomePage.js';
import { TrendingPage } from './pages/TrendingPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { ArtistPage } from './pages/ArtistPage.js';
import { AlbumPage } from './pages/AlbumPage.js';
import { PlaylistPage } from './pages/PlaylistPage.js';
import { LibraryPage } from './pages/LibraryPage.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>({ name: 'home' });
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

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
    <LibraryProvider>
      <PlayerProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#090A0F] text-white font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Subtle Ambient Background Gradients */}
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-rose-600/5 blur-[140px]" />
          </div>

          {/* Desktop Sidebar */}
          <Sidebar
            currentPage={currentPage}
            onNavigate={navigateTo}
            onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
            {/* Mobile Header */}
            <MobileHeader
              currentPage={currentPage}
              onSearchClick={() => navigateTo({ name: 'search' })}
            />

            {/* Page Router Outlet */}
            {renderCurrentPage()}
          </main>

          {/* Player Interfaces */}
          {/* 1. Desktop Bottom Dock */}
          <BottomPlayer
            onOpenFullscreen={() => setIsFullscreenOpen(true)}
            onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
            onToggleLyrics={() => setIsLyricsOpen((prev) => !prev)}
            isQueueOpen={isQueueOpen}
            isLyricsOpen={isLyricsOpen}
            onNavigateToArtist={(id) => navigateTo({ name: 'artist', id })}
          />

          {/* 2. Mobile Floating Mini Player */}
          <MobileMiniPlayer onOpenFullscreen={() => setIsFullscreenOpen(true)} />

          {/* 3. Mobile Bottom Tab Bar */}
          <MobileNav currentPage={currentPage} onNavigate={navigateTo} />

          {/* 4. Fullscreen Now Playing Modal */}
          <FullscreenPlayer
            isOpen={isFullscreenOpen}
            onClose={() => setIsFullscreenOpen(false)}
          />

          {/* 5. Desktop Queue Drawer */}
          <QueueModal
            isOpen={isQueueOpen}
            onClose={() => setIsQueueOpen(false)}
            onNavigateToArtist={(id) => navigateTo({ name: 'artist', id })}
            onNavigateToAlbum={(id) => navigateTo({ name: 'album', id })}
          />

          {/* 6. Desktop Lyrics Drawer */}
          <LyricsPanel
            isOpen={isLyricsOpen}
            onClose={() => setIsLyricsOpen(false)}
          />

          {/* 7. Create Playlist Modal */}
          <CreatePlaylistModal
            isOpen={isCreatePlaylistOpen}
            onClose={() => setIsCreatePlaylistOpen(false)}
          />
        </div>
      </PlayerProvider>
    </LibraryProvider>
  );
}
