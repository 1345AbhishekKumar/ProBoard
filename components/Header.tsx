import React, { useCallback } from 'react';
import { Plus, Undo, Redo, Menu, Search } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';
import { Note } from '@/lib/types';

export default function Header() {
  const { 
    stateRef, isSidebarOpen, setIsSidebarOpen, forceUpdate,
    searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
    worldRef, gridRef
  } = useAppContext();
  const { undo, redo, addNote, switchFolder, saveToStorage } = useActions();

  const updateTransform = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.style.transform = `translate(${stateRef.current.view.x}px, ${stateRef.current.view.y}px) scale(${stateRef.current.view.zoom})`;
    }
    if (gridRef.current) {
      gridRef.current.style.backgroundSize = `${24 * stateRef.current.view.zoom}px ${24 * stateRef.current.view.zoom}px`;
      gridRef.current.style.backgroundPosition = `${stateRef.current.view.x}px ${stateRef.current.view.y}px`;
    }
    forceUpdate();
  }, [forceUpdate, gridRef, stateRef, worldRef]);

  const handleSearchResultClick = useCallback((folder: string, note: Note) => {
    if (stateRef.current.currentFolder !== folder) {
      switchFolder(folder);
    }
    
    const targetX = note.x + note.w / 2;
    const targetY = note.y + note.h / 2;
    
    stateRef.current.view.x = window.innerWidth / 2 - targetX * stateRef.current.view.zoom;
    stateRef.current.view.y = window.innerHeight / 2 - targetY * stateRef.current.view.zoom;
    
    stateRef.current.selection.clear();
    stateRef.current.selection.add(note.id);
    
    setSearchQuery('');
    setIsSearchFocused(false);
    
    updateTransform();
    forceUpdate();
    saveToStorage();
  }, [forceUpdate, setIsSearchFocused, setSearchQuery, stateRef, switchFolder, updateTransform, saveToStorage]);

  const searchResults: { folder: string; note: Note }[] = [];
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    for (const folder of stateRef.current.folders) {
      const notes = stateRef.current.notes[folder] || [];
      for (const note of notes) {
        const textContent = note.content.replace(/<[^>]*>?/gm, '').toLowerCase();
        if (textContent.includes(query)) {
          searchResults.push({ folder, note });
        }
      }
    }
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 z-20 flex-shrink-0 absolute top-0 left-0 right-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-slate-200"></div>
        <span className="font-bold text-lg text-slate-800 tracking-tight">
          {stateRef.current.currentFolder}
        </span>
      </div>

      <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
        <button
          onClick={undo}
          className="p-2 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-lg transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          className="p-2 text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm rounded-lg transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 max-w-md mx-8 relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full bg-slate-100/80 border border-slate-200/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all"
          />
        </div>
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No notes found</div>
            ) : (
              searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => handleSearchResultClick(res.folder, res.note)}
                  className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-blue-500 mb-1">{res.folder}</div>
                  <div className="text-sm text-slate-700 line-clamp-2">
                    {res.note.content.replace(/<[^>]*>?/gm, '') || 'Empty note'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs font-mono font-medium text-slate-400 w-12 text-right">
          {Math.round(stateRef.current.view.zoom * 100)}%
        </div>
        <button
          onClick={addNote}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>
    </header>
  );
}
