import { useCallback } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { useCanvasMouseEvents } from './useCanvasMouseEvents';
import { useActions } from './useActions';

export const useCanvasEvents = () => {
  const { 
    stateRef, forceUpdate, isDraggingRef, dragModeRef, dragStartRef, lastMouseRef, resizeTargetRef,
    worldRef, gridRef, contextMenuRef
  } = useAppContext();
  const { saveToStorage } = useActions();

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

  useCanvasMouseEvents(updateTransform);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    if (e.button === 2) return;
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';

    const target = e.target as HTMLElement;
    const noteEl = target.closest('.note-element') as HTMLElement;

    if (target.classList.contains('resize-handle') && noteEl) {
      isDraggingRef.current = true;
      dragModeRef.current = 'resize';
      resizeTargetRef.current = noteEl.dataset.id || null;
      return;
    }

    if (e.button === 1 || (e.button === 0 && (e.nativeEvent as any).getModifierState("Space"))) {
      isDraggingRef.current = true;
      dragModeRef.current = 'pan';
      document.body.style.cursor = 'grabbing';
      return;
    }

    if (noteEl && e.button === 0) {
      const id = noteEl.dataset.id;
      if (id) {
        if (e.shiftKey) {
          if (stateRef.current.selection.has(id)) stateRef.current.selection.delete(id);
          else stateRef.current.selection.add(id);
        } else {
          if (!stateRef.current.selection.has(id)) {
            stateRef.current.selection.clear();
            stateRef.current.selection.add(id);
          }
        }
        
        const now = Date.now();
        stateRef.current.selection.forEach(selId => {
          const n = stateRef.current.notes[stateRef.current.currentFolder]?.find(x => x.id === selId);
          if (n) n.z = now;
        });
        
        forceUpdate();
        
        if (target.tagName.toLowerCase() !== 'textarea') {
          isDraggingRef.current = true;
          dragModeRef.current = 'move';
        }
      }
      return;
    }

    if (!noteEl && e.button === 0) {
      if (!e.shiftKey) {
        stateRef.current.selection.clear();
        forceUpdate();
      }
      isDraggingRef.current = true;
      dragModeRef.current = 'select';
      const wx = (e.clientX - stateRef.current.view.x) / stateRef.current.view.zoom;
      const wy = (e.clientY - stateRef.current.view.y) / stateRef.current.view.zoom;
      dragStartRef.current = { x: wx, y: wy, screenX: e.clientX, screenY: e.clientY };
    }
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    const s = 0.001;
    const d = -e.deltaY * s;
    const newZoom = Math.min(Math.max(0.1, stateRef.current.view.zoom + d), 5);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const wx = (mx - stateRef.current.view.x) / stateRef.current.view.zoom;
    const wy = (my - stateRef.current.view.y) / stateRef.current.view.zoom;

    stateRef.current.view.x = mx - wx * newZoom;
    stateRef.current.view.y = my - wy * newZoom;
    stateRef.current.view.zoom = newZoom;
    
    updateTransform();
    saveToStorage();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const noteEl = target.closest('.note-element') as HTMLElement;
    
    if (noteEl) {
      const id = noteEl.dataset.id;
      if (id && !stateRef.current.selection.has(id)) {
        stateRef.current.selection.clear();
        stateRef.current.selection.add(id);
        forceUpdate();
      }
      
      let x = e.clientX;
      let y = e.clientY;
      const w = 200, h = 250;
      if (x + w > window.innerWidth) x -= w;
      if (y + h > window.innerHeight) y -= h;

      if (contextMenuRef.current) {
        contextMenuRef.current.style.display = 'block';
        contextMenuRef.current.style.left = `${x}px`;
        contextMenuRef.current.style.top = `${y}px`;
      }
    }
  };

  return { handleCanvasMouseDown, handleCanvasWheel, handleContextMenu, updateTransform };
};
