import { useCallback } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { Note } from '@/lib/types';
import { syncStateToDb } from '@/lib/db';
import { improveText, brainstormIdeas } from '@/lib/gemini';

export const useActions = () => {
  const { stateRef, forceUpdate, historyRef, historyPtrRef, contextMenuRef, changesCountRef, lastSaveTimeRef, userId } = useAppContext();

  const forceSaveToStorage = useCallback(() => {
    syncStateToDb(userId, stateRef.current);
    changesCountRef.current = 0;
    lastSaveTimeRef.current = Date.now();
  }, [stateRef, changesCountRef, lastSaveTimeRef, userId]);

  const saveToStorage = useCallback(() => {
    changesCountRef.current += 1;
    const now = Date.now();
    if (changesCountRef.current >= 10 || now - lastSaveTimeRef.current > 10000) {
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

  const duplicateSelection = useCallback(() => {
    if (stateRef.current.selection.size === 0) return;
    pushState();
    
    const currentList = stateRef.current.notes[stateRef.current.currentFolder] || [];
    const newNotes: Note[] = [];
    const newSelection = new Set<string>();
    
    currentList.forEach(n => {
      if (stateRef.current.selection.has(n.id)) {
        const newId = 'n_' + Date.now() + Math.random().toString(36).substring(2, 9);
        newNotes.push({
          ...n,
          id: newId,
          x: n.x + 20,
          y: n.y + 20,
          z: Date.now(),
        });
        newSelection.add(newId);
      }
    });
    
    stateRef.current.notes[stateRef.current.currentFolder] = [...currentList, ...newNotes];
    stateRef.current.selection = newSelection;
    forceUpdate();
    pushState();
    
    if (contextMenuRef.current) {
      contextMenuRef.current.style.display = 'none';
    }
  }, [contextMenuRef, forceUpdate, pushState, stateRef]);

  const improveSelection = useCallback(async () => {
    if (stateRef.current.selection.size === 0) return;
    
    if (contextMenuRef.current) {
      contextMenuRef.current.style.display = 'none';
    }

    const folder = stateRef.current.currentFolder;
    const selectedIds = Array.from(stateRef.current.selection);
    
    let hasChanges = false;
    for (const id of selectedIds) {
      const note = stateRef.current.notes[folder]?.find(n => n.id === id);
      if (note && note.content) {
        const improved = await improveText(note.content);
        if (improved !== note.content) {
          note.content = improved;
          hasChanges = true;
          forceUpdate();
        }
      }
    }
    
    if (hasChanges) {
      pushState();
    }
  }, [contextMenuRef, forceUpdate, pushState, stateRef]);

  const brainstormNewNotes = useCallback(async () => {
    const folder = stateRef.current.currentFolder;
    const currentNotes = stateRef.current.notes[folder] || [];
    
    if (currentNotes.length === 0) return;
    
    const contextTexts = currentNotes.map(n => n.content).filter(Boolean);
    if (contextTexts.length === 0) return;

    const newIdeas = await brainstormIdeas(contextTexts);
    if (newIdeas.length === 0) return;

    pushState();
    
    const cx = (-stateRef.current.view.x + window.innerWidth / 2) / stateRef.current.view.zoom - 120;
    const cy = (-stateRef.current.view.y + window.innerHeight / 2) / stateRef.current.view.zoom - 120;
    
    const newNotes: Note[] = newIdeas.map((idea, index) => ({
      id: 'n_' + Date.now() + Math.random().toString(36).substring(2, 9),
      x: cx + (index * 40),
      y: cy + (index * 40),
      w: 240,
      h: 240,
      content: idea,
      color: 'blue',
      z: Date.now() + index,
    }));
    
    stateRef.current.notes[folder] = [...currentNotes, ...newNotes];
    forceUpdate();
    pushState();
  }, [forceUpdate, pushState, stateRef]);

  return { saveToStorage, forceSaveToStorage, pushState, undo, redo, addNote, createFolder, deleteFolder, switchFolder, deleteSelection, duplicateSelection, improveSelection, brainstormNewNotes };
};
