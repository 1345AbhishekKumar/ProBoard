import { useEffect } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from './useActions';
import { useMinimap } from './useMinimap';

export const useCanvasMouseEvents = (updateTransform: () => void) => {
  const { 
    stateRef, forceUpdate, isDraggingRef, dragModeRef, dragStartRef, lastMouseRef, resizeTargetRef,
    selectRectRef
  } = useAppContext();
  const { pushState, saveToStorage } = useActions();
  const { renderMinimap } = useMinimap();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      if (dragModeRef.current === 'pan') {
        stateRef.current.view.x += dx;
        stateRef.current.view.y += dy;
        updateTransform();
      } else if (dragModeRef.current === 'move') {
        const wdx = dx / stateRef.current.view.zoom;
        const wdy = dy / stateRef.current.view.zoom;
        
        stateRef.current.selection.forEach(id => {
          const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === id);
          if (n) {
            n.x += wdx;
            n.y += wdy;
            const el = document.getElementById(`note-${id}`);
            if (el) {
              el.style.transform = `translate(${n.x}px, ${n.y}px)`;
            }
          }
        });
        renderMinimap();
      } else if (dragModeRef.current === 'resize') {
        const wdx = dx / stateRef.current.view.zoom;
        const wdy = dy / stateRef.current.view.zoom;
        const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === resizeTargetRef.current);
        if (n) {
          n.w = Math.max(100, n.w + wdx);
          n.h = Math.max(100, n.h + wdy);
          const el = document.getElementById(`note-${n.id}`);
          if (el) {
            el.style.width = `${n.w}px`;
            el.style.height = `${n.h}px`;
          }
        }
        renderMinimap();
      } else if (dragModeRef.current === 'select') {
        if (selectRectRef.current) {
          const sx = Math.min(e.clientX, dragStartRef.current.screenX);
          const sy = Math.min(e.clientY, dragStartRef.current.screenY);
          const sw = Math.abs(e.clientX - dragStartRef.current.screenX);
          const sh = Math.abs(e.clientY - dragStartRef.current.screenY);
          
          selectRectRef.current.style.display = 'block';
          selectRectRef.current.style.left = `${sx}px`;
          selectRectRef.current.style.top = `${sy}px`;
          selectRectRef.current.style.width = `${sw}px`;
          selectRectRef.current.style.height = `${sh}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      
      if (dragModeRef.current === 'select') {
        const wx = (e.clientX - stateRef.current.view.x) / stateRef.current.view.zoom;
        const wy = (e.clientY - stateRef.current.view.y) / stateRef.current.view.zoom;
        
        const x1 = Math.min(dragStartRef.current.x, wx);
        const x2 = Math.max(dragStartRef.current.x, wx);
        const y1 = Math.min(dragStartRef.current.y, wy);
        const y2 = Math.max(dragStartRef.current.y, wy);

        stateRef.current.notes[stateRef.current.currentFolder]?.forEach(n => {
          if (n.x < x2 && n.x + n.w > x1 && n.y < y2 && n.y + n.h > y1) {
            stateRef.current.selection.add(n.id);
          }
        });
        forceUpdate();
      }
      
      if (dragModeRef.current === 'move' || dragModeRef.current === 'resize') {
        pushState();
        forceUpdate();
      } else if (dragModeRef.current === 'pan') {
        saveToStorage();
      }

      isDraggingRef.current = false;
      dragModeRef.current = null;
      document.body.style.cursor = 'default';
      if (selectRectRef.current) {
        selectRectRef.current.style.display = 'none';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragModeRef, dragStartRef, forceUpdate, isDraggingRef, lastMouseRef, pushState, renderMinimap, resizeTargetRef, selectRectRef, stateRef, updateTransform, saveToStorage]);
};
