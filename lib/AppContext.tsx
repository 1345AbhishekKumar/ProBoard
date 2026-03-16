'use client';
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { AppState } from './types';

type AppContextType = {
  stateRef: React.MutableRefObject<AppState>;
  forceUpdate: () => void;
  isMounted: boolean;
  historyRef: React.MutableRefObject<string[]>;
  historyPtrRef: React.MutableRefObject<number>;
  isDraggingRef: React.MutableRefObject<boolean>;
  dragModeRef: React.MutableRefObject<'pan' | 'move' | 'resize' | 'select' | null>;
  dragStartRef: React.MutableRefObject<{ x: number; y: number; screenX: number; screenY: number }>;
  lastMouseRef: React.MutableRefObject<{ x: number; y: number }>;
  resizeTargetRef: React.MutableRefObject<string | null>;
  worldRef: React.RefObject<HTMLDivElement | null>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  selectRectRef: React.RefObject<HTMLDivElement | null>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  minimapViewportRef: React.RefObject<HTMLDivElement | null>;
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTrashOpen: boolean;
  setIsTrashOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isSearchFocused: boolean;
  setIsSearchFocused: React.Dispatch<React.SetStateAction<boolean>>;
  changesCountRef: React.MutableRefObject<number>;
  lastSaveTimeRef: React.MutableRefObject<number>;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const stateRef = useRef<AppState>({
    folders: ['General'],
    currentFolder: 'General',
    notes: { 'General': [] },
    trash: [],
    selection: new Set<string>(),
    view: { x: 0, y: 0, zoom: 1 },
  });

  const historyRef = useRef<string[]>([]);
  const historyPtrRef = useRef<number>(-1);
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<'pan' | 'move' | 'resize' | 'select' | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, screenX: 0, screenY: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const resizeTargetRef = useRef<string | null>(null);

  const worldRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selectRectRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const minimapViewportRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const changesCountRef = useRef(0);
  const lastSaveTimeRef = useRef(0);

  useEffect(() => {
    lastSaveTimeRef.current = Date.now();
    const data = localStorage.getItem('corkboard_pro_data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        stateRef.current.folders = parsed.folders || ['General'];
        stateRef.current.currentFolder = parsed.currentFolder || 'General';
        stateRef.current.notes = parsed.notes || { 'General': [] };
        stateRef.current.trash = parsed.trash || [];
        stateRef.current.view = parsed.view || { x: 0, y: 0, zoom: 1 };
        if (!stateRef.current.notes[stateRef.current.currentFolder]) {
          stateRef.current.currentFolder = stateRef.current.folders[0] || 'General';
        }
      } catch (e) {
        console.error("Save Corrupt", e);
      }
    }
    setIsMounted(true);
    forceUpdate();

    const saveToStorage = () => {
      if (changesCountRef.current > 0) {
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
      }
    };

    const intervalId = setInterval(() => {
      saveToStorage();
    }, 30000);

    const handleBeforeUnload = () => {
      saveToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveToStorage();
    };
  }, [forceUpdate]);

  return (
    <AppContext.Provider value={{
      stateRef, forceUpdate, isMounted, historyRef, historyPtrRef, isDraggingRef, dragModeRef, dragStartRef, lastMouseRef, resizeTargetRef,
      worldRef, gridRef, selectRectRef, minimapCanvasRef, minimapViewportRef, contextMenuRef,
      isSidebarOpen, setIsSidebarOpen, isTrashOpen, setIsTrashOpen, searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
      changesCountRef, lastSaveTimeRef
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
