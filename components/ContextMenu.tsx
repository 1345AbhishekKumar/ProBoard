import React, { useState, useEffect } from 'react';
import { Copy, ArrowDownToLine, ArrowUpToLine, Trash2, Sparkles, BookmarkPlus, Check, Lock, Unlock, Tag as TagIcon, FileText, CheckSquare, FolderSymlink, Lightbulb } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';
import { COLORS, Note, Tag } from '@/lib/types';

export default function ContextMenu() {
  const { stateRef, forceUpdate, contextMenuRef } = useAppContext();
  const { pushState, deleteSelection, duplicateSelection, improveSelection, summarizeSelection, extractTasksSelection, getSmartSuggestionsSelection, autoOrganizeSelection, saveAsTemplate } = useActions();
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    setShowTemplateInput(false);
    setTemplateName('');
  }, [stateRef.current.selection]);

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

  const togglePin = () => {
    stateRef.current.selection.forEach(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      if (n) n.isPinned = !n.isPinned;
    });
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    forceUpdate();
    pushState();
  };

  const toggleTag = (tagId: string) => {
    const isAssignedToAll = Array.from(stateRef.current.selection).every(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      return n?.tags?.includes(tagId);
    });

    stateRef.current.selection.forEach(id => {
      const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
      if (n) {
        if (!n.tags) n.tags = [];
        if (isAssignedToAll) {
          n.tags = n.tags.filter(t => t !== tagId);
        } else if (!n.tags.includes(tagId)) {
          n.tags.push(tagId);
        }
        n.updatedAt = Date.now();
      }
    });
    forceUpdate();
    pushState();
  };

  const createAndAssignTag = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    let tag = stateRef.current.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (!tag) {
      tag = {
        // eslint-disable-next-line react-hooks/purity
        id: 'tag_' + Date.now(),
        name: trimmed,
        color: '#475569' // Default slate color
      };
      stateRef.current.tags.push(tag);
    }
    
    toggleTag(tag.id);
  };

  const handleSaveTemplate = () => {
    if (templateName.trim() && stateRef.current.selection.size === 1) {
      const noteId = Array.from(stateRef.current.selection)[0];
      saveAsTemplate(noteId, templateName.trim());
      setShowTemplateInput(false);
      setTemplateName('');
      if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    }
  };

  const isAnyPinned = Array.from(stateRef.current.selection).some(id => {
    const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
    return n?.isPinned;
  });

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-[9999] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-xl min-w-[200px] p-1.5 hidden animate-in zoom-in-95 duration-100"
    >
      <div className="flex p-2 gap-2 justify-center flex-wrap">
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
      <div className="h-px bg-slate-200/60 my-1" />
      <div
        onClick={improveSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-indigo-400" /> AI Improve
      </div>
      <div
        onClick={summarizeSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <FileText className="w-4 h-4 text-indigo-400" /> AI Summarize
      </div>
      <div
        onClick={extractTasksSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <CheckSquare className="w-4 h-4 text-indigo-400" /> AI Extract Tasks
      </div>
      <div
        onClick={getSmartSuggestionsSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <Lightbulb className="w-4 h-4 text-indigo-400" /> AI Smart Suggestions
      </div>
      <div
        onClick={autoOrganizeSelection}
        className="px-3 py-2 text-sm font-medium text-indigo-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
      >
        <FolderSymlink className="w-4 h-4 text-indigo-400" /> AI Auto-Organize
      </div>
      <div className="h-px bg-slate-200/60 my-1" />
      <div
        onClick={togglePin}
        className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        {isAnyPinned ? (
          <><Unlock className="w-4 h-4 text-slate-400" /> Unlock</>
        ) : (
          <><Lock className="w-4 h-4 text-slate-400" /> Lock</>
        )}
      </div>
      <div
        onClick={duplicateSelection}
        className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Copy className="w-4 h-4 text-slate-400" /> Duplicate
      </div>
      
      {stateRef.current.selection.size === 1 && (
        <>
          {showTemplateInput ? (
            <div className="px-2 py-1.5 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTemplate();
                  if (e.key === 'Escape') setShowTemplateInput(false);
                }}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800"
              />
              <button 
                onClick={handleSaveTemplate}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setShowTemplateInput(true)}
              className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-slate-400" /> Save as Template
            </div>
          )}
        </>
      )}

      <div
        onClick={sendToBack}
        className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <ArrowDownToLine className="w-4 h-4 text-slate-400" /> Send to Back
      </div>
      <div
        onClick={bringToFront}
        className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <ArrowUpToLine className="w-4 h-4 text-slate-400" /> Bring to Front
      </div>
      <div className="h-px bg-slate-200/60 my-1" />
      <div className="px-3 py-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <TagIcon className="w-3 h-3" /> Tags
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {stateRef.current.tags.map(tag => {
            const isAssigned = Array.from(stateRef.current.selection).every(id => {
              const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
              return n?.tags?.includes(tag.id);
            });
            return (
              <span
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-2 py-0.5 text-[10px] rounded-md cursor-pointer border transition-colors ${isAssigned ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="New tag..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              createAndAssignTag(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full bg-slate-50 border border-slate-200/60 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800"
        />
      </div>
      <div className="h-px bg-slate-200/60 my-1" />
      <div
        onClick={deleteSelection}
        className="px-3 py-2 text-sm font-medium text-red-600 cursor-pointer rounded-lg flex items-center gap-2.5 hover:bg-red-50 hover:text-red-700 transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-400" /> Delete
      </div>
    </div>
  );
}
