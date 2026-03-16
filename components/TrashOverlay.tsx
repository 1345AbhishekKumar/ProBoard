import React, { useState } from 'react';
import { X, Trash } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';

export default function TrashOverlay() {
  const { stateRef, isTrashOpen, setIsTrashOpen, forceUpdate } = useAppContext();
  const { forceSaveToStorage } = useActions();
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isTrashOpen) return null;

  const restoreAllTrash = () => {
    stateRef.current.trash.forEach(t => {
      if (!stateRef.current.notes[t.folder]) stateRef.current.notes[t.folder] = [];
      stateRef.current.notes[t.folder].push(t.data);
    });
    stateRef.current.trash = [];
    forceUpdate();
    forceSaveToStorage();
  };

  const emptyTrash = () => {
    stateRef.current.trash = [];
    forceUpdate();
    forceSaveToStorage();
    setConfirmEmpty(false);
  };

  const restoreTrashItem = (idx: number) => {
    const item = stateRef.current.trash[idx];
    stateRef.current.trash.splice(idx, 1);
    if (!stateRef.current.notes[item.folder]) stateRef.current.notes[item.folder] = [];
    stateRef.current.notes[item.folder].push(item.data);
    forceUpdate();
    forceSaveToStorage();
  };

  const deleteTrashItem = (idx: number) => {
    stateRef.current.trash.splice(idx, 1);
    forceUpdate();
    forceSaveToStorage();
  };

  return (
    <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-sm z-30 flex flex-col pt-20 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto w-full p-6 flex-1 flex flex-col h-full pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Trash Can</h2>
            <p className="text-slate-500 mt-1">Manage your deleted thoughts.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={restoreAllTrash}
              className="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Restore All
            </button>
            {confirmEmpty ? (
              <div className="flex gap-2 items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                <span className="text-sm font-medium text-red-600 mr-2">Are you sure?</span>
                <button
                  onClick={emptyTrash}
                  className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-md font-medium text-sm shadow-sm transition-all"
                >
                  Yes, Empty
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-md font-medium text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all"
              >
                Empty Trash
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-6">Note Content</div>
            <div className="col-span-3">Original Board</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {stateRef.current.trash.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 h-full">
                <Trash className="w-12 h-12 mb-4 text-slate-200" />
                <p>Trash is empty</p>
              </div>
            ) : (
              stateRef.current.trash.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 items-center hover:bg-slate-50 transition-colors rounded-lg border border-transparent hover:border-slate-200">
                  <div className="col-span-6 font-medium text-sm text-slate-700 truncate" title={item.data.content.replace(/<[^>]*>?/gm, '')}>
                    {item.data.content.replace(/<[^>]*>?/gm, '') || 'Untitled Note'}
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded">
                      {item.folder}
                    </span>
                  </div>
                  <div className="col-span-3 text-right flex justify-end gap-3">
                    <button
                      onClick={() => restoreTrashItem(idx)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => deleteTrashItem(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsTrashOpen(false)}
            className="text-slate-400 hover:text-slate-800 font-medium text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <X className="w-4 h-4" />
            Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
