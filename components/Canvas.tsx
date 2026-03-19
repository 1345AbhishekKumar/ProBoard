import React, { useEffect } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useKeyboardEvents } from '@/hooks/useKeyboardEvents';
import { COLORS } from '@/lib/types';
import NoteEditor from '@/components/NoteEditor';
import { useActions } from '@/hooks/useActions';
import { Lock, Lightbulb } from 'lucide-react';

export default function Canvas() {
  const { stateRef, forceUpdate, gridRef, worldRef, selectRectRef } = useAppContext();
  const { handleCanvasMouseDown, handleCanvasWheel, handleContextMenu } = useCanvasEvents();
  const { saveToStorage } = useActions();
  
  useKeyboardEvents();

  useEffect(() => {
    const canvas = document.getElementById('canvas-viewport');
    const handleWheel = (e: WheelEvent) => e.preventDefault();
    canvas?.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas?.removeEventListener('wheel', handleWheel);
  }, []);

  const currentNotes = stateRef.current.notes[stateRef.current.currentFolder] || [];
  
  const filters = stateRef.current.activeFilters;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const filteredNotes = currentNotes.filter(note => {
    let matchesColor = true;
    if (filters.color !== 'all') {
      matchesColor = note.color === filters.color;
    }
    
    let matchesDate = true;
    if (filters.date !== 'all') {
      const updatedAt = note.updatedAt || parseInt(note.id.split('_')[1] || '0');
      if (filters.date === 'today') matchesDate = now - updatedAt < dayMs;
      else if (filters.date === 'week') matchesDate = now - updatedAt < 7 * dayMs;
      else if (filters.date === 'month') matchesDate = now - updatedAt < 30 * dayMs;
    }

    let matchesTags = true;
    if (filters.tags.length > 0) {
      matchesTags = filters.tags.every(tagId => note.tags?.includes(tagId));
    }
    
    return matchesColor && matchesDate && matchesTags;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (stateRef.current.sortBy === 'recent') {
      const aTime = a.updatedAt || parseInt(a.id.split('_')[1] || '0');
      const bTime = b.updatedAt || parseInt(b.id.split('_')[1] || '0');
      return bTime - aTime;
    } else if (stateRef.current.sortBy === 'oldest') {
      const aTime = a.updatedAt || parseInt(a.id.split('_')[1] || '0');
      const bTime = b.updatedAt || parseInt(b.id.split('_')[1] || '0');
      return aTime - bTime;
    }
    // manual sort (by z-index)
    return (a.z || 0) - (b.z || 0);
  });

  if (stateRef.current.viewMode === 'grid') {
    return (
      <div className="flex-1 absolute inset-0 overflow-y-auto bg-slate-50/50 p-8 pt-24 z-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {sortedNotes.map(note => {
            const colorTheme = COLORS[note.color as keyof typeof COLORS] || COLORS.yellow;
            const isSelected = stateRef.current.selection.has(note.id);
            return (
              <div
                key={note.id}
                id={`note-${note.id}`}
                data-id={note.id}
                className={`relative flex flex-col rounded-xl shadow-sm border transition-[box-shadow,border-color,transform] duration-200 overflow-hidden h-64 ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02]' : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: colorTheme.bg,
                  borderColor: isSelected ? '#3b82f6' : colorTheme.border,
                }}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    if (isSelected) stateRef.current.selection.delete(note.id);
                    else stateRef.current.selection.add(note.id);
                  } else {
                    stateRef.current.selection.clear();
                    stateRef.current.selection.add(note.id);
                  }
                  forceUpdate();
                }}
              >
                {note.isPinned && (
                  <div className="absolute top-2 right-2 text-slate-400/70 pointer-events-none z-10">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
                {note.tags && note.tags.length > 0 && (
                  <div className="absolute top-2 left-2 right-8 flex flex-wrap gap-1 pointer-events-none z-10 overflow-hidden max-h-4">
                    {note.tags.map(tagId => {
                      const tag = stateRef.current.tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span key={tag.id} className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} title={tag.name} />
                      );
                    })}
                  </div>
                )}
                <NoteEditor
                  content={note.content}
                  color={note.color}
                  onChange={(newContent) => {
                    note.content = newContent;
                    note.updatedAt = Date.now();
                    saveToStorage();
                  }}
                  onColorChange={(newColor) => {
                    note.color = newColor;
                    note.updatedAt = Date.now();
                    forceUpdate();
                    saveToStorage();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />

                {((note.summary && note.summary.length > 0) || (note.tasks && note.tasks.length > 0) || (note.suggestions && note.suggestions.length > 0)) && (
                  <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-lg p-3 text-sm border border-white/40 shadow-sm pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
                    {note.summary && (
                      <div className="mb-3">
                        <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1">AI Summary</div>
                        <div className="text-slate-700 leading-relaxed">{note.summary}</div>
                      </div>
                    )}
                    {note.tasks && note.tasks.length > 0 && (
                      <div className="mb-3">
                        <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tasks</div>
                        <div className="flex flex-col gap-1.5">
                          {note.tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                checked={task.status === 'completed'}
                                onChange={(e) => {
                                  task.status = e.target.checked ? 'completed' : 'pending';
                                  note.updatedAt = Date.now();
                                  forceUpdate();
                                  saveToStorage();
                                }}
                                className="mt-1"
                              />
                              <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {note.suggestions && note.suggestions.length > 0 && (
                      <div>
                        <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Suggestions
                        </div>
                        <ul className="list-disc pl-4 text-slate-700 flex flex-col gap-1">
                          {note.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      id="canvas-viewport"
      className="flex-1 absolute inset-0 overflow-hidden cursor-default z-0"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleCanvasWheel}
      onContextMenu={handleContextMenu}
    >
      <div
        ref={gridRef}
        className="absolute inset-[-100000px] opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
          backgroundSize: `${24 * stateRef.current.view.zoom}px ${24 * stateRef.current.view.zoom}px`,
          backgroundPosition: `${stateRef.current.view.x}px ${stateRef.current.view.y}px`,
        }}
      />
      <div
        id="canvas-world"
        ref={worldRef}
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          transform: `translate(${stateRef.current.view.x}px, ${stateRef.current.view.y}px) scale(${stateRef.current.view.zoom})`,
        }}
      >
        {sortedNotes.map(note => {
          const colorTheme = COLORS[note.color as keyof typeof COLORS] || COLORS.yellow;
          const isSelected = stateRef.current.selection.has(note.id);
          return (
            <div
              key={note.id}
              id={`note-${note.id}`}
              data-id={note.id}
              className={`note-element absolute flex flex-col rounded-xl shadow-sm border transition-[box-shadow,border-color,transform] duration-200 overflow-hidden ${
                isSelected ? 'ring-2 ring-blue-500 shadow-xl z-[1000] scale-[1.01]' : 'hover:shadow-md'
              }`}
              style={{
                transform: `translate(${note.x}px, ${note.y}px)`,
                width: `${note.w}px`,
                height: `${note.h}px`,
                zIndex: isSelected ? 1000 : note.z || 1,
                backgroundColor: colorTheme.bg,
                borderColor: isSelected ? '#3b82f6' : colorTheme.border,
              }}
            >
              {note.isPinned && (
                <div className="absolute top-2 right-2 text-slate-400/70 pointer-events-none z-10">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
              {note.tags && note.tags.length > 0 && (
                <div className="absolute top-2 left-2 right-8 flex flex-wrap gap-1 pointer-events-none z-10 overflow-hidden max-h-4">
                  {note.tags.map(tagId => {
                    const tag = stateRef.current.tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span key={tag.id} className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} title={tag.name} />
                    );
                  })}
                </div>
              )}
              <NoteEditor
                content={note.content}
                color={note.color}
                onChange={(newContent) => {
                  note.content = newContent;
                  note.updatedAt = Date.now();
                  saveToStorage();
                }}
                onColorChange={(newColor) => {
                  note.color = newColor;
                  note.updatedAt = Date.now();
                  forceUpdate();
                  saveToStorage();
                }}
                onPointerDown={(e) => e.stopPropagation()}
              />
              
              {((note.summary && note.summary.length > 0) || (note.tasks && note.tasks.length > 0) || (note.suggestions && note.suggestions.length > 0)) && (
                <div className="absolute bottom-10 left-3 right-3 max-h-[40%] overflow-y-auto bg-white/60 backdrop-blur-sm rounded-lg p-2 text-xs border border-white/40 shadow-sm pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
                  {note.summary && (
                    <div className="mb-2">
                      <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1">AI Summary</div>
                      <div className="text-slate-700 leading-relaxed">{note.summary}</div>
                    </div>
                  )}
                  {note.tasks && note.tasks.length > 0 && (
                    <div className="mb-2">
                      <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tasks</div>
                      <div className="flex flex-col gap-1">
                        {note.tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-1.5">
                            <input 
                              type="checkbox" 
                              checked={task.status === 'completed'}
                              onChange={(e) => {
                                task.status = e.target.checked ? 'completed' : 'pending';
                                note.updatedAt = Date.now();
                                forceUpdate();
                                saveToStorage();
                              }}
                              className="mt-0.5"
                            />
                            <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {note.suggestions && note.suggestions.length > 0 && (
                    <div>
                      <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Suggestions
                      </div>
                      <ul className="list-disc pl-3 text-slate-700 flex flex-col gap-0.5">
                        {note.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!note.isPinned && (
                <div className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity flex items-end justify-end p-1.5">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400/50 rounded-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div
        ref={selectRectRef}
        className="absolute border border-blue-500 bg-blue-500/10 rounded-sm pointer-events-none hidden z-[9999]"
      />
    </div>
  );
}
