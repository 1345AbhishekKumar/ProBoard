'use client';
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { AppState } from './types';
import { loadStateFromDb, syncStateToDb } from './db';

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
  showVersionHistory: boolean;
  setShowVersionHistory: React.Dispatch<React.SetStateAction<boolean>>;
  versionHistoryNoteId: string | null;
  setVersionHistoryNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  changesCountRef: React.MutableRefObject<number>;
  lastSaveTimeRef: React.MutableRefObject<number>;
  userId: string;
  syncStatus: 'saved' | 'saving' | 'error' | 'offline';
  setSyncStatus: React.Dispatch<React.SetStateAction<'saved' | 'saving' | 'error' | 'offline'>>;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children, userId }: { children: React.ReactNode, userId: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const stateRef = useRef<AppState>({
    folders: ['General'],
    currentFolder: 'General',
    notes: { 'General': [] },
    templates: [],
    trash: [],
    selection: new Set<string>(),
    view: { x: 0, y: 0, zoom: 1 },
    tags: [],
    viewMode: 'canvas',
    sortBy: 'manual',
    activeFilters: { color: 'all', tags: [], date: 'all' },
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryNoteId, setVersionHistoryNoteId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');

  const changesCountRef = useRef(0);
  const lastSaveTimeRef = useRef(0);

  useEffect(() => {
    let isSubscribed = true;

    const initData = async () => {
      const data = await loadStateFromDb(userId);
      if (isSubscribed) {
        if (data) {
          stateRef.current.folders = data.folders || ['General'];
          stateRef.current.currentFolder = data.currentFolder || 'General';
          stateRef.current.notes = data.notes || { 'General': [] };
          stateRef.current.trash = data.trash || [];
          stateRef.current.view = data.view || { x: 0, y: 0, zoom: 1 };
          if (!stateRef.current.notes[stateRef.current.currentFolder]) {
            stateRef.current.currentFolder = stateRef.current.folders[0] || 'General';
          }
        } else {
          // Fallback to local storage for migration
          const localData = localStorage.getItem('corkboard_pro_data');
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              stateRef.current.folders = parsed.folders || ['General'];
              stateRef.current.currentFolder = parsed.currentFolder || 'General';
              stateRef.current.notes = parsed.notes || { 'General': [] };
              stateRef.current.trash = parsed.trash || [];
              stateRef.current.view = parsed.view || { x: 0, y: 0, zoom: 1 };
              if (!stateRef.current.notes[stateRef.current.currentFolder]) {
                stateRef.current.currentFolder = stateRef.current.folders[0] || 'General';
              }
              // Force initial sync to migrate data to DB
              syncStateToDb(userId, stateRef.current);
            } catch (e) {
              console.error("Local save corrupt", e);
            }
          }
        }
        lastSaveTimeRef.current = Date.now();
        setIsMounted(true);
        forceUpdate();
      }
    };

    initData();

    return () => {
      isSubscribed = false;
    };
  }, [userId, forceUpdate]);

  useEffect(() => {
    if (!isMounted) return;

    const saveToStorage = async () => {
      if (changesCountRef.current > 0) {
        setSyncStatus('saving');
        const success = await syncStateToDb(userId, stateRef.current);
        if (success) {
          setSyncStatus('saved');
        } else {
          setSyncStatus('offline');
        }
        changesCountRef.current = 0;
        lastSaveTimeRef.current = Date.now();
      }
    };

    const intervalId = setInterval(() => {
      saveToStorage();
    }, 10000); // Sync every 10 seconds if there are changes

    const handleBeforeUnload = () => {
      saveToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveToStorage();
    };
  }, [isMounted, userId]);

  return (
    <AppContext.Provider value={{
      stateRef, forceUpdate, isMounted, historyRef, historyPtrRef, isDraggingRef, dragModeRef, dragStartRef, lastMouseRef, resizeTargetRef,
      worldRef, gridRef, selectRectRef, minimapCanvasRef, minimapViewportRef, contextMenuRef,
      isSidebarOpen, setIsSidebarOpen, isTrashOpen, setIsTrashOpen, searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
      showVersionHistory, setShowVersionHistory, versionHistoryNoteId, setVersionHistoryNoteId,
      changesCountRef, lastSaveTimeRef, userId, syncStatus, setSyncStatus
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
