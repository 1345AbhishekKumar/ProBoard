import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Folder, Trash, Check, X } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';

export default function Sidebar() {
  const { stateRef, isSidebarOpen, setIsTrashOpen } = useAppContext();
  const { switchFolder, deleteFolder, createFolder } = useActions();

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

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

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-[260px] ml-0' : 'w-[260px] -ml-[260px]'
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-lg mr-3">
          P
        </div>
        <span className="font-bold text-slate-800 text-lg tracking-tight">ProBoard</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-6 py-3 text-[0.7rem] uppercase tracking-widest text-slate-400 font-bold">
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
                    ? 'bg-blue-50 text-blue-600 shadow-[0_1px_2px_rgba(59,130,246,0.05)]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Folder className={`w-4 h-4 ${f === stateRef.current.currentFolder ? 'text-blue-500' : 'text-slate-400'}`} />
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
                <div className="mx-3 my-1 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-600 font-medium mb-2">Delete &quot;{f}&quot;?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { deleteFolder(f); setFolderToDelete(null); }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 rounded transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setFolderToDelete(null)}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-600 text-xs py-1.5 rounded border border-slate-200 transition-colors"
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
            <div className="flex items-center gap-2 px-3 py-2 mx-0 my-1 rounded-lg border border-blue-300 bg-blue-50">
              <input
                ref={inputRef}
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Board name..."
                className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none min-w-0"
              />
              <button onClick={handleCreateSubmit} className="text-blue-600 hover:text-blue-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsCreating(false); setNewFolderName(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-semibold px-3 py-2 rounded-lg transition-all w-full border border-dashed border-slate-300 hover:border-blue-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Board
            </button>
          )}
        </div>

        <div className="px-6 py-3 mt-6 text-[0.7rem] uppercase tracking-widest text-slate-400 font-bold">
          System
        </div>
        <div
          onClick={() => setIsTrashOpen(true)}
          className="group flex items-center justify-between px-3 py-2.5 mx-3 my-1 rounded-lg cursor-pointer text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
              <Trash className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-red-600 transition-colors">Trash</span>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
            {stateRef.current.trash.length}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            Online
          </span>
          <span>v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
