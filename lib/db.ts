import { supabase } from './supabase';
import { AppState, Note, TrashItem } from './types';

let lastSyncedState: string = '';

export function updateLastSyncedState(state: AppState) {
  lastSyncedState = JSON.stringify({
    folders: state.folders,
    currentFolder: state.currentFolder,
    notes: state.notes,
    trash: state.trash,
    view: state.view,
    tags: state.tags,
    viewMode: state.viewMode,
    sortBy: state.sortBy,
    activeFilters: state.activeFilters,
  });
}

export async function loadStateFromDb(userId: string): Promise<Partial<AppState> | null> {
  try {
    // Load folders
    const { data: foldersData, error: foldersError } = await supabase
      .from('folders')
      .select('name')
      .eq('user_id', userId);

    if (foldersError) throw foldersError;

    // Load notes
    const { data: notesData, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId);

    if (notesError) throw notesError;

    // Load settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    if (!settingsData && (!foldersData || foldersData.length === 0) && (!notesData || notesData.length === 0)) {
      // Try to load from local storage if DB is empty
      try {
        const localBackup = localStorage.getItem('corkboard_local_backup');
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          lastSyncedState = localBackup;
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to load from local storage', e);
      }
      return null; // No data found, will use default state
    }

    const folders = foldersData && foldersData.length > 0 
      ? foldersData.map(f => f.name) 
      : ['General'];
      
    const currentFolder = settingsData?.current_folder || folders[0] || 'General';
    const view = {
      x: settingsData?.view_x || 0,
      y: settingsData?.view_y || 0,
      zoom: settingsData?.view_zoom || 1,
    };

    const notes: Record<string, Note[]> = {};
    folders.forEach(f => notes[f] = []);
    const trash: TrashItem[] = [];

    if (notesData) {
      notesData.forEach(row => {
        const note: Note = {
          id: row.id,
          x: row.x,
          y: row.y,
          w: row.w,
          h: row.h,
          content: row.content || '',
          color: row.color || 'yellow',
          z: row.z || 0,
          isPinned: row.is_pinned || false,
          tags: row.tags || [],
          summary: row.summary || undefined,
          tasks: row.tasks || [],
          suggestions: row.suggestions || undefined,
        };
        
        if (row.is_trashed) {
          trash.push({
            data: note,
            folder: row.folder_name,
            date: row.trashed_at,
          });
        } else {
          if (!notes[row.folder_name]) notes[row.folder_name] = [];
          notes[row.folder_name].push(note);
        }
      });
    }

    const state = { 
      folders, currentFolder, notes, trash, view,
      tags: settingsData?.tags || [],
      viewMode: settingsData?.view_mode || 'canvas',
      sortBy: settingsData?.sort_by || 'manual',
      activeFilters: settingsData?.active_filters || { color: 'all', tags: [], date: 'all' }
    };
    lastSyncedState = JSON.stringify({
      folders: state.folders,
      currentFolder: state.currentFolder,
      notes: state.notes,
      trash: state.trash,
      view: state.view,
      tags: state.tags,
      viewMode: state.viewMode,
      sortBy: state.sortBy,
      activeFilters: state.activeFilters,
    });
    
    return state;
  } catch (error) {
    console.error('Error loading state from DB:', error);
    // Try to load from local storage if DB fails
    try {
      const localBackup = localStorage.getItem('corkboard_local_backup');
      if (localBackup) {
        const parsed = JSON.parse(localBackup);
        lastSyncedState = localBackup;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load from local storage', e);
    }
    return null;
  }
}

export async function getNoteVersions(noteId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching note versions:', error);
    return [];
  }

  return data;
}

