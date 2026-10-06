import React, { useState } from 'react';
import { X, ListMusic } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext.js';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createPlaylist } = useLibrary();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createPlaylist(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[#10131E] border border-white/[0.1] shadow-2xl p-6 select-none"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Create Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
              Playlist Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Midnight Vibes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:border-cyan-400 focus:bg-white/[0.08] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Give your playlist a personal vibe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/30 text-sm focus:border-cyan-400 focus:bg-white/[0.08] outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 rounded-2xl bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
