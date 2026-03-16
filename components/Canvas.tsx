import React, { useEffect } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useKeyboardEvents } from '@/hooks/useKeyboardEvents';
import { COLORS } from '@/lib/types';
import NoteEditor from '@/components/NoteEditor';
import { useActions } from '@/hooks/useActions';

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
  const sortedNotes = [...currentNotes].sort((a, b) => (a.z || 0) - (b.z || 0));

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
        className="absolute inset-[-100000px] opacity-50 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
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
              className={`note-element absolute flex flex-col bg-white rounded shadow-sm border transition-[box-shadow,border-color] duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 shadow-xl z-[1000]' : ''
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
              <NoteEditor
                content={note.content}
                color={note.color}
                onChange={(newContent) => {
                  note.content = newContent;
                  forceUpdate();
                  saveToStorage();
                }}
                onColorChange={(newColor) => {
                  note.color = newColor;
                  forceUpdate();
                  saveToStorage();
                }}
                onPointerDown={(e) => e.stopPropagation()}
              />
              <div className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize opacity-0 hover:opacity-100 hover:bg-black/5 rounded-br transition-opacity">
                <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-r-2 border-b-2 border-black/20" />
              </div>
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
