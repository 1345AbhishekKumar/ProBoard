import React from 'react';
import { Copy, ArrowDownToLine, ArrowUpToLine, Trash2, Sparkles } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';
import { COLORS, Note } from '@/lib/types';

export default function ContextMenu() {
  const { stateRef, forceUpdate, contextMenuRef } = useAppContext();
  const { pushState, deleteSelection, duplicateSelection, improveSelection } = useActions();

  const setColor = (color: string) => {
    stateRef.current.selection.forEach(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      if (n) n.color = color;
    });
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    forceUpdate();
    pushState();
  };

  const sendToBack = () => {
    stateRef.current.selection.forEach(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      if (n) n.z = -Date.now();
    });
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    forceUpdate();
  };

  const bringToFront = () => {
    stateRef.current.selection.forEach(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      if (n) n.z = Date.now();
    });
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    forceUpdate();
  };

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-[9999] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl min-w-[180px] p-1.5 hidden animate-in zoom-in-95 duration-100"
    >
      <div className="flex p-2 gap-2 justify-center">
        {Object.entries(COLORS).map(([name, { bg, border }]) => (
          <div
            key={name}
            onClick={() => setColor(name)}
            className="w-5 h-5 rounded-full border cursor-pointer hover:scale-110 transition-transform shadow-sm"
            style={{ backgroundColor: bg, borderColor: border }}
            title={name}
          />
        ))}
      </div>
      <div className="h-px bg-slate-100 my-1.5" />
      <div
        onClick={improveSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-indigo-400" /> AI Improve
      </div>
      <div className="h-px bg-slate-100 my-1.5" />
      <div
        onClick={duplicateSelection}
        className="px-3 py-2 text-sm font-medium text-slate-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Copy className="w-4 h-4 text-slate-400" /> Duplicate
      </div>
      <div
        onClick={sendToBack}
        className="px-3 py-2 text-sm font-medium text-slate-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <ArrowDownToLine className="w-4 h-4 text-slate-400" /> Send to Back
      </div>
      <div
        onClick={bringToFront}
        className="px-3 py-2 text-sm font-medium text-slate-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <ArrowUpToLine className="w-4 h-4 text-slate-400" /> Bring to Front
      </div>
      <div className="h-px bg-slate-100 my-1.5" />
      <div
        onClick={deleteSelection}
        className="px-3 py-2 text-sm font-medium text-red-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-red-50 hover:text-red-700 transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-400" /> Delete
      </div>
    </div>
  );
}
