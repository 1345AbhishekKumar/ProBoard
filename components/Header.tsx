import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Plus, Undo, Redo, Menu, Search, Sparkles, Loader2, Filter, ChevronDown, Trash2, BrainCircuit, Mic, MicOff, Download } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { useActions } from '@/hooks/useActions';
import { Note, COLORS } from '@/lib/types';
import { semanticSearch } from '@/lib/gemini';

import { exportToPDF, exportToMarkdown, exportToPlainText } from '@/lib/exportUtils';

export default function Header() {
  const { 
    stateRef, isSidebarOpen, setIsSidebarOpen, forceUpdate,
    searchQuery, setSearchQuery, isSearchFocused, setIsSearchFocused,
    worldRef, gridRef
  } = useAppContext();
  const { undo, redo, addNote, addNoteFromTemplate, deleteTemplate, switchFolder, saveToStorage, brainstormNewNotes } = useActions();
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticResultIds, setSemanticResultIds] = useState<string[] | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            // Add a new note with the transcript
            const folder = stateRef.current.currentFolder;
            const newNote: Note = {
              id: 'note_' + Date.now() + Math.random().toString(36).substring(2, 9),
              x: window.innerWidth / 2 - 128 - stateRef.current.view.x,
              y: window.innerHeight / 2 - 128 - stateRef.current.view.y,
              w: 256,
              h: 256,
              content: `<p>${transcript}</p>`,
              color: 'yellow',
              z: Date.now(),
              isPinned: false,
              tags: [],
            };
            if (!stateRef.current.notes[folder]) stateRef.current.notes[folder] = [];
            stateRef.current.notes[folder].push(newNote);
            stateRef.current.selection.clear();
            stateRef.current.selection.add(newNote.id);
            forceUpdate();
            saveToStorage();
          }
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [forceUpdate, saveToStorage, stateRef]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };
  const [showTemplates, setShowTemplates] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const templatesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        setShowFilters(false);
      }
      if (templatesContainerRef.current && !templatesContainerRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
      if (exportContainerRef.current && !exportContainerRef.current.contains(event.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSearchFocused]);

  const handleBrainstorm = async () => {
    if (isBrainstorming) return;
    setIsBrainstorming(true);
    await brainstormNewNotes();
    setIsBrainstorming(false);
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || isSemanticSearching) return;
    setIsSemanticSearching(true);
    
    const allNotes: { id: string, content: string }[] = [];
    for (const folder of stateRef.current.folders) {
      const notes = stateRef.current.notes[folder] || [];
      for (const note of notes) {
        if (note.content) {
          allNotes.push({ id: note.id, content: note.content });
        }
      }
    }
    
    const matchingIds = await semanticSearch(searchQuery, allNotes);
    setSemanticResultIds(matchingIds);
    setIsSemanticSearching(false);
  };

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

  const handleSearchResultClick = useCallback((folder: string, note: Note) => {
    if (stateRef.current.currentFolder !== folder) {
      switchFolder(folder);
    }
    
    const targetX = note.x + note.w / 2;
    const targetY = note.y + note.h / 2;
    
    stateRef.current.view.x = window.innerWidth / 2 - targetX * stateRef.current.view.zoom;
    stateRef.current.view.y = window.innerHeight / 2 - targetY * stateRef.current.view.zoom;
    
    stateRef.current.selection.clear();
    stateRef.current.selection.add(note.id);
    stateRef.current.viewMode = 'canvas';
    
    setSearchQuery('');
    setIsSearchFocused(false);
    setShowFilters(false);
    
    updateTransform();
    forceUpdate();
    saveToStorage();
  }, [forceUpdate, setIsSearchFocused, setSearchQuery, stateRef, switchFolder, updateTransform, saveToStorage]);

  const searchResults: { folder: string; note: Note }[] = [];
  const filters = stateRef.current.activeFilters;
  const hasActiveFilters = filters.color !== 'all' || filters.date !== 'all' || filters.tags.length > 0;
  
  if (searchQuery.trim() || hasActiveFilters) {
    const query = searchQuery.toLowerCase();
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (const folder of stateRef.current.folders) {
      const notes = stateRef.current.notes[folder] || [];
      for (const note of notes) {
        const textContent = note.content.replace(/<[^>]*>?/gm, '').toLowerCase();
        
        let matchesQuery = true;
        if (semanticResultIds !== null) {
          matchesQuery = semanticResultIds.includes(note.id);
        } else if (query) {
          matchesQuery = textContent.includes(query);
        }
        
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
        
        if (matchesQuery && matchesColor && matchesDate && matchesTags) {
          searchResults.push({ folder, note });
        }
      }
    }
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 z-20 flex-shrink-0 absolute top-0 left-0 right-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-slate-200"></div>
        <span className="font-semibold text-[15px] text-slate-900 tracking-tight">
          {stateRef.current.currentFolder}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
        <button
          onClick={undo}
          className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          className="p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-md transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 max-w-md mx-8 relative" ref={searchContainerRef}>
        <div className="relative flex items-center group">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSemanticResultIds(null);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSemanticSearch();
              }
            }}
            className="w-full bg-slate-100/50 border border-slate-200/60 rounded-lg pl-9 pr-20 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-slate-400 text-slate-900"
          />
          <button
            onClick={handleSemanticSearch}
            disabled={isSemanticSearching || !searchQuery.trim()}
            className={`absolute right-10 p-1.5 rounded-lg transition-colors ${isSemanticSearching ? 'text-blue-400' : semanticResultIds !== null ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Semantic Search (Enter)"
          >
            {isSemanticSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setShowFilters(!showFilters);
              setIsSearchFocused(true);
            }}
            className={`absolute right-2 p-1.5 rounded-lg transition-colors ${hasActiveFilters ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
            title="Search Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {showFilters && (
          <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-[60] flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    stateRef.current.activeFilters.color = 'all';
                    forceUpdate();
                    saveToStorage();
                  }}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${filters.color === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  All
                </button>
                {Object.entries(COLORS).map(([name, { bg, border }]) => (
                  <button
                    key={name}
                    onClick={() => {
                      stateRef.current.activeFilters.color = name;
                      forceUpdate();
                      saveToStorage();
                    }}
                    className={`w-6 h-6 rounded-full border transition-transform ${filters.color === name ? 'scale-110 ring-2 ring-slate-400 ring-offset-1 border-transparent' : 'hover:scale-110'}`}
                    style={{ backgroundColor: bg, borderColor: border }}
                    title={name}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Modified Date</label>
              <select
                value={filters.date}
                onChange={(e) => {
                  stateRef.current.activeFilters.date = e.target.value;
                  forceUpdate();
                  saveToStorage();
                }}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-800"
              >
                <option value="all">Any time</option>
                <option value="today">Past 24 hours</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {stateRef.current.tags.length === 0 ? (
                  <span className="text-xs text-slate-400">No tags created yet.</span>
                ) : (
                  stateRef.current.tags.map(tag => {
                    const isActive = filters.tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (isActive) {
                            stateRef.current.activeFilters.tags = filters.tags.filter(id => id !== tag.id);
                          } else {
                            stateRef.current.activeFilters.tags.push(tag.id);
                          }
                          forceUpdate();
                          saveToStorage();
                        }}
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        style={isActive ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' } : {}}
                      >
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={() => {
                  stateRef.current.activeFilters = { color: 'all', tags: [], date: 'all' };
                  forceUpdate();
                  saveToStorage();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 text-center mt-1"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
        
        {isSearchFocused && (searchQuery.trim() || hasActiveFilters) && !showFilters && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No notes found</div>
            ) : (
              searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => handleSearchResultClick(res.folder, res.note)}
                  className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="text-xs font-semibold text-blue-500 mb-1">{res.folder}</div>
                  <div className="text-sm text-slate-700 line-clamp-2">
                    {res.note.content.replace(/<[^>]*>?/gm, '') || 'Empty note'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
          <button
            onClick={() => {
              stateRef.current.viewMode = 'canvas';
              forceUpdate();
              saveToStorage();
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${stateRef.current.viewMode === 'canvas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Canvas
          </button>
          <button
            onClick={() => {
              stateRef.current.viewMode = 'grid';
              forceUpdate();
              saveToStorage();
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${stateRef.current.viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Grid
          </button>
        </div>

        <select
          value={stateRef.current.sortBy}
          onChange={(e) => {
            stateRef.current.sortBy = e.target.value as any;
            forceUpdate();
            saveToStorage();
          }}
          className="bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-slate-700"
        >
          <option value="manual">Manual Sort</option>
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
        </select>

        <div className="text-xs font-mono font-medium text-slate-400 w-12 text-right">
          {Math.round(stateRef.current.view.zoom * 100)}%
        </div>
        <div className="relative" ref={exportContainerRef}>
          <button 
            onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200/60 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Export Notes"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          {showExport && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200/60 overflow-hidden z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    const folderName = stateRef.current.currentFolder;
                    const notes = stateRef.current.notes[folderName] || [];
                    exportToPDF(notes, folderName);
                    setShowExport(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    const folderName = stateRef.current.currentFolder;
                    const notes = stateRef.current.notes[folderName] || [];
                    exportToMarkdown(notes, folderName);
                    setShowExport(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Export as Markdown
                </button>
                <button
                  onClick={() => {
                    const folderName = stateRef.current.currentFolder;
                    const notes = stateRef.current.notes[folderName] || [];
                    exportToPlainText(notes, folderName);
                    setShowExport(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Export as Plain Text
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleBrainstorm}
          disabled={isBrainstorming}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-indigo-200/50"
          title="AI Brainstorm Ideas"
        >
          {isBrainstorming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Brainstorm
        </button>
        <div className="relative flex" ref={templatesContainerRef}>
          <button
            onClick={toggleListening}
            className={`px-3 py-2 rounded-l-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center transform active:scale-95 border-r border-slate-700 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
            title={isListening ? "Stop listening" : "Voice Note"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={addNote}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-all flex items-center gap-2 transform active:scale-95 border-r border-slate-700"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-2 py-2 rounded-r-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center transform active:scale-95"
            title="Templates"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showTemplates && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200/60 rounded-xl shadow-xl overflow-hidden z-[60]">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Templates</h3>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {(!stateRef.current.templates || stateRef.current.templates.length === 0) ? (
                  <div className="p-4 text-xs text-slate-500 text-center">
                    No templates yet.<br/>Right-click a note to save it as a template.
                  </div>
                ) : (
                  stateRef.current.templates.map(template => (
                    <div
                      key={template.id}
                      className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        addNoteFromTemplate(template.id);
                        setShowTemplates(false);
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div 
                          className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: COLORS[template.color as keyof typeof COLORS]?.bg || COLORS.yellow.bg }}
                        />
                        <span className="text-sm text-slate-700 truncate">{template.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
