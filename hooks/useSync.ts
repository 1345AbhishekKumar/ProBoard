import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/AppContext';
import { loadStateFromDb, updateLastSyncedState, syncStateToDb } from '@/lib/db';

export const useSync = () => {
  const { stateRef, forceUpdate, userId, setSyncStatus, changesCountRef, lastSaveTimeRef } = useAppContext();

  // Handle offline/online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('saving');
      syncStateToDb(userId, stateRef.current).then(success => {
        if (success) {
          setSyncStatus('saved');
          changesCountRef.current = 0;
          lastSaveTimeRef.current = Date.now();
        } else {
          setSyncStatus('error');
        }
      });
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, stateRef, setSyncStatus, changesCountRef, lastSaveTimeRef]);

  // Handle Real-time sync
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`public:notes:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` }, async (payload) => {
        // Debounce or just reload state from DB to ensure consistency
        // For a robust system, reloading the state ensures we get all changes (folders, settings, etc.)
        // But to avoid overwriting local unsaved changes, we should merge.
        // For simplicity and reliability, if we receive a remote change, we can fetch the latest state.
        
        // Let's do a smart merge:
        const data = await loadStateFromDb(userId);
        if (data) {
          // Only update if there are no pending local changes
          if (changesCountRef.current === 0) {
            stateRef.current.folders = data.folders || ['General'];
            stateRef.current.currentFolder = data.currentFolder || 'General';
            stateRef.current.notes = data.notes || { 'General': [] };
            stateRef.current.trash = data.trash || [];
            stateRef.current.view = data.view || { x: 0, y: 0, zoom: 1 };
            stateRef.current.tags = data.tags || [];
            stateRef.current.viewMode = data.viewMode || 'canvas';
            stateRef.current.sortBy = data.sortBy || 'manual';
            stateRef.current.activeFilters = data.activeFilters || { color: 'all', tags: [], date: 'all' };
            
            updateLastSyncedState(stateRef.current);
            forceUpdate();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, stateRef, forceUpdate, changesCountRef]);

  // Periodic backup
  useEffect(() => {
    const interval = setInterval(() => {
      if (changesCountRef.current > 0) {
        setSyncStatus('saving');
        syncStateToDb(userId, stateRef.current).then(success => {
          if (success) {
            setSyncStatus('saved');
            changesCountRef.current = 0;
            lastSaveTimeRef.current = Date.now();
          } else {
            setSyncStatus(navigator.onLine ? 'error' : 'offline');
          }
        });
      }
    }, 5000); // Check every 5 seconds for pending changes

    return () => clearInterval(interval);
  }, [userId, stateRef, setSyncStatus, changesCountRef, lastSaveTimeRef]);
};
