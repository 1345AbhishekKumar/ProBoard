import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Folder, Trash, Check, X, LogOut, Loader2, CloudOff, CloudLightning, Cloud, DatabaseBackup } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const { stateRef, isSidebarOpen, setIsTrashOpen, syncStatus, forceUpdate, changesCountRef } = useAppContext();
  const { switchFolder, deleteFolder, createFolder, saveToStorage } = useActions();

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRestoreBackup = () => {
    if (window.confirm('Are you sure you want to restore from the local backup? This will overwrite your current unsaved changes.')) {
      setIsRestoring(true);
      try {
        const localBackup = localStorage.getItem('corkboard_local_backup');
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          stateRef.current.folders = parsed.folders || ['General'];
          stateRef.current.currentFolder = parsed.currentFolder || 'General';
          stateRef.current.notes = parsed.notes || { 'General': [] };
          stateRef.current.trash = parsed.trash || [];
          stateRef.current.view = parsed.view || { x: 0, y: 0, zoom: 1 };
          stateRef.current.tags = parsed.tags || [];
          stateRef.current.viewMode = parsed.viewMode || 'canvas';
          stateRef.current.sortBy = parsed.sortBy || 'manual';
          stateRef.current.activeFilters = parsed.activeFilters || { color: 'all', tags: [], date: 'all' };
          
          changesCountRef.current++;
          forceUpdate();
          saveToStorage();
          alert('Backup restored successfully!');
        } else {
          alert('No local backup found.');
        }
      } catch (e) {
        console.error('Failed to restore backup', e);
        alert('Failed to restore backup. The backup file might be corrupted.');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateSubmit = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
    }
    setIsCreating(false);
    setNewFolderName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFolderName('');
    }
  };

  const renderSyncStatus = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-blue-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="flex items-center gap-1.5 text-emerald-500">
            <Cloud className="w-3 h-3" />
            Saved
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1.5 text-amber-500">
            <CloudOff className="w-3 h-3" />
            Offline
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-red-500">
            <CloudLightning className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      className={`bg-slate-50 border-r border-slate-200 flex flex-col z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-[260px] ml-0' : 'w-[260px] -ml-[260px]'
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-200/60 flex-shrink-0 bg-white">
        <div className="w-8 h-8 bg-slate-900 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-lg mr-3">
          P
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">ProBoard</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-6 py-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Workspaces
        </div>
        <div>
          {stateRef.current.folders.map(f => (
            <div key={f}>
              <div
                onClick={() => {
                  if (folderToDelete !== f) switchFolder(f);
                }}
                className={`group flex items-center justify-between px-3 py-2.5 mx-3 my-1 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                  f === stateRef.current.currentFolder
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Folder className={`w-4 h-4 ${f === stateRef.current.currentFolder ? 'text-slate-800' : 'text-slate-400'}`} />
                  <span className="truncate">{f}</span>
                </div>
                {stateRef.current.folders.length > 1 && folderToDelete !== f && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFolderToDelete(f); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {folderToDelete === f && (
                <div className="mx-3 my-1 p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                  <p className="text-xs text-red-600 font-medium mb-2">Delete &quot;{f}&quot;?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { deleteFolder(f); setFolderToDelete(null); }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded transition-colors shadow-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setFolderToDelete(null)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-600 text-xs py-1.5 rounded border border-slate-200 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 mt-3">
          {isCreating ? (
            <div className="flex items-center gap-2 px-3 py-2 mx-0 my-1 rounded-lg border border-slate-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Board name..."
                className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none min-w-0 placeholder:text-slate-400"
              />
              <button onClick={handleCreateSubmit} className="text-blue-600 hover:text-blue-700 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsCreating(false); setNewFolderName(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 font-semibold px-3 py-2 rounded-lg transition-all w-full border border-dashed border-slate-300 hover:border-slate-400"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Board
            </button>
          )}
        </div>

        <div className="px-6 py-3 mt-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          System
        </div>
        <div
          onClick={() => setIsTrashOpen(true)}
          className="group flex items-center justify-between px-3 py-2.5 mx-3 my-1 rounded-lg cursor-pointer text-sm font-medium text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-white border border-slate-200/60 text-slate-500 group-hover:bg-red-50 group-hover:border-red-200 group-hover:text-red-500 transition-colors shadow-sm">
              <Trash className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-red-600 transition-colors">Trash</span>
          </div>
          <span className="text-[10px] font-bold bg-white border border-slate-200/60 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-red-100 group-hover:text-red-600 group-hover:border-red-200 transition-colors shadow-sm">
            {stateRef.current.trash.length}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200/60 bg-white space-y-3">
        <button
          onClick={handleRestoreBackup}
          disabled={isRestoring}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100 disabled:opacity-50"
        >
          {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
          Restore Backup
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
          {renderSyncStatus()}
          <span className="font-mono">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