export async function syncStateToDb(userId: string, currentState: AppState): Promise<boolean> {
  try {
    const currentJson = JSON.stringify({
      folders: currentState.folders,
      currentFolder: currentState.currentFolder,
      notes: currentState.notes,
      trash: currentState.trash,
      view: currentState.view,
      tags: currentState.tags,
      viewMode: currentState.viewMode,
      sortBy: currentState.sortBy,
      activeFilters: currentState.activeFilters,
    });

    // Save to local storage as backup
    try {
      localStorage.setItem('corkboard_local_backup', currentJson);
      localStorage.setItem('corkboard_local_backup_time', Date.now().toString());
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }

    if (currentJson === lastSyncedState) return true;

    const prev = lastSyncedState ? JSON.parse(lastSyncedState) : null;
    lastSyncedState = currentJson;

    // 1. Sync User Settings
    if (!prev || 
        prev.currentFolder !== currentState.currentFolder || 
        JSON.stringify(prev.view) !== JSON.stringify(currentState.view) ||
        JSON.stringify(prev.tags) !== JSON.stringify(currentState.tags) ||
        prev.viewMode !== currentState.viewMode ||
        prev.sortBy !== currentState.sortBy ||
        JSON.stringify(prev.activeFilters) !== JSON.stringify(currentState.activeFilters)
    ) {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        current_folder: currentState.currentFolder,
        view_x: currentState.view.x,
        view_y: currentState.view.y,
        view_zoom: currentState.view.zoom,
        tags: currentState.tags,
        view_mode: currentState.viewMode,
        sort_by: currentState.sortBy,
        active_filters: currentState.activeFilters,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    // 2. Sync Folders
    const currentFolders = new Set<string>(currentState.folders);
    const prevFolders = new Set<string>(prev?.folders || []);
    
    const addedFolders = [...currentFolders].filter(f => !prevFolders.has(f));
    const removedFolders = [...prevFolders].filter(f => !currentFolders.has(f));

    if (addedFolders.length > 0) {
      await supabase.from('folders').upsert(
        addedFolders.map(name => ({ user_id: userId, name })),
        { onConflict: 'user_id,name' }
      );
    }
    if (removedFolders.length > 0) {
      await supabase.from('folders')
        .delete()
        .eq('user_id', userId)
        .in('name', removedFolders);
    }

    // 3. Sync Notes & Trash
    const currentNotesMap = new Map<string, any>();
    Object.entries(currentState.notes).forEach(([folder, notes]) => {
      notes.forEach(n => currentNotesMap.set(n.id, { ...n, folder_name: folder, is_trashed: false }));
    });
    currentState.trash.forEach(t => {
      currentNotesMap.set(t.data.id, { ...t.data, folder_name: t.folder, is_trashed: true, trashed_at: t.date });
    });

    const prevNotesMap = new Map<string, any>();
    if (prev) {
      Object.entries(prev.notes).forEach(([folder, notes]: [string, any]) => {
        notes.forEach((n: any) => prevNotesMap.set(n.id, { ...n, folder_name: folder, is_trashed: false }));
      });
      prev.trash.forEach((t: any) => {
        prevNotesMap.set(t.data.id, { ...t.data, folder_name: t.folder, is_trashed: true, trashed_at: t.date });
      });
    }

    const notesToUpsert: any[] = [];
    const notesToDelete: string[] = [];

    currentNotesMap.forEach((note, id) => {
      const prevNote = prevNotesMap.get(id);
      if (!prevNote || JSON.stringify(note) !== JSON.stringify(prevNote)) {
        notesToUpsert.push({
          id: note.id,
          user_id: userId,
          folder_name: note.folder_name,
          x: note.x,
          y: note.y,
          w: note.w,
          h: note.h,
          content: note.content,
          color: note.color,
          z: note.z,
          is_pinned: note.isPinned || false,
          tags: note.tags || [],
          summary: note.summary || null,
          tasks: note.tasks || [],
          suggestions: note.suggestions || null,
          is_trashed: note.is_trashed,
          trashed_at: note.trashed_at || null,
          updated_at: new Date().toISOString(),
        });
      }
    });

    prevNotesMap.forEach((_, id) => {
      if (!currentNotesMap.has(id)) {
        notesToDelete.push(id);
      }
    });

    if (notesToUpsert.length > 0) {
      await supabase.from('notes').upsert(notesToUpsert, { onConflict: 'id' });
    }
    if (notesToDelete.length > 0) {
      await supabase.from('notes').delete().eq('user_id', userId).in('id', notesToDelete);
    }
    return true;
  } catch (error) {
    console.error('Error syncing state to DB:', error);
    // Revert lastSyncedState so it tries again next time
    lastSyncedState = '';
    return false;
  }
}
