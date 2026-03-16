import { useCallback } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { Note } from '@/lib/types';

export const useActions = () => {
  const { stateRef, forceUpdate, historyRef, historyPtrRef, contextMenuRef, changesCountRef, lastSaveTimeRef } = useAppContext();

  const forceSaveToStorage = useCallback(() => {
    const packet = {
      folders: stateRef.current.folders,
      notes: stateRef.current.notes,
      trash: stateRef.current.trash,
      view: stateRef.current.view,
      currentFolder: stateRef.current.currentFolder,
    };
    localStorage.setItem('corkboard_pro_data', JSON.stringify(packet));
    changesCountRef.current = 0;
    lastSaveTimeRef.current = Date.now();
  }, [stateRef, changesCountRef, lastSaveTimeRef]);

  const saveToStorage = useCallback(() => {
    changesCountRef.current += 1;
    const now = Date.now();
    if (changesCountRef.current >= 10 || now - lastSaveTimeRef.current > 30000) {
      forceSaveToStorage();
    }
  }, [changesCountRef, lastSaveTimeRef, forceSaveToStorage]);

  const pushState = useCallback(() => {
    if (historyPtrRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyPtrRef.current + 1);
    }
    historyRef.current.push(JSON.stringify(stateRef.current.notes[stateRef.current.currentFolder] || []));
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyPtrRef.current = historyRef.current.length - 1;
    saveToStorage();
  }, [historyRef, historyPtrRef, saveToStorage, stateRef]);

  const undo = useCallback(() => {
    if (historyPtrRef.current > 0) {
      historyPtrRef.current--;
      stateRef.current.notes[stateRef.current.currentFolder] = JSON.parse(historyRef.current[historyPtrRef.current]);
      forceUpdate();
      forceSaveToStorage();
    }
  }, [forceUpdate, historyRef, historyPtrRef, forceSaveToStorage, stateRef]);

  const redo = useCallback(() => {
    if (historyPtrRef.current < historyRef.current.length - 1) {
      historyPtrRef.current++;
      stateRef.current.notes[stateRef.current.currentFolder] = JSON.parse(historyRef.current[historyPtrRef.current]);
      forceUpdate();
      forceSaveToStorage();
    }
  }, [forceUpdate, historyRef, historyPtrRef, forceSaveToStorage, stateRef]);

  const addNote = useCallback(() => {
    pushState();
    const cx = (-stateRef.current.view.x + window.innerWidth / 2) / stateRef.current.view.zoom - 120;
    const cy = (-stateRef.current.view.y + window.innerHeight / 2) / stateRef.current.view.zoom - 120;
    
    const note: Note = {
      id: 'n_' + Date.now(),
      x: cx,
      y: cy,
      w: 240,
      h: 240,
      content: '',
      color: 'yellow',
      z: Date.now(),
    };
    
    if (!stateRef.current.notes[stateRef.current.currentFolder]) {
      stateRef.current.notes[stateRef.current.currentFolder] = [];
    }
    stateRef.current.notes[stateRef.current.currentFolder].push(note);
    forceUpdate();
    pushState();
  }, [forceUpdate, pushState, stateRef]);

  const createFolder = useCallback((name: string) => {
    if (name && !stateRef.current.folders.includes(name)) {
      stateRef.current.folders.push(name);
      stateRef.current.notes[name] = [];
      stateRef.current.currentFolder = name;
      stateRef.current.selection.clear();
      historyRef.current = [];
      pushState();
      forceUpdate();
      forceSaveToStorage();
    }
  }, [forceUpdate, historyRef, pushState, forceSaveToStorage, stateRef]);

  const deleteFolder = useCallback((name: string) => {
    stateRef.current.folders = stateRef.current.folders.filter(f => f !== name);
    delete stateRef.current.notes[name];
    stateRef.current.currentFolder = stateRef.current.folders[0] || 'General';
    stateRef.current.selection.clear();
    historyRef.current = [];
    pushState();
    forceUpdate();
    forceSaveToStorage();
  }, [forceUpdate, historyRef, pushState, forceSaveToStorage, stateRef]);

  const switchFolder = useCallback((name: string) => {
    stateRef.current.currentFolder = name;
    stateRef.current.selection.clear();
    historyRef.current = [];
    pushState();
    forceUpdate();
    forceSaveToStorage();
  }, [forceUpdate, historyRef, pushState, forceSaveToStorage, stateRef]);

  const deleteSelection = useCallback(() => {
    if (stateRef.current.selection.size === 0) return;
    pushState();
    
    const currentList = stateRef.current.notes[stateRef.current.currentFolder] || [];
    const kept: Note[] = [];
    
    currentList.forEach(n => {
      if (stateRef.current.selection.has(n.id)) {
        stateRef.current.trash.push({
          data: n,
          folder: stateRef.current.currentFolder,
          date: new Date().toLocaleString(),
        });
      } else {
        kept.push(n);
      }
    });
    
    stateRef.current.notes[stateRef.current.currentFolder] = kept;
    stateRef.current.selection.clear();
    forceUpdate();
    pushState();
    
    if (contextMenuRef.current) {
      contextMenuRef.current.style.display = 'none';
    }
  }, [contextMenuRef, forceUpdate, pushState, stateRef]);

  return { saveToStorage, forceSaveToStorage, pushState, undo, redo, addNote, createFolder, deleteFolder, switchFolder, deleteSelection };
};
